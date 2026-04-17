export function requireArg(
  positional: string | undefined,
  flag: string | undefined,
  name: string,
  flagName = "--id"
): string {
  if (positional && flag && positional !== flag) {
    throw new Error(`Conflicting values for ${name}: "${positional}" (argument) vs "${flag}" (${flagName}). Pass only one.`);
  }
  const value = positional || flag;
  if (!value) throw new Error(`Missing ${name}. Pass it as an argument or with ${flagName}.`);
  return value;
}

export function formatDate(p: { publishedAt?: string; createdAt?: string | number; updatedAt?: string }): string {
  const raw = p.publishedAt || p.createdAt || p.updatedAt;
  if (!raw) return "";
  const n = Number(raw);
  const date = isNaN(n) ? new Date(raw) : new Date(n);
  return isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}
