import type { ValueTransformer } from 'typeorm';

export const bigintNumberTransformer: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | number | null) => (value == null ? value : Number(value)),
};
