export function stripQuotes(value) {
  if (value?.startsWith(`'`) && value?.endsWith(`'`)) {
    return value.slice(1, -1);
  }
  return value;
}

export function stripDoubleQuotes(value) {
  if (value?.startsWith('"') && value?.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}
