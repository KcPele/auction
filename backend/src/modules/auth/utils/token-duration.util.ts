const units: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseTokenDuration(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    throw new Error(`Invalid token duration: ${value}`);
  }

  return Number(match[1]) * units[match[2]];
}

