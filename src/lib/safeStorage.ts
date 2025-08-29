// Safe localStorage wrapper with in-memory fallback for Safari/Mac compatibility
class SafeStorage {
  private memoryStorage: Map<string, string> = new Map();
  private isStorageAvailable = true;

  constructor() {
    this.checkStorageAvailability();
  }

  private checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      console.log('[SafeStorage] localStorage is available');
    } catch (error) {
      console.warn('[SafeStorage] localStorage unavailable, using memory fallback:', error);
      this.isStorageAvailable = false;
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.setItem(key, value);
      } else {
        this.memoryStorage.set(key, value);
      }
    } catch (error) {
      console.warn('[SafeStorage] setItem failed, falling back to memory:', error);
      this.isStorageAvailable = false;
      this.memoryStorage.set(key, value);
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.isStorageAvailable) {
        return localStorage.getItem(key);
      } else {
        return this.memoryStorage.get(key) || null;
      }
    } catch (error) {
      console.warn('[SafeStorage] getItem failed, falling back to memory:', error);
      this.isStorageAvailable = false;
      return this.memoryStorage.get(key) || null;
    }
  }

  removeItem(key: string): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.removeItem(key);
      } else {
        this.memoryStorage.delete(key);
      }
    } catch (error) {
      console.warn('[SafeStorage] removeItem failed, falling back to memory:', error);
      this.isStorageAvailable = false;
      this.memoryStorage.delete(key);
    }
  }

  clear(): void {
    try {
      if (this.isStorageAvailable) {
        localStorage.clear();
      } else {
        this.memoryStorage.clear();
      }
    } catch (error) {
      console.warn('[SafeStorage] clear failed, falling back to memory:', error);
      this.isStorageAvailable = false;
      this.memoryStorage.clear();
    }
  }

  // Reset Supabase related keys
  resetSupabaseSession(): void {
    const supabaseKeys = [
      'sb-jtpiybdcuawhnfibrdho-auth-token',
      'supabase.auth.token',
      'client_session_token'
    ];

    supabaseKeys.forEach(key => {
      this.removeItem(key);
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn('[SafeStorage] Could not clear sessionStorage key:', key);
      }
    });
    
    console.log('[SafeStorage] Supabase session keys cleared');
  }

  // Storage health check
  getStorageHealth(): { type: string; available: boolean; keysCount: number } {
    let keysCount = 0;
    
    if (this.isStorageAvailable) {
      try {
        keysCount = localStorage.length;
      } catch (e) {
        keysCount = -1;
      }
    } else {
      keysCount = this.memoryStorage.size;
    }

    return {
      type: this.isStorageAvailable ? 'localStorage' : 'memory',
      available: this.isStorageAvailable,
      keysCount
    };
  }
}

export const safeStorage = new SafeStorage();