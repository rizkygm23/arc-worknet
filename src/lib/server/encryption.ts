import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const PREFIX = "enc:v1";

type EncryptedJsonEnvelope = {
  __worknet_encrypted: "v1";
  iv: string;
  tag: string;
  data: string;
};

function getKey() {
  if (!env.DATA_ENCRYPTION_KEY) return undefined;
  return createHash("sha256").update(env.DATA_ENCRYPTION_KEY).digest();
}

function encryptString(value: string) {
  const key = getKey();
  if (!key) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`;
}

function decryptString(value: string) {
  if (!value.startsWith(`${PREFIX}:`)) return value;
  const key = getKey();
  if (!key) return "";

  const [, , iv, tag, data] = value.split(":");
  if (!iv || !tag || !data) return "";

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return "";
  }
}

export function encryptText(value?: string) {
  return value ? encryptString(value) : value;
}

export function decryptText(value?: string | null) {
  return value ? decryptString(value) : "";
}

export function encryptJson(value: Record<string, unknown>) {
  const encrypted = encryptString(JSON.stringify(value));
  if (!encrypted.startsWith(`${PREFIX}:`)) return value;

  const [, , iv, tag, data] = encrypted.split(":");
  return {
    __worknet_encrypted: "v1",
    iv,
    tag,
    data,
  } satisfies EncryptedJsonEnvelope;
}

export function decryptJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Partial<EncryptedJsonEnvelope> & Record<string, unknown>;
  if (record.__worknet_encrypted !== "v1") return record;
  if (typeof record.iv !== "string" || typeof record.tag !== "string" || typeof record.data !== "string") {
    return {};
  }

  const decrypted = decryptString(`${PREFIX}:${record.iv}:${record.tag}:${record.data}`);
  if (!decrypted) return {};

  try {
    const parsed = JSON.parse(decrypted) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
