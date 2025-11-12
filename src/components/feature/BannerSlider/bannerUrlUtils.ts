export function toSupabaseRenderUrl(url: string, width?: number) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('.supabase.co')) return url;

    const parts = u.pathname.split('/').filter(Boolean);
    // Formatos esperados:
    // - /storage/v1/object/public/<bucket>/<key>
    // - /storage/v1/render/image/public/<bucket>/<key>
    if (parts[0] === 'storage' && parts[1] === 'v1') {
      if (parts[2] === 'object' && parts[3] === 'public') {
        const bucketAndKey = parts.slice(4);
        const newPath = ['storage', 'v1', 'render', 'image', 'public', ...bucketAndKey].join('/');
        u.pathname = '/' + newPath;
      } else if (parts[2] === 'render' && parts[3] === 'image') {
        // Já está no endpoint de renderização; mantém caminho
      } else {
        // Caminho inesperado, retorna URL original
        return url;
      }

      // Adiciona parâmetros de renderização
      const sp = u.searchParams;
      if (width && !sp.has('width')) sp.set('width', String(width));
      if (!sp.has('quality')) sp.set('quality', '85');
      if (!sp.has('format')) sp.set('format', 'webp');
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export function extractBucketAndKey(input: string): { bucket: string; key: string } | null {
  // Tenta como URL completa
  try {
    const u = new URL(input);
    const parts = u.pathname.split('/').filter(Boolean);
    // esperado: storage/v1/(object|render/image)/public/<bucket>/<...key>
    const publicIdx = parts.findIndex((p) => p === 'public');
    if (publicIdx === -1 || publicIdx + 2 >= parts.length) return null;
    const bucket = parts[publicIdx + 1];
    const keyParts = parts.slice(publicIdx + 2);
    // Remove duplicidade do bucket no início da key (ex.: banners/banners/arquivo.png)
    const normalizedKeyParts = keyParts[0] === bucket ? keyParts.slice(1) : keyParts;
    const key = normalizedKeyParts.join('/');
    return { bucket, key };
  } catch {
    // Não é URL: tenta interpretar como path `bucket/key` ou apenas `key`
    const raw = input.replace(/^\/+|\/+$/g, '');
    const segs = raw.split('/').filter(Boolean);
    if (segs.length === 0) return null;
    if (segs.length === 1) {
      // Apenas key sem bucket — não temos como inferir o bucket com segurança
      return null;
    }
    const bucket = segs[0];
    const keyParts = segs.slice(1);
    const normalizedKeyParts = keyParts[0] === bucket ? keyParts.slice(1) : keyParts;
    return { bucket, key: normalizedKeyParts.join('/') };
  }
}