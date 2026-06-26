import crypto from "crypto";

const DEFAULT_COST_N = 32768; // 2x default for better GPU/ASIC resistance
const DEFAULT_COST_R = 8;
const DEFAULT_COST_P = 1;
const SCRYPT_KEYLEN = 64;

interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

/**
 * Hash a password using scrypt with versioned cost parameters.
 * Format: scrypt:v1:N:r:p:saltHex:keyHex
 * This allows upgrading cost parameters in the future.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: DEFAULT_COST_N,
    r: DEFAULT_COST_R,
    p: DEFAULT_COST_P,
  });
  return `scrypt:v1:${DEFAULT_COST_N}:${DEFAULT_COST_R}:${DEFAULT_COST_P}:${salt.toString("hex")}:${key.toString("hex")}`;
}

/**
 * Verify a password against a stored hash.
 * Supports both legacy (scrypt:salt:key) and versioned (scrypt:v1:N:r:p:salt:key) formats.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");

  // Versioned format: scrypt:v1:N:r:p:saltHex:keyHex
  if (parts[0] === "scrypt" && parts[1] === "v1") {
    const [, , N, r, p, saltHex, keyHex] = parts;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(keyHex, "hex");
    const actual = crypto.scryptSync(password, salt, expected.length, {
      N: parseInt(N, 10),
      r: parseInt(r, 10),
      p: parseInt(p, 10),
    });
    return crypto.timingSafeEqual(expected, actual);
  }

  // Legacy format: scrypt:salt:key (no cost parameters, uses defaults)
  const [algo, saltHex, keyHex] = parts;
  if (algo !== "scrypt" || !saltHex || !keyHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

/**
 * Check if a stored hash needs to be rehased with stronger parameters.
 * Returns true if the hash uses an older/lower cost configuration.
 */
export function needsRehash(stored: string): boolean {
  const parts = stored.split(":");
  if (parts[0] !== "scrypt" || parts[1] !== "v1") return true;
  const N = parseInt(parts[2], 10);
  return N < DEFAULT_COST_N;
}