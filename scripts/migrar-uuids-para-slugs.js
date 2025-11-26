#!/usr/bin/env node
// Migra URLs que usam UUID para slugs canônicos e garante slugs em produtos/categorias
// Uso: node scripts/migrar-uuids-para-slugs.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // exige Service Role para atualizações

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Configure VITE_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente (.env.local)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Utils =====
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (s) => uuidRegex.test(s || '');

function slugify(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/^[\s\-]+|[\s\-]+$/g, '')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-');
}

function generateCategorySlug(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
}

const isValidProductSlug = (slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '');

async function ensureUniqueProductSlug(baseSlug, excludeId) {
  let candidate = baseSlug;
  let suffix = 2;
  async function exists(slug) {
    const { data, error } = await supabase.from('produtos').select('id').eq('slug', slug);
    if (error) { console.warn('Falha ao verificar slug único:', error.message || error); return false; }
    if (!data || data.length === 0) return false;
    if (!excludeId) return true;
    return data.some((r) => r.id !== excludeId);
  }
  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix++}`;
  }
  return candidate;
}

async function ensureUniqueCategorySlug(baseSlug, excludeId) {
  let candidate = baseSlug;
  let suffix = 2;
  async function exists(slug) {
    const { data, error } = await supabase.from('categorias').select('id').eq('slug', slug);
    if (error) { console.warn('Falha ao verificar slug único (categoria):', error.message || error); return false; }
    if (!data || data.length === 0) return false;
    if (!excludeId) return true;
    return data.some((r) => r.id !== excludeId);
  }
  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix++}`;
  }
  return candidate;
}

function extractParam(url) {
  if (!url) return { type: null, param: null, base: null };
  try {
    const parsed = url.startsWith('http') ? new URL(url) : new URL(url, 'http://local.test');
    const path = parsed.pathname || '';
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2 && (parts[0] === 'produto' || parts[0] === 'product' || parts[0] === 'categoria')) {
      return { type: parts[0], param: parts[1], base: url.startsWith('http') ? `${parsed.origin}` : '' };
    }
    return { type: null, param: null, base: null };
  } catch {
    const m = url.match(/\/(produto|product|categoria)\/([^/?#]+)/i);
    if (m) return { type: m[1].toLowerCase(), param: m[2], base: null };
    return { type: null, param: null, base: null };
  }
}

function buildUrl(base, type, slug) {
  const path = `/${type === 'product' ? 'produto' : type}/${slug}`;
  return base ? `${base}${path}` : path;
}

// ===== Migrations =====
async function migrateProductSlugs() {
  console.log('\n🔄 Garantindo slugs em produtos...');
  let updated = 0, skipped = 0, errors = 0;
  const { data: produtos, error } = await supabase.from('produtos').select('id, nome, slug');
  if (error) throw error;
  for (const p of produtos || []) {
    const current = (p.slug || '').trim();
    if (current && isValidProductSlug(current)) { skipped++; continue; }
    const base = slugify(p.nome || '') || `produto-${String(p.id).slice(0, 8)}`;
    const final = await ensureUniqueProductSlug(base, p.id);
    const { error: upErr } = await supabase.from('produtos').update({ slug: final }).eq('id', p.id);
    if (upErr) { console.warn('Erro atualizar produto', p.id, upErr.message || upErr); errors++; } else { updated++; }
  }
  console.log(`   ✅ Produtos atualizados: ${updated} | ⏭️ Pulados: ${skipped} | ❌ Erros: ${errors}`);
}

async function migrateCategorySlugs() {
  console.log('\n🔄 Garantindo slugs em categorias...');
  let updated = 0, skipped = 0, errors = 0;
  const { data: categorias, error } = await supabase.from('categorias').select('id, nome, slug');
  if (error) throw error;
  for (const c of categorias || []) {
    const current = (c.slug || '').trim();
    if (current) { skipped++; continue; }
    const base = generateCategorySlug(c.nome || '') || `categoria-${String(c.id).slice(0, 8)}`;
    const final = await ensureUniqueCategorySlug(base, c.id);
    const { error: upErr } = await supabase.from('categorias').update({ slug: final }).eq('id', c.id);
    if (upErr) { console.warn('Erro atualizar categoria', c.id, upErr.message || upErr); errors++; } else { updated++; }
  }
  console.log(`   ✅ Categorias atualizadas: ${updated} | ⏭️ Pulados: ${skipped} | ❌ Erros: ${errors}`);
}

async function migrateLinksBanners() {
  console.log('\n🔗 Migrando links em banners...');
  let scanned = 0, updated = 0, skipped = 0, errors = 0;
  const { data: rows, error } = await supabase.from('banners').select('id, link_destino');
  if (error) throw error;
  for (const row of rows || []) {
    scanned++;
    const link = String(row.link_destino || '');
    const info = extractParam(link);
    if (!info.type || !info.param) { skipped++; continue; }
    const { type, param, base } = info;
    try {
      if (type === 'produto' || type === 'product') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: prod } = await supabase.from('produtos').select('id, nome, slug').eq('id', param).limit(1);
        const p = Array.isArray(prod) ? prod[0] : null;
        if (!p) { skipped++; continue; }
        let final = (p.slug || '').trim();
        if (!final || !isValidProductSlug(final)) {
          const baseSlug = slugify(p.nome || '') || `produto-${String(p.id).slice(0, 8)}`;
          final = await ensureUniqueProductSlug(baseSlug, p.id);
          const { error: upErr } = await supabase.from('produtos').update({ slug: final }).eq('id', p.id);
          if (upErr) { console.warn('Erro ao gravar slug de produto', p.id, upErr.message || upErr); }
        }
        const newUrl = buildUrl(base, 'produto', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase.from('banners').update({ link_destino: newUrl }).eq('id', row.id);
          if (upErr) { errors++; } else { updated++; }
        } else { skipped++; }
      } else if (type === 'categoria') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: cat } = await supabase.from('categorias').select('id, nome, slug').eq('id', param).limit(1);
        const c = Array.isArray(cat) ? cat[0] : null;
        if (!c) { skipped++; continue; }
        let final = (c.slug || '').trim();
        if (!final) {
          const baseSlug = generateCategorySlug(c.nome || '') || `categoria-${String(c.id).slice(0, 8)}`;
          final = await ensureUniqueCategorySlug(baseSlug, c.id);
          const { error: upErr } = await supabase.from('categorias').update({ slug: final }).eq('id', c.id);
          if (upErr) { console.warn('Erro ao gravar slug de categoria', c.id, upErr.message || upErr); }
        }
        const newUrl = buildUrl(base, 'categoria', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase.from('banners').update({ link_destino: newUrl }).eq('id', row.id);
          if (upErr) { errors++; } else { updated++; }
        } else { skipped++; }
      } else { skipped++; }
    } catch (e) { errors++; }
  }
  console.log(`   📊 Banners - Escaneados: ${scanned} | Atualizados: ${updated} | Pulados: ${skipped} | Erros: ${errors}`);
}

async function migrateLinksInstagram() {
  console.log('\n🔗 Migrando links no Instagram...');
  let scanned = 0, updated = 0, skipped = 0, errors = 0;
  const { data: rows, error } = await supabase.from('link_instagram').select('id, link');
  if (error) throw error;
  for (const row of rows || []) {
    scanned++;
    const link = String(row.link || '');
    const info = extractParam(link);
    if (!info.type || !info.param) { skipped++; continue; }
    const { type, param, base } = info;
    try {
      if (type === 'produto' || type === 'product') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: prod } = await supabase.from('produtos').select('id, nome, slug').eq('id', param).limit(1);
        const p = Array.isArray(prod) ? prod[0] : null;
        if (!p) { skipped++; continue; }
        let final = (p.slug || '').trim();
        if (!final || !isValidProductSlug(final)) {
          const baseSlug = slugify(p.nome || '') || `produto-${String(p.id).slice(0, 8)}`;
          final = await ensureUniqueProductSlug(baseSlug, p.id);
          const { error: upErr } = await supabase.from('produtos').update({ slug: final }).eq('id', p.id);
          if (upErr) { console.warn('Erro ao gravar slug de produto', p.id, upErr.message || upErr); }
        }
        const newUrl = buildUrl(base, 'produto', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase.from('link_instagram').update({ link: newUrl }).eq('id', row.id);
          if (upErr) { errors++; } else { updated++; }
        } else { skipped++; }
      } else if (type === 'categoria') {
        if (!isUuid(param)) { skipped++; continue; }
        const { data: cat } = await supabase.from('categorias').select('id, nome, slug').eq('id', param).limit(1);
        const c = Array.isArray(cat) ? cat[0] : null;
        if (!c) { skipped++; continue; }
        let final = (c.slug || '').trim();
        if (!final) {
          const baseSlug = generateCategorySlug(c.nome || '') || `categoria-${String(c.id).slice(0, 8)}`;
          final = await ensureUniqueCategorySlug(baseSlug, c.id);
          const { error: upErr } = await supabase.from('categorias').update({ slug: final }).eq('id', c.id);
          if (upErr) { console.warn('Erro ao gravar slug de categoria', c.id, upErr.message || upErr); }
        }
        const newUrl = buildUrl(base, 'categoria', final);
        if (newUrl !== link) {
          const { error: upErr } = await supabase.from('link_instagram').update({ link: newUrl }).eq('id', row.id);
          if (upErr) { errors++; } else { updated++; }
        } else { skipped++; }
      } else { skipped++; }
    } catch (e) { errors++; }
  }
  console.log(`   📊 Instagram - Escaneados: ${scanned} | Atualizados: ${updated} | Pulados: ${skipped} | Erros: ${errors}`);
}

// ===== Run all =====
(async () => {
  console.log('⚙️ Iniciando migração de UUIDs para slugs...');
  console.log('   Supabase URL:', SUPABASE_URL);
  console.log('   Usando chave: Service Role');
  try {
    await migrateProductSlugs();
    await migrateCategorySlugs();
    await migrateLinksBanners();
    await migrateLinksInstagram();
    console.log('\n✅ Migração concluída com sucesso.');
  } catch (e) {
    console.error('\n❌ Falha na migração:', e);
    process.exitCode = 1;
  }
})();