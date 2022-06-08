import { stripQuotes } from './strip-quotes';

/**
 * Handle Oracle/SQLite returning unquoted string null to indicate null default.
 */
export function parseDataDefault(value: string | null): string | null {
  if (value?.trim().toLowerCase() === 'null') {
    return null;
  }

  return stripQuotes(value);
}
