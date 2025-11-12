import { describe, it, expect } from 'vitest';
import * as UrlUtils from '../bannerUrlUtils';

describe('extractBucketAndKey', () => {
  const { extractBucketAndKey } = UrlUtils as any;

  it('extrai bucket e key de URL pública do Supabase', () => {
    const url = 'https://proj.supabase.co/storage/v1/object/public/banners/folder/img.png';
    const parsed = extractBucketAndKey(url);
    expect(parsed).toEqual({ bucket: 'banners', key: 'folder/img.png' });
  });

  it('normaliza duplicidade banners/banners', () => {
    const url = 'https://proj.supabase.co/storage/v1/object/public/banners/banners/img.png';
    const parsed = extractBucketAndKey(url);
    expect(parsed).toEqual({ bucket: 'banners', key: 'img.png' });
  });

  it('retorna null para key sem bucket', () => {
    const parsed = extractBucketAndKey('img.png');
    expect(parsed).toBeNull();
  });
});

describe('toSupabaseRenderUrl', () => {
  const { toSupabaseRenderUrl } = UrlUtils as any;

  it('converte object/public para render/image/public com width', () => {
    const src = 'https://proj.supabase.co/storage/v1/object/public/banners/img.png';
    const url = toSupabaseRenderUrl(src, 1600);
    expect(url).toContain('/storage/v1/render/image/public/banners/img.png');
    expect(url).toContain('width=1600');
    expect(url).toContain('quality=85');
    expect(url).toContain('format=webp');
  });

  it('mantém URLs não-Supabase intactas', () => {
    const src = 'https://cdn.example.com/image.png';
    const url = toSupabaseRenderUrl(src, 768);
    expect(url).toBe(src);
  });
});