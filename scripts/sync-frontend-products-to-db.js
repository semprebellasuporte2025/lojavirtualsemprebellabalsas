#!/usr/bin/env node
// Sincroniza produtos referenciados no frontend com o banco (Supabase)
// Foco: garantir existência do produto "Conjunto Saia Blusa Nm Llz" com slug canônico
// Uso: VITE_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY precisam estar no ambiente

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role é necessário para inserir

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Configure as variáveis .env: VITE_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== Utils =====
function slugify(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

async function ensureUniqueProductSlug(baseSlug, excludeId) {
  let candidate = baseSlug;
  let suffix = 2;
  async function exists(slug) {
    const { data, error } = await supabase.from('produtos').select('id').eq('slug', slug);
    if (error) { console.warn('Falha ao checar slug único:', error.message || error); return false; }
    if (!data || data.length === 0) return false;
    if (!excludeId) return true;
    return data.some((r) => r.id !== excludeId);
  }
  while (await exists(candidate)) {
    candidate = `${baseSlug}-${suffix++}`;
  }
  return candidate;
}

async function findOrCreateCategoriaPorNome(nomeCategoria) {
  const { data: catRows, error: catErr } = await supabase
    .from('categorias')
    .select('id, nome, slug')
    .eq('nome', nomeCategoria)
    .limit(1);
  if (catErr) throw catErr;
  const existente = Array.isArray(catRows) ? catRows[0] : null;
  if (existente) return existente.id;
  const baseSlug = slugify(nomeCategoria);
  // garantir unicidade do slug de categoria de forma simples
  let slug = baseSlug;
  let i = 2;
  // tenta até achar um slug não usado
  // (não usamos ensureUniqueCategorySlug aqui para manter script curto)
  while (true) {
    const { data: dup } = await supabase.from('categorias').select('id').eq('slug', slug).limit(1);
    if (!dup || dup.length === 0) break;
    slug = `${baseSlug}-${i++}`;
  }
  const { data: ins, error: insErr } = await supabase
    .from('categorias')
    .insert({ nome: nomeCategoria, slug, ativa: true })
    .select('id')
    .limit(1);
  if (insErr) throw insErr;
  return Array.isArray(ins) && ins[0]?.id ? ins[0].id : null;
}

async function garantirProdutoConjuntoNmLlz() {
  const nome = 'Conjunto Saia Blusa Nm Llz';
  const slugDesejado = slugify(nome);

  console.log('🔎 Checando existência do produto por slug...');
  const { data: bySlug, error: errSlug } = await supabase
    .from('produtos')
    .select('id, nome, slug, ativo')
    .eq('slug', slugDesejado)
    .limit(1);
  if (errSlug) throw errSlug;
  const pSlug = Array.isArray(bySlug) ? bySlug[0] : null;
  if (pSlug) {
    console.log(`✅ Produto já existe com slug: ${pSlug.slug} (ativo: ${pSlug.ativo})`);
    return pSlug.id;
  }

  console.log('🔎 Checando existência do produto por nome...');
  const { data: byName, error: errName } = await supabase
    .from('produtos')
    .select('id, nome, slug, ativo')
    .ilike('nome', nome)
    .limit(1);
  if (errName) throw errName;
  const pName = Array.isArray(byName) ? byName[0] : null;
  if (pName) {
    console.log(`ℹ️ Produto encontrado por nome, atualizando slug para: ${slugDesejado}`);
    const finalSlug = await ensureUniqueProductSlug(slugDesejado, pName.id);
    const { error: upErr } = await supabase
      .from('produtos')
      .update({ slug: finalSlug, ativo: true })
      .eq('id', pName.id);
    if (upErr) throw upErr;
    console.log('✅ Slug atualizado e produto marcado como ativo.');
    return pName.id;
  }

  console.log('➕ Produto não encontrado. Inserindo no banco...');
  // Categoria padrão para "Conjuntos"
  const categoriaId = await findOrCreateCategoriaPorNome('Conjuntos');
  const baseSlug = slugify(nome);
  const finalSlug = await ensureUniqueProductSlug(baseSlug);

  // Inserção mínima; ajuste posterior pode ser feito no admin
  const payload = {
    nome,
    descricao: 'Produto inserido automaticamente para corrigir link do frontend.',
    preco: 0,
    categoria_id: categoriaId,
    estoque: 0,
    ativo: true,
    slug: finalSlug,
  };

  const { data: ins, error: insErr } = await supabase
    .from('produtos')
    .insert(payload)
    .select('id, slug')
    .limit(1);
  if (insErr) throw insErr;
  const created = Array.isArray(ins) ? ins[0] : null;
  console.log(`✅ Produto criado: id=${created?.id} slug=${created?.slug}`);
  return created?.id || null;
}

async function main() {
  try {
    console.log('🚀 Iniciando sincronização de produtos do frontend com o banco...');
    const id = await garantirProdutoConjuntoNmLlz();
    if (!id) {
      console.log('⚠️ Produto não pôde ser criado/atualizado. Verifique logs acima.');
      process.exitCode = 2;
      return;
    }
    console.log('🎯 Concluído. Produto garantido no banco e ativo.');
  } catch (e) {
    console.error('💥 Erro na sincronização:', e?.message || e);
    process.exit(1);
  }
}

main();

