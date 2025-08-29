// Promise timeout utility using Promise.race for robust timeout handling
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  operation: string = 'operation'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timeoutId = setTimeout(() => {
      const error = new Error(`${operation} timed out after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      reject(error);
    }, timeoutMs);

    // Store timeout ID for potential cleanup
    (timeoutPromise as any).timeoutId = timeoutId;
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    // Clean up timeout if promise resolves first
    if ((timeoutPromise as any).timeoutId) {
      clearTimeout((timeoutPromise as any).timeoutId);
    }
  });
}

// Special wrapper for Supabase RPC calls that need timeout handling
export async function withSupabaseTimeout<T = any>(
  supabaseCall: () => Promise<{ data: T | null; error: any | null }>,
  timeoutMs: number,
  operation: string = 'Supabase operation'
): Promise<{ data: T | null; error: any | null }> {
  try {
    const result = await withTimeout(supabaseCall(), timeoutMs, operation);
    return result;
  } catch (error: any) {
    if (error.name === 'TimeoutError') {
      return { 
        data: null, 
        error: { 
          message: `${operation} timed out`, 
          code: 'TIMEOUT_ERROR' 
        } 
      };
    }
    return { data: null, error };
  }
}