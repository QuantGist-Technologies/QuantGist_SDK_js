/**
 * Converts a params object into a URL query string (including the leading `?`).
 * Undefined/null values are omitted. Arrays are joined as comma-separated strings.
 */
export function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null,
  );
  if (entries.length === 0) return '';

  const usp = new URLSearchParams();
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      usp.set(key, (value as unknown[]).join(','));
    } else {
      usp.set(key, String(value));
    }
  }
  return `?${usp.toString()}`;
}
