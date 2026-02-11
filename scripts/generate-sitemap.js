
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_PUBLIC_SUPABASE_URL e VITE_PUBLIC_SUPABASE_ANON_KEY são obrigatórios no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://example.com'; // Será substituído pelo postbuild.mjs

const STATIC_ROUTES = [
  '/',
  '/sobre-nos',
  '/contato',
  '/frete-entrega',
  '/formas-pagamento',
  '/privacidade',
  '/auth/login',
  '/auth/register'
];

async function generateSitemap() {
  console.log('Iniciando geração do sitemap...');

  try {
    // 1. Buscar categorias ativas
    const { data: categorias, error: catError } = await supabase
      .from('categorias')
      .select('slug, updated_at')
      .eq('ativa', true);

    if (catError) throw catError;

    // 2. Buscar produtos ativos
    const { data: produtos, error: prodError } = await supabase
      .from('produtos')
      .select('slug, updated_at')
      .eq('ativo', true);

    if (prodError) throw prodError;

    console.log(`Encontradas ${categorias?.length || 0} categorias e ${produtos?.length || 0} produtos.`);

    // 3. Gerar XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Rotas estáticas
    STATIC_ROUTES.forEach(route => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${route}</loc>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.5</priority>\n';
      xml += '  </url>\n';
    });

    // Categorias
    if (categorias) {
      categorias.forEach(cat => {
        if (cat.slug) {
          const lastMod = cat.updated_at ? new Date(cat.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          xml += '  <url>\n';
          xml += `    <loc>${BASE_URL}/categoria/${cat.slug}</loc>\n`;
          xml += `    <lastmod>${lastMod}</lastmod>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.8</priority>\n';
          xml += '  </url>\n';
        }
      });
    }

    // Produtos
    if (produtos) {
      produtos.forEach(prod => {
        if (prod.slug) {
          const lastMod = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          xml += '  <url>\n';
          xml += `    <loc>${BASE_URL}/produto/${prod.slug}</loc>\n`;
          xml += `    <lastmod>${lastMod}</lastmod>\n`;
          xml += '    <changefreq>daily</changefreq>\n';
          xml += '    <priority>0.9</priority>\n';
          xml += '  </url>\n';
        }
      });
    }

    xml += '</urlset>';

    // 4. Salvar arquivo
    const publicPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(publicPath, xml);

    console.log(`Sitemap gerado com sucesso em: ${publicPath}`);

  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();
