// Set VITE_API_URL at build time for deployed environments.
export const API_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

// The admin key is typed in by the dispatcher and kept for this browser tab only.
// Never bake it into the build: anything in a VITE_ variable is public.
const ADMIN_KEY_STORAGE = 'cb_admin_key';

export function getAdminKey(): string {
  try {
    return sessionStorage.getItem(ADMIN_KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setAdminKey(key: string): void {
  try {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
  } catch {
    // Private mode or blocked storage: the key just won't survive a reload.
  }
}

export const adminHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  'x-admin-key': getAdminKey(),
});
