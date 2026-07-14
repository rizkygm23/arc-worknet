import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

// 1. Parse existing .env
const env = {};
let envContent = "";
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const firstEq = trimmed.indexOf("=");
      if (firstEq !== -1) {
        const key = trimmed.slice(0, firstEq).trim();
        const val = trimmed.slice(firstEq + 1).trim().replace(/^['"]|['"]$/g, "");
        env[key] = val;
      }
    }
  });
} else {
  console.error("Error: .env file not found in the root directory.");
  process.exit(1);
}

const circleApiKey = env.CIRCLE_API_KEY;
if (!circleApiKey) {
  console.error("\n[Error] CIRCLE_API_KEY is not set in your .env file.");
  console.error("Please add your Circle API key to the CIRCLE_API_KEY variable in .env first.\n");
  process.exit(1);
}

async function run() {
  console.log("====================================================");
  console.log("          Circle Wallet Setup & Encryption          ");
  console.log("====================================================");

  // 2. Resolve/Generate Entity Secret
  let entitySecretHex = env.CIRCLE_ENTITY_SECRET;
  if (!entitySecretHex || entitySecretHex.length !== 64) {
    console.log("Generating a new 32-byte (64-char hex) entity secret...");
    entitySecretHex = crypto.randomBytes(32).toString("hex");
    console.log(`Generated: ${entitySecretHex}`);
  } else {
    console.log("Using existing CIRCLE_ENTITY_SECRET from .env.");
  }

  // 3. Fetch Entity Public Key from Circle
  console.log("Fetching entity public key from Circle...");
  const pubKeyUrl = "https://api.circle.com/v1/w3s/config/entity/publicKey";
  
  let publicKeyPem = "";
  try {
    const res = await fetch(pubKeyUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${circleApiKey}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to fetch public key: HTTP ${res.status} - ${errorText}`);
    }

    const payload = await res.json();
    publicKeyPem = payload.data?.publicKey;
    if (!publicKeyPem) {
      throw new Error("Public key not found in API response payload.");
    }
    console.log("Successfully retrieved entity public key.");
  } catch (err) {
    console.error(`\n[API Error] ${err.message}`);
    process.exit(1);
  }

  // 4. Encrypt Entity Secret
  console.log("Encrypting entity secret using RSA-OAEP (SHA-256)...");
  let ciphertext = "";
  try {
    const secretBuffer = Buffer.from(entitySecretHex, "hex");
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      secretBuffer
    );
    ciphertext = encrypted.toString("base64");
    console.log("Ciphertext generated successfully.");
  } catch (err) {
    console.error(`\n[Encryption Error] ${err.message}`);
    process.exit(1);
  }

  // 5. Create Wallet Set (if not already set)
  let walletSetId = env.CIRCLE_WALLET_SET_ID;
  if (!walletSetId) {
    console.log("No CIRCLE_WALLET_SET_ID found. Creating a new Developer Wallet Set...");
    const walletSetsUrl = "https://api.circle.com/v1/w3s/developer/walletSets";
    
    try {
      const res = await fetch(walletSetsUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${circleApiKey}`,
        },
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          name: "Arc Worknet Wallet Set",
          entitySecretCiphertext: ciphertext,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to create wallet set: HTTP ${res.status} - ${errorText}`);
      }

      const payload = await res.json();
      walletSetId = payload.data?.walletSet?.id;
      if (!walletSetId) {
        throw new Error("Wallet set ID not found in API response payload.");
      }
      console.log(`Successfully created Wallet Set! ID: ${walletSetId}`);
    } catch (err) {
      console.error(`\n[Wallet Set Error] ${err.message}`);
      console.error("Skipping wallet set creation. You can try again later.");
    }
  } else {
    console.log(`Using existing CIRCLE_WALLET_SET_ID: ${walletSetId}`);
  }

  // 6. Update .env file
  console.log("\nUpdating .env file with new values...");
  
  const lines = envContent.split(/\r?\n/);
  const updates = {
    CIRCLE_ENTITY_SECRET: entitySecretHex,
    CIRCLE_ENTITY_SECRET_CIPHERTEXT: ciphertext,
  };
  if (walletSetId) {
    updates.CIRCLE_WALLET_SET_ID = walletSetId;
  }

  const updatedKeys = new Set();
  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const firstEq = trimmed.indexOf("=");
      if (firstEq !== -1) {
        const key = trimmed.slice(0, firstEq).trim();
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          updatedKeys.add(key);
          return `${key}=${updates[key]}`;
        }
      }
    }
    return line;
  });

  // Add any updates that weren't in the original file
  for (const [key, val] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      newLines.push(`${key}=${val}`);
    }
  }

  fs.writeFileSync(envPath, newLines.join("\n"), "utf-8");
  console.log("Successfully updated .env!");
  console.log("====================================================");
  console.log("  CIRCLE_ENTITY_SECRET and CIRCLE_ENTITY_SECRET_CIPHERTEXT");
  console.log("  have been saved and synchronized with Circle.");
  console.log("====================================================");
}

run();
