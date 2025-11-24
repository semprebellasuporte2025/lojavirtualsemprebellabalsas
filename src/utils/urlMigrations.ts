import { supabase } from '../lib/supabase';
import { slugify, ensureUniqueProductSlug, isValidProductSlug } from './productSlug';
import { generateSlug } from './formatters';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return uuidRegex.test(s);
}

function extractParam(url: string): { type: 'produto' | 'product' | 'categoria' | null; param: string | null; base: string | null } {
  if (!url) return { type: null, param: null, base: null };
  try {
    // Supports absolute or relative URLs
    const parsed = url.startsWith('http') ? new URL(url) : new URL(url, 'http://local.test');
    const path = parsed.pathname || '';
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[0] === 'produto' || parts[0] === 'product' || parts[0] === 'categoria')) {
      return { type: parts[0] as any, param: parts[1], base: url.startsWith('http') ? `${parsed.origin}` : '' };
    }
    return { type: null, param: null, base: null };
  } catch {
    // Regex fallback when URL constructor fails
    const m = url.match(/\/(produto|product|categoria)\/([^/?#]+)/i);
    if (m) {
      return { type: m[1].toLowerCase() as any, param: m[2], base: null };
    }
    return { type: null, param: null, base: null };
  }
}

function buildUrl(base: string | null, type: 'produto' | 'product' | 'categoria', slug: string): string {
  const path = `/${type === 'product' ? 'produto' : type}/${slug}`;
  return base ? `${base}${path}` : path;
}

export async function migrateBannerLinks(): Promise<{ scanned: number; updated: number; skipped: number; errors: number }> {
  const { data: rows, error } = await supabase
    .from('banners')
    .select('id, link_destino');
  if (error) throw error;
  let scanned = 0, updated = 0, skipped = 0, errors = 0;
  for (const row of rows || []) {
    scanned++;
    const link = (row.link_destino as string) || '';
    const info = extractParam(link);
    if (!info.type || !info.param) { skipped++; continue; }
    const { type, param, base } = info;
    try {
      if (type === 'produto' || type === 'product') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: prod } = await supabase
          .from('produtos')
          .select('id, nome, slug')
          .eq('id', param)
          .limit(1);
        const p = Array.isArray(prod) ? prod[0] : null;
        if (!p) { skipped++; continue; }
        let final = p.slug as string | null;
        if (!final || !isValidProductSlug(final)) {
          const baseSlug = slugify((p.nome as string) || '');
          if (!baseSlug) { skipped++; continue; }
          final = await ensureUniqueProductSlug(baseSlug, p.id as string);
          await supabase.from('produtos').update({ slug: final }).eq('id', p.id as string);
        }
        const newUrl = buildUrl(base, 'produto', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase
            .from('banners')
            .update({ link_destino: newUrl })
            .eq('id', row.id as string);
          if (upErr) { errors++; } else { updated++; }
        } else {
          skipped++;
        }
      } else if (type === 'categoria') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: cat } = await supabase
          .from('categorias')
          .select('id, nome, slug')
          .eq('id', param)
          .limit(1);
        const c = Array.isArray(cat) ? cat[0] : null;
        if (!c) { skipped++; continue; }
        let final = (c.slug as string) || generateSlug((c.nome as string) || '');
        const newUrl = buildUrl(base, 'categoria', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase
            .from('banners')
            .update({ link_destino: newUrl })
            .eq('id', row.id as string);
          if (upErr) { errors++; } else { updated++; }
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    } catch {
      errors++;
    }
  }
  return { scanned, updated, skipped, errors };
}

export async function migrateInstagramLinks(): Promise<{ scanned: number; updated: number; skipped: number; errors: number }> {
  const { data: rows, error } = await supabase
    .from('link_instagram')
    .select('id, link');
  if (error) throw error;
  let scanned = 0, updated = 0, skipped = 0, errors = 0;
  for (const row of rows || []) {
    scanned++;
    const link = (row.link as string) || '';
    const info = extractParam(link);
    if (!info.type || !info.param) { skipped++; continue; }
    const { type, param, base } = info;
    try {
      if (type === 'produto' || type === 'product') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: prod } = await supabase
          .from('produtos')
          .select('id, nome, slug')
          .eq('id', param)
          .limit(1);
        const p = Array.isArray(prod) ? prod[0] : null;
        if (!p) { skipped++; continue; }
        let final = p.slug as string | null;
        if (!final || !isValidProductSlug(final)) {
          const baseSlug = slugify((p.nome as string) || '');
          if (!baseSlug) { skipped++; continue; }
          final = await ensureUniqueProductSlug(baseSlug, p.id as string);
          await supabase.from('produtos').update({ slug: final }).eq('id', p.id as string);
        }
        const newUrl = buildUrl(base, 'produto', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase
            .from('link_instagram')
            .update({ link: newUrl })
            .eq('id', row.id as string);
          if (upErr) { errors++; } else { updated++; }
        } else {
          skipped++;
        }
      } else if (type === 'categoria') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: cat } = await supabase
          .from('categorias')
          .select('id, nome, slug')
          .eq('id', param)
          .limit(1);
        const c = Array.isArray(cat) ? cat[0] : null;
        if (!c) { skipped++; continue; }
        let final = (c.slug as string) || generateSlug((c.nome as string) || '');
        const newUrl = buildUrl(base, 'categoria', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase
            .from('link_instagram')
            .update({ link: newUrl })
            .eq('id', row.id as string);
          if (upErr) { errors++; } else { updated++; }
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    } catch {
      errors++;
    }
  }
  return { scanned, updated, skipped, errors };
}