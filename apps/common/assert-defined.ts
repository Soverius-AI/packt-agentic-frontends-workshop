export function assertDefined<T>(
  value: T,
  variable: string = "variable",
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(`${variable} needs to be defined`);
  }
}

export function getOrThrow<T>(value: T, variable?: string): NonNullable<T> {
  assertDefined(value, variable);
  return value;
}
