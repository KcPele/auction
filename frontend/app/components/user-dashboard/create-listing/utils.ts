export function parseSpecs(value: string): Record<string, string> {
  const specs: Record<string, string> = {};

  for (const pair of value.split(",")) {
    const [key, item] = pair.split(":").map((part) => part.trim());
    if (key && item) specs[key] = item;
  }

  return specs;
}
