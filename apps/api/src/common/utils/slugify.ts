/**
 * Convert a human-readable name into a URL/path-safe slug.
 * Lowercases, strips diacritics, replaces non-alphanumerics with "-",
 * trims leading/trailing dashes, and falls back to a default if empty.
 */
export function slugify(input: string, fallback = "connection"): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.length > 0 ? base : fallback;
}

/**
 * Given a base slug and a set of already-reserved slugs, return a unique
 * candidate by appending a numeric suffix (-2, -3, ...) until no collision.
 */
export function resolveUniqueSlug(
  base: string,
  reserved: ReadonlySet<string>,
): string {
  if (!reserved.has(base)) return base;
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (reserved.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}`;
  }
  return candidate;
}
