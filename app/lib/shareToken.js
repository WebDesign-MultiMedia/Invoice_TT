import crypto from "crypto";

// Server-only. Creates and resolves secure public invoice share tokens
// without needing any database: the token itself is an AES-256-GCM
// encrypted reference to the invoice ID, decryptable only with the server's
// INVOICE_SHARE_SECRET. Nothing about the invoice (ID, name, phone) is
// visible or derivable from the token string.
//
// The encryption is deterministic per invoiceId (the IV is derived from a
// hash of the invoiceId, not randomly generated), so the same invoice
// always produces the same token - this lets "generate a link" naturally
// reuse an existing link instead of minting unlimited duplicates, with no
// storage needed to track "does a share already exist." This is safe for
// GCM's per-message-IV-uniqueness requirement because invoice IDs are
// already unique, so no (key, IV) pair is ever reused for different data.
//
// Trade-off: because there's no stored state, revoking one specific link
// isn't possible without adding persistent storage later. Rotating
// INVOICE_SHARE_SECRET invalidates every link at once, as a blunt fallback.

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const secret = process.env.INVOICE_SHARE_SECRET;
  if (!secret) {
    throw new Error("Missing INVOICE_SHARE_SECRET environment variable.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function deriveIv(invoiceId) {
  return crypto.createHash("sha256").update(invoiceId).digest().subarray(0, 12);
}

export function createShareToken(invoiceId) {
  const key = getKey();
  const iv = deriveIv(invoiceId);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(invoiceId, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64url");
}

// Returns the original invoiceId if the token is valid and untampered,
// otherwise null.
export function resolveShareToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const key = getKey();
    const combined = Buffer.from(token, "base64url");
    if (combined.length < 28) return null;

    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    return null;
  }
}
