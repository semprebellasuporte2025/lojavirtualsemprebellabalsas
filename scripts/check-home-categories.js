// Verifica categorias ativas e se possuem produtos visíveis
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_PUBLIC_SUPABASE_URL;
const anon = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('❌ Faltam variáveis .env: VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, anon);

async function main() {
  console.log('🔎 Checando categorias ativas e contagem de produtos visíveis...');
  const { data: categorias, error: catErr } = await supabase
    .from('categorias')
    .select('id, nome, ativa')
    .eq('ativa', true)
    .order('nome');

  if (catErr) {
    console.error('❌ Erro ao buscar categorias:', catErr.message || catErr);
    process.exit(1);
  }

  if (!categorias || categorias.length === 0) {
    console.log('⚠️ Nenhuma categoria ativa encontrada.');
    return;
  }

  const results = [];
  for (const cat of categorias) {
    let count = 0;
    let errMsg = '';
    try {
      const { count: c1, error: e1 } = await supabase
        .from('produtos')
        .select('id', { count: 'exact', head: true })
        .eq('categoria_id', cat.id)
        .eq('ativo', true)
        .eq('nome_invisivel', false);
      if (e1) {
        const msg = String(e1.message || '');
        if (/nome_invisivel/i.test(msg) && /does not exist|column/i.test(msg)) {
          const { data: p2, error: e2 } = await supabase
            .from('produtos')
            .select('id, nome_invisivel, ativo')
            .eq('categoria_id', cat.id)
            .eq('ativo', true);
          if (!e2) {
            count = (p2 || []).filter(p => p?.ativo === true && p?.nome_invisivel !== true).length;
          } else {
            errMsg = e2.message || String(e2);
          }
        } else {
          errMsg = e1.message || String(e1);
        }
      } else {
        count = c1 || 0;
      }
    } catch (e) {
      errMsg = e.message || String(e);
    }
    results.push({ nome: cat.nome, id: cat.id, produtos_visiveis: count, erro: errMsg });
  }

  console.log('📊 Resultado:');
  for (const r of results) {
    if (r.erro) {
      console.log(`   - ${r.nome} (${r.id}): erro -> ${r.erro}`);
    } else {
      console.log(`   - ${r.nome} (${r.id}): ${r.produtos_visiveis} produto(s)`);
    }
  }

  const comProdutos = results.filter(r => r.produtos_visiveis > 0).map(r => r.nome);
  console.log('\n✅ Categorias com produtos visíveis:', comProdutos.length > 0 ? comProdutos.join(', ') : '(nenhuma)');
}

main().catch(err => {
  console.error('💥 Erro geral:', err.message || err);
  process.exit(1);
});