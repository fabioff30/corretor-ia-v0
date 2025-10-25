/**
 * Lightweight helpers for anonymising identifiers before they are sent to analytics.
 * Uses SHA-256 via the Web Crypto API when available and falls back to a coarse mask.
 */

const FALLBACK_SUFFIX_LENGTH = 8

function fallbackMask(value: string, prefix: string) {
  const stripped = value.replace(/[^a-zA-Z0-9]/g, "")
  const suffix = stripped.slice(-FALLBACK_SUFFIX_LENGTH) || "anon"
  return `${prefix}_${suffix}`
}

export async function obfuscateIdentifier(
  value?: string | null,
  prefix: string = "id"
): Promise<string> {
  if (!value) {
    return `${prefix}_anon`
  }

  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return fallbackMask(value, prefix)
  }

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(value)
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer)).slice(0, 6)
    const hash = hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("")
    return `${prefix}_${hash}`
  } catch (error) {
    console.warn("[Analytics] Failed to hash identifier, using fallback mask.", error)
    return fallbackMask(value, prefix)
  }
}
