// lib/utils/slug.ts
// URL-safe slug generation. Used when creating tournaments, posts, etc.

/**
 * Converts a human-readable string to a URL-safe slug.
 * e.g. "JCL Spring Cup 2026" → "jcl-spring-cup-2026"
 */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip non-alphanum except spaces and hyphens
    .replace(/\s+/g, '-')            // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
}

/**
 * Checks whether a string is a valid slug (no spaces, lowercase, alphanum+hyphens).
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
