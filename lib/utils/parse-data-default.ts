/**
 * Strip leading/trailing quotes from a string and handle null values.
 */
export function parseDataDefault(value: string | null): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();

  // Oracle can return unquoted string null to indicate null default
  if (trimmed.toLocaleLowerCase() === 'null') {
    return null;
  }

  if (
    (trimmed.startsWith(`'`) && trimmed.endsWith(`'`)) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }

  return value;
}
