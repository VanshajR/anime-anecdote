import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { MalSessionPayload } from "./types";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

const getKey = () => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return createHash("sha256").update(secret).digest();
};

// Generic AES-256-GCM session cookie. Used for the MAL session and the AniList session alike —
// each provider stores its own payload shape under its own cookie name.
export const encodeSession = <T>(payload: T): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".");
};

export const decodeSession = <T = MalSessionPayload>(token: string | undefined): T | null => {
  if (!token) return null;
  const [ivPart, tagPart, dataPart] = token.split(".");
  if (!ivPart || !tagPart || !dataPart) return null;
  try {
    const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivPart, "base64"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataPart, "base64")),
      decipher.final(),
    ]);
    return JSON.parse(decrypted.toString()) as T;
  } catch {
    return null;
  }
};

export const isSessionExpired = (session: { acquiredAt: number; expires_in: number } | null): boolean => {
  if (!session) return true;
  const elapsed = Date.now() - session.acquiredAt;
  // Refresh a minute before expiry
  return elapsed >= (session.expires_in - 60) * 1000;
};
