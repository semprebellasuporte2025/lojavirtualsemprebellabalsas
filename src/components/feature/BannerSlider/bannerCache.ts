export interface BannerCacheEntry<T> {
  data: T;
  timestamp: number;
}

const KEY = 'cache:banners:active';
const TTL_MS = 5 * 60 * 1000; // 5 minutos

function now() {
  return Date.now();
}

export function getCachedBanners<T = any>(): T | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: BannerCacheEntry<T> = JSON.parse(raw);
    if (!parsed || !parsed.timestamp || now() - parsed.timestamp > TTL_MS) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function setCachedBanners<T = any>(data: T): void {
  try {
    const entry: BannerCacheEntry<T> = { data, timestamp: now() };
    sessionStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

export function clearBannerCache(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}