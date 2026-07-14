import { env } from "@/lib/env";
import crypto from "crypto";

type CircleWalletResponse = {
  data?: {
    wallets?: Array<{
      id?: string;
      walletSetId?: string;
      address?: string;
      blockchain?: string;
    }>;
  };
  message?: string;
};

type CircleSignTransactionResponse = {
  data?: {
    signature?: string;
    signedTransaction?: string;
    txHash?: string;
  };
  message?: string;
};

export type CreatedCircleWallet = {
  walletId: string;
  walletSetId: string;
  address: string;
  blockchain: string;
};

export type CircleSignedTransaction = {
  signedTransaction: string;
  txHash?: string;
};

const CIRCLE_API_BASE_URL = "https://api.circle.com";

export function hasCircleWalletConfig() {
  return Boolean(
    env.CIRCLE_API_KEY &&
      env.CIRCLE_WALLET_SET_ID &&
      env.CIRCLE_WALLET_BLOCKCHAIN &&
      env.CIRCLE_ENTITY_SECRET,
  );
}

export async function getFreshEntitySecretCiphertext() {
  if (!env.CIRCLE_ENTITY_SECRET || !env.CIRCLE_API_KEY) {
    throw new Error("Missing CIRCLE_ENTITY_SECRET or CIRCLE_API_KEY in environment.");
  }

  const res = await fetch(`${CIRCLE_API_BASE_URL}/v1/w3s/config/entity/publicKey`, {
    method: "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${env.CIRCLE_API_KEY}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Circle public key: ${errorText}`);
  }

  const payload = await res.json();
  const publicKeyPem = payload.data?.publicKey;
  if (!publicKeyPem) {
    throw new Error("Circle public key not found in API response.");
  }

  const secretBuffer = Buffer.from(env.CIRCLE_ENTITY_SECRET, "hex");
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    secretBuffer
  );

  return encrypted.toString("base64");
}

export async function createDeveloperControlledWallet() {
  if (!hasCircleWalletConfig()) {
    throw new Error(
      "Missing Circle wallet env. Set CIRCLE_API_KEY, CIRCLE_WALLET_SET_ID, CIRCLE_WALLET_BLOCKCHAIN, and CIRCLE_ENTITY_SECRET.",
    );
  }

  const ciphertext = await getFreshEntitySecretCiphertext();

  const response = await fetch(`${CIRCLE_API_BASE_URL}/v1/w3s/developer/wallets`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${env.CIRCLE_API_KEY}`,
    },
    body: JSON.stringify({
      idempotencyKey: crypto.randomUUID(),
      walletSetId: env.CIRCLE_WALLET_SET_ID,
      accountType: "EOA",
      blockchains: [env.CIRCLE_WALLET_BLOCKCHAIN],
      count: 1,
      entitySecretCiphertext: ciphertext,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as CircleWalletResponse;
  const wallet = payload.data?.wallets?.[0];
  if (!response.ok || !wallet?.id || !wallet.walletSetId || !wallet.address || !wallet.blockchain) {
    throw new Error(payload.message || "Circle wallet creation failed.");
  }

  return {
    walletId: wallet.id,
    walletSetId: wallet.walletSetId,
    address: wallet.address,
    blockchain: wallet.blockchain,
  } satisfies CreatedCircleWallet;
}

export async function signCircleEvmTransaction(input: {
  walletId: string;
  entitySecretCiphertext: string;
  transaction: Record<string, string | number>;
}) {
  const response = await fetch(`${CIRCLE_API_BASE_URL}/v1/w3s/developer/sign/transaction`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${env.CIRCLE_API_KEY}`,
    },
    body: JSON.stringify({
      walletId: input.walletId,
      blockchain: env.CIRCLE_WALLET_BLOCKCHAIN,
      entitySecretCiphertext: input.entitySecretCiphertext,
      transaction: JSON.stringify(input.transaction),
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as CircleSignTransactionResponse;
  const signedTransaction = payload.data?.signedTransaction;
  if (!response.ok || !signedTransaction) {
    throw new Error(payload.message || "Circle transaction signing failed.");
  }

  return {
    signedTransaction,
    txHash: payload.data?.txHash,
  } satisfies CircleSignedTransaction;
}
