import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const NEW_SUPABASE_URL = process.env.VITE_PUBLIC_SUPABASE_URL || 'https://portalsupabase.semprebellabalsas.com.br';
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.8pxcRD6eP96dJFrQJ8TqhqDVJ-ZhaEyk_zBxG1QazU8';
const OLD_SUPABASE_DOMAIN = 'cproxdqrraiujnewbsvp.supabase.co';

const supabase = createClient(NEW_SUPABASE_URL, NEW_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const BUCKETS = ['banners', 'categorias', 'imagens-produtos', 'link-instagram'];

function parseStorageUrl(url) {
  try {
    const parsed = new URL(url);
    const prefix = '/storage/v1/object/public/';
    const idx = parsed.pathname.indexOf(prefix);
    if (idx === -1) return null;
    const rest = parsed.pathname.slice(idx + prefix.length);
    const slashIdx = rest.indexOf('/');
    if (slashIdx === -1) return null;
    const bucket = rest.slice(0, slashIdx);
    const filePath = decodeURIComponent(rest.slice(slashIdx + 1));
    return { bucket, filePath };
  } catch (err) {
    return null;
  }
}

async function downloadWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      const contentType = res.headers.get('content-type') || 'application/octet-stream';
      return { buffer: Buffer.from(arrayBuffer), contentType };
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function uploadWithRetry(bucket, filePath, buffer, contentType, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType,
      upsert: true
    });
    if (!error) return data;
    if (i === maxRetries - 1) throw error;
    await new Promise(r => setTimeout(r, 1000 * (i + 1)));
  }
}

async function runMigration() {
  console.log('=== INICIANDO MIGRAÇÃO DE IMAGENS ===');
  console.log(`Origem: ${OLD_SUPABASE_DOMAIN}`);
  console.log(`Destino: ${NEW_SUPABASE_URL}`);

  // 1. Coleta de todas as URLs do banco
  console.log('\n[1/4] Coletando URLs antigas nas tabelas...');
  
  const { data: categorias } = await supabase.from('categorias').select('id, imagem_url');
  const { data: banners } = await supabase.from('banners').select('id, imagem_url, imagem_url_mobile');
  const { data: links } = await supabase.from('link_instagram').select('id, img_link, img_topo');
  const { data: produtos } = await supabase.from('produtos').select('id, imagens');

  const allOldUrls = new Set();

  (categorias || []).forEach(c => {
    if (c.imagem_url && c.imagem_url.includes(OLD_SUPABASE_DOMAIN)) allOldUrls.add(c.imagem_url);
  });

  (banners || []).forEach(b => {
    if (b.imagem_url && b.imagem_url.includes(OLD_SUPABASE_DOMAIN)) allOldUrls.add(b.imagem_url);
    if (b.imagem_url_mobile && b.imagem_url_mobile.includes(OLD_SUPABASE_DOMAIN)) allOldUrls.add(b.imagem_url_mobile);
  });

  (links || []).forEach(l => {
    if (l.img_link && l.img_link.includes(OLD_SUPABASE_DOMAIN)) allOldUrls.add(l.img_link);
    if (l.img_topo && l.img_topo.includes(OLD_SUPABASE_DOMAIN)) allOldUrls.add(l.img_topo);
  });

  (produtos || []).forEach(p => {
    (p.imagens || []).forEach(img => {
      if (img && img.includes(OLD_SUPABASE_DOMAIN)) allOldUrls.add(img);
    });
  });

  const urlList = Array.from(allOldUrls);
  console.log(`Total de imagens únicas para migrar: ${urlList.length}`);

  // 2. Transferência física dos arquivos
  console.log('\n[2/4] Transferindo arquivos para os buckets do MinIO...');
  let successCount = 0;
  let failCount = 0;
  const failures = [];

  // Concorrência de 5 downloads/uploads simultâneos
  const CONCURRENCY = 5;
  for (let i = 0; i < urlList.length; i += CONCURRENCY) {
    const chunk = urlList.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (url) => {
      const parsed = parseStorageUrl(url);
      if (!parsed) {
        console.error(`URL inválida para storage: ${url}`);
        failCount++;
        failures.push({ url, error: 'URL mal formatada' });
        return;
      }

      try {
        const { buffer, contentType } = await downloadWithRetry(url);
        await uploadWithRetry(parsed.bucket, parsed.filePath, buffer, contentType);
        successCount++;
        if (successCount % 25 === 0 || successCount === urlList.length) {
          console.log(`Progresso: ${successCount}/${urlList.length} imagens transferidas com sucesso.`);
        }
      } catch (err) {
        console.error(`Falha ao transferir ${url}:`, err.message);
        failCount++;
        failures.push({ url, error: err.message });
      }
    }));
  }

  console.log(`\nFim da transferência: ${successCount} sucessos, ${failCount} falhas.`);
  if (failures.length > 0) {
    console.error('Falhas detectadas:', JSON.stringify(failures, null, 2));
    if (successCount === 0) {
      throw new Error('Nenhuma imagem pôde ser transferida. Abortando atualização do banco.');
    }
  }

  // 3. Atualização das referências no banco de dados
  console.log('\n[3/4] Atualizando URLs no banco de dados...');

  // Atualizar Categorias
  for (const c of (categorias || [])) {
    if (c.imagem_url && c.imagem_url.includes(OLD_SUPABASE_DOMAIN)) {
      const updated = c.imagem_url.replace(OLD_SUPABASE_DOMAIN, new URL(NEW_SUPABASE_URL).host);
      await supabase.from('categorias').update({ imagem_url: updated }).eq('id', c.id);
    }
  }
  console.log('✓ Categorias atualizadas.');

  // Atualizar Banners
  for (const b of (banners || [])) {
    const updateObj = {};
    if (b.imagem_url && b.imagem_url.includes(OLD_SUPABASE_DOMAIN)) {
      updateObj.imagem_url = b.imagem_url.replace(OLD_SUPABASE_DOMAIN, new URL(NEW_SUPABASE_URL).host);
    }
    if (b.imagem_url_mobile && b.imagem_url_mobile.includes(OLD_SUPABASE_DOMAIN)) {
      updateObj.imagem_url_mobile = b.imagem_url_mobile.replace(OLD_SUPABASE_DOMAIN, new URL(NEW_SUPABASE_URL).host);
    }
    if (Object.keys(updateObj).length > 0) {
      await supabase.from('banners').update(updateObj).eq('id', b.id);
    }
  }
  console.log('✓ Banners atualizados.');

  // Atualizar Link Instagram
  for (const l of (links || [])) {
    const updateObj = {};
    if (l.img_link && l.img_link.includes(OLD_SUPABASE_DOMAIN)) {
      updateObj.img_link = l.img_link.replace(OLD_SUPABASE_DOMAIN, new URL(NEW_SUPABASE_URL).host);
    }
    if (l.img_topo && l.img_topo.includes(OLD_SUPABASE_DOMAIN)) {
      updateObj.img_topo = l.img_topo.replace(OLD_SUPABASE_DOMAIN, new URL(NEW_SUPABASE_URL).host);
    }
    if (Object.keys(updateObj).length > 0) {
      await supabase.from('link_instagram').update(updateObj).eq('id', l.id);
    }
  }
  console.log('✓ Links do Instagram atualizados.');

  // Atualizar Produtos
  let prodsUpdated = 0;
  for (const p of (produtos || [])) {
    if (p.imagens && p.imagens.some(img => img && img.includes(OLD_SUPABASE_DOMAIN))) {
      const updatedImagens = p.imagens.map(img => 
        img ? img.replace(OLD_SUPABASE_DOMAIN, new URL(NEW_SUPABASE_URL).host) : img
      );
      await supabase.from('produtos').update({ imagens: updatedImagens }).eq('id', p.id);
      prodsUpdated++;
    }
  }
  console.log(`✓ Produtos atualizados: ${prodsUpdated}`);

  // 4. Verificação de integridade
  console.log('\n[4/4] Verificando integridade no banco e no Storage...');
  
  const { data: catCheck } = await supabase.from('categorias').select('imagem_url').like('imagem_url', `%${OLD_SUPABASE_DOMAIN}%`);
  const { data: banCheck } = await supabase.from('banners').select('id').or(`imagem_url.like.%${OLD_SUPABASE_DOMAIN}%,imagem_url_mobile.like.%${OLD_SUPABASE_DOMAIN}%`);
  const { data: linkCheck } = await supabase.from('link_instagram').select('id').or(`img_link.like.%${OLD_SUPABASE_DOMAIN}%,img_topo.like.%${OLD_SUPABASE_DOMAIN}%`);
  const { data: prodCheck } = await supabase.from('produtos').select('id, imagens');

  const prodsWithOld = (prodCheck || []).filter(p => (p.imagens || []).some(img => img && img.includes(OLD_SUPABASE_DOMAIN)));

  const remainingOld = (catCheck?.length || 0) + (banCheck?.length || 0) + (linkCheck?.length || 0) + prodsWithOld.length;
  console.log(`Referências residuais ao Supabase antigo: ${remainingOld}`);

  // Testar 5 URLs novas no novo Supabase
  const sampleNewUrls = [];
  const { data: sampleProds } = await supabase.from('produtos').select('imagens').limit(5);
  (sampleProds || []).forEach(p => {
    if (p.imagens && p.imagens[0]) sampleNewUrls.push(p.imagens[0]);
  });

  console.log('\nTestando acesso público às novas URLs:');
  for (const testUrl of sampleNewUrls) {
    try {
      const res = await fetch(testUrl);
      console.log(`- ${testUrl} -> HTTP ${res.status}`);
    } catch (e) {
      console.error(`- ${testUrl} -> ERRO: ${e.message}`);
    }
  }

  console.log('\n=== MIGRAÇÃO CONCLUÍDA COM SUCESSO! ===');
}

runMigration().catch(err => {
  console.error('\nErro fatal na migração:', err);
  process.exit(1);
});
