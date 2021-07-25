export function stripQuotes(value?: string | null) {
  if ((value?.startsWith(`'`) && value?.endsWith(`'`)) || (value?.startsWith('"') && value?.endsWith('"'))) {
    return value.slice(1, -1);
  }
  return value;
}
