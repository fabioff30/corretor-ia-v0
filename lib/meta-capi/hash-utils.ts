/**
 * Meta CAPI Hashing Utilities
 *
 * Provides SHA256 hashing with proper normalization for Meta Conversions API
 *
 * Meta Requirements:
 * - All PII must be hashed with SHA256
 * - Values must be lowercase and trimmed before hashing
 * - Phone numbers must be in E.164 format (digits only)
 * - Email must be lowercase, trimmed, no leading/trailing whitespace
 *
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */

import { createHash } from 'crypto'

/**
 * Hash a value using SHA256 with Meta's normalization rules
 * Returns lowercase hex string
 */
export function hashForMeta(value: string | undefined | null): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined
  }

  const normalized = value.toLowerCase().trim()
  if (!normalized) {
    return undefined
  }

  return createHash('sha256').update(normalized).digest('hex')
}

/**
 * Normalize and hash an email address
 * - Lowercase
 * - Trim whitespace
 * - Remove dots from local part (Gmail normalization)
 */
export function hashEmail(email: string | undefined | null): string | undefined {
  if (!email || typeof email !== 'string') {
    return undefined
  }

  let normalized = email.toLowerCase().trim()

  // Gmail normalization: remove dots from local part
  // e.g., john.doe@gmail.com -> johndoe@gmail.com
  const parts = normalized.split('@')
  if (parts.length === 2 && parts[1].includes('gmail')) {
    parts[0] = parts[0].replace(/\./g, '')
    normalized = parts.join('@')
  }

  if (!normalized || !normalized.includes('@')) {
    return undefined
  }

  return createHash('sha256').update(normalized).digest('hex')
}

/**
 * Normalize a Brazilian phone number to E.164 format and hash
 *
 * Accepts:
 * - 11988887777 (11 digits, no country code)
 * - 5511988887777 (13 digits, with country code)
 * - (11) 98888-7777 (formatted)
 * - +55 11 98888-7777 (international)
 *
 * Returns hashed E.164 format: 5511988887777
 */
export function hashPhone(phone: string | undefined | null): string | undefined {
  if (!phone || typeof phone !== 'string') {
    return undefined
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  if (!digits || digits.length < 10) {
    return undefined
  }

  let e164: string

  // Already has country code (55)
  if (digits.startsWith('55') && digits.length >= 12) {
    e164 = digits
  }
  // Brazilian number without country code (10-11 digits)
  else if (digits.length >= 10 && digits.length <= 11) {
    e164 = `55${digits}`
  }
  // Unknown format
  else {
    e164 = digits
  }

  return createHash('sha256').update(e164).digest('hex')
}

/**
 * Hash a name (first or last)
 * - Lowercase
 * - Trim
 * - Remove special characters except spaces
 */
export function hashName(name: string | undefined | null): string | undefined {
  if (!name || typeof name !== 'string') {
    return undefined
  }

  // Remove special characters, keep only letters and spaces
  const normalized = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z\s]/g, '') // Keep only letters and spaces
    .replace(/\s+/g, '') // Remove all spaces

  if (!normalized) {
    return undefined
  }

  return createHash('sha256').update(normalized).digest('hex')
}

/**
 * Hash external/user ID
 * Simply lowercase, trim, and hash
 */
export function hashExternalId(id: string | undefined | null): string | undefined {
  if (!id || typeof id !== 'string') {
    return undefined
  }

  const normalized = id.toLowerCase().trim()
  if (!normalized) {
    return undefined
  }

  return createHash('sha256').update(normalized).digest('hex')
}

/**
 * Hash geographic data (city, state, zip, country)
 * - Lowercase
 * - Trim
 * - Remove special characters
 */
export function hashGeo(value: string | undefined | null): string | undefined {
  if (!value || typeof value !== 'string') {
    return undefined
  }

  const normalized = value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric

  if (!normalized) {
    return undefined
  }

  return createHash('sha256').update(normalized).digest('hex')
}

/**
 * Split a full name into first and last name
 * Returns { firstName, lastName }
 */
export function splitFullName(fullName: string | undefined | null): {
  firstName: string | undefined
  lastName: string | undefined
} {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: undefined, lastName: undefined }
  }

  const parts = fullName.trim().split(/\s+/)

  if (parts.length === 0) {
    return { firstName: undefined, lastName: undefined }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: undefined }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * Generate a unique event ID for deduplication
 * Format: {prefix}_{timestamp}_{randomString}
 */
export function generateEventId(prefix: string = 'evt'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 11)
  return `${prefix}_${timestamp}_${random}`
}

/**
 * Wrap a single hashed value in an array for Meta API
 * Meta requires certain fields to be arrays
 */
export function wrapInArray<T>(value: T | undefined): T[] | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  return [value]
}
