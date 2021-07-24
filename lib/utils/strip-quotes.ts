export function stripQuotes(value?: string | undefined) {
  if (value?.startsWith(`'`) && value?.endsWith(`'`)) {
    return value.slice(1, -1);
  }
  return value;
}

export function stripDoubleQuotes(value?: string | undefined) {
  if (value?.startsWith('"') && value?.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
