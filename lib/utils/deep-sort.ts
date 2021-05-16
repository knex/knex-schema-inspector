export default function deepSort(a: any, b: any): number | undefined {
  if ([a, b].some((e) => typeof e !== 'object')) {
    return a > b ? 1 : -1;
  }
  const keys = Array.from(
    new Set([...Object.keys(a), ...Object.keys(b)])
  ).sort();
  for (const key of keys) {
    if (a[key] && b[key] && a[key] !== b[key]) {
      return deepSort(a[key], b[key]);
    }
  }
}
