/**
 * Canonical site origin for metadata, sitemap, robots, and JSON-LD.
 * Prefer NEXTAUTH_URL in env; then Vercel preview URL; then production default.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  if (process.env.NODE_ENV === "production") return "https://magadhrecipe.com";
  return "http://localhost:3000";
}
