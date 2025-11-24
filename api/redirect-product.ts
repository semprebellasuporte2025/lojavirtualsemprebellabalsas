import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uuid = (req.query.uuid as string) || '';
    if (!uuid || !uuidRegex.test(uuid)) {
      res.status(400).send('Parâmetro UUID inválido');
      return;
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      res.status(500).send('Configuração do Supabase ausente');
      return;
    }
    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .from('produtos')
      .select('slug, nome')
      .eq('id', uuid)
      .limit(1);
    if (error) {
      res.status(500).send('Erro ao consultar produto');
      return;
    }
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) {
      res.status(404).send('Produto não encontrado');
      return;
    }
    let slug = (row.slug as string) || slugify((row.nome as string) || '');
    if (!slug || !slugRegex.test(slug)) {
      slug = slugify((row.nome as string) || '');
    }
    const location = `/produto/${slug}`;
    res.writeHead(301, { Location: location }).end();
  } catch (e) {
    res.status(500).send('Erro interno no redirecionamento');
  }
}