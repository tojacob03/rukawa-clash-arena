// Narrowing helpers for `catch (error: unknown)`. Supabase hands back plain
// objects with a `message` in some code paths, so `instanceof Error` alone
// isn't enough.
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export function errorName(error: unknown): string | undefined {
  if (error instanceof Error) return error.name;
  if (typeof error === "object" && error !== null && "name" in error) {
    return String((error as { name: unknown }).name);
  }
  return undefined;
}
