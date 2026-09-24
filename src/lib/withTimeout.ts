// Promise timeout utility using Promise.race for robust timeout handling
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'operation'
): Promise<T> {
  // The timer id lives in this closure, not on the promise object: the
  // executor below runs synchronously inside `new Promise`, before
  // `timeoutPromise` is initialized, so reaching for `timeoutPromise` in
  // there threw a ReferenceError and made every call reject immediately.
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`${operation} timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);
  });

  // Clean up the timeout if the promise settles first
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export interface SupabaseCallError {
  message: string;
  code?: string;
}

// Special wrapper for Supabase RPC calls that need timeout handling
export async function withSupabaseTimeout<T>(
  supabaseCall: () => Promise<{ data: T | null; error: SupabaseCallError | null }>,
  timeoutMs: number,
  operation: string = 'Supabase operation'
): Promise<{ data: T | null; error: SupabaseCallError | null }> {
  try {
    const result = await withTimeout(supabaseCall(), timeoutMs, operation);
    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        data: null,
        error: {
          message: `${operation} timed out`,
          code: 'TIMEOUT_ERROR'
        }
      };
    }
    return { data: null, error: error instanceof Error ? error : { message: String(error) } };
  }
}
