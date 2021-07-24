export function stripQuotes(value?: string | null) {
  if (value?.startsWith(`'`) && value?.endsWith(`'`)) {
    return value.slice(1, -1);
  }
  return value;
}

export function stripDoubleQuotes(value?: string | null) {
  if (value?.startsWith('"') && value?.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
