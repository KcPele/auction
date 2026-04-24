type MultipartField = {
  value?: unknown;
};

export function getMultipartTextField(
  fields: Record<string, unknown> | undefined,
  name: string,
) {
  const field = fields?.[name] as MultipartField | undefined;
  const value = field?.value;

  return typeof value === 'string' ? value : undefined;
}
