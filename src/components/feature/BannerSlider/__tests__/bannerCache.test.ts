import { describe, it, expect, beforeEach } from 'vitest';
import { getCachedBanners, setCachedBanners, clearBannerCache } from '../bannerCache';

// Mock sessionStorage
const store: Record<string, string> = {};
const KEY = 'cache:banners:active';

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  // @ts-ignore
  global.sessionStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; }
  } as any;
});

describe('banner cache', () => {
  it('stores and retrieves cached banners', () => {
    const data = [{ id: '1' }];
    setCachedBanners(data);
    const out = getCachedBanners<any[]>();
    expect(out).toEqual(data);
  });

  it('expires after TTL by simulating timestamp', () => {
    const entry = { data: [{ id: 'x' }], timestamp: Date.now() - (6 * 60 * 1000) };
    store[KEY] = JSON.stringify(entry);
    const out = getCachedBanners<any[]>();
    expect(out).toBeNull();
    expect(store[KEY]).toBeUndefined();
  });

  it('clearBannerCache removes entry', () => {
    setCachedBanners([{ id: '1' }]);
    clearBannerCache();
    expect(getCachedBanners()).toBeNull();
  });
});