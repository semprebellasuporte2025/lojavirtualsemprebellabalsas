import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';

interface LinkItem {
  label: string;
  url: string;
  imageUrl?: string; // Adicionado para a imagem
}

interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  youtube?: string;
  tiktok?: string;
}

export default function LinkPage() {
  const { showToast } = useToast();
  // Configuração básica estática (nome, bio, avatar, sociais)
  const profile = useMemo(
    () => ({
      name: 'Sempre Bella Balsas',
      bio: 'Moda feminina com estilo e autenticidade.',
      avatarUrl: '/placeholder-small.svg',
      socials: {
        instagram: 'https://www.instagram.com/semprebella.balsas/',
        whatsapp: 'https://wa.me/559998853031',
        youtube: 'https://www.youtube.com/',
        tiktok: 'https://www.tiktok.com/',
      } as SocialLinks,
    }),
    []
  );

  interface InstagramLinkRow {
    id: string;
    nome_link: string;
    link: string; // Adicionado para o link de destino
    link_img: string | null; // URL pública da imagem (upload)
    img_link: string | null;  // campo alternativo encontrado no admin
    ativo?: boolean | null;
    created_at?: string | null;
    ordem_exibicao?: number | null;
    img_topo?: string | null;
    linktopo_img_?: string | null;
    descricao_topo?: string | null;
  }

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [topo, setTopo] = useState<{ img: string; href?: string; descricao?: string } | null>(null);

  // Texto de bio: usa a descrição_topo quando disponível
  const bioText = topo?.descricao || profile.bio;

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('link_instagram')
          .select('id, nome_link, link, link_img, img_link, ativo, created_at, ordem_exibicao, img_topo, linktopo_img_, descricao_topo')
          .order('ordem_exibicao', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) throw error;

        const rows = (data || []) as InstagramLinkRow[];

        // Separar o registro de Imagem Topo, se existir
        const topoRow = rows.find(r => !!r.img_topo);
        if (topoRow?.img_topo) {
          setTopo({
            img: topoRow.img_topo,
            href: topoRow.linktopo_img_ || undefined,
            descricao: topoRow.descricao_topo || undefined,
          });
        } else {
          setTopo(null);
        }

        // Montar lista pública de links: usar nome_link como rótulo e o melhor destino disponível
        const activeRows = rows.filter(r => r.ativo !== false && !r.img_topo); // exibe se ativo é true ou undefined, e não é o item de topo
        const items: LinkItem[] = activeRows
          .filter(r => !!r.nome_link)
          .map(r => ({
            label: r.nome_link,
            url: r.link || '#', // Usa o novo campo 'link'
            imageUrl: r.link_img || r.img_link || undefined, // Adiciona a URL da imagem
          }));
        setLinks(items);
      } catch (err: any) {
        console.error('Erro ao carregar links públicos:', err);
        showToast('Erro ao carregar links.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLinks();
  }, [showToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-rose-50 flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {/* Imagem Topo no topo da página */}
          {topo?.img && (
            <div className="mb-4">
              <a href={topo.href || undefined} target={topo.href ? '_blank' : undefined} rel={topo.href ? 'noopener noreferrer' : undefined} className="block">
                <img
                  src={topo.img}
                  alt={topo.descricao || 'Imagem topo'}
                  className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-pink-500"
                />
              </a>
            </div>
          )}

          <h1 className="text-3xl font-bold text-pink-600" style={{ fontFamily: '"Pacifico", serif' }}>{profile.name}</h1>
          <p className="mt-1 text-sm text-gray-600">{bioText}</p>
        </div>

        {/* Lista de links (dinâmica) */}
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500">
              <i className="ri-loader-4-line animate-spin text-xl"></i>
              <span className="ml-2">Carregando links...</span>
            </div>
          ) : links.length === 0 ? (
            <div className="text-center text-gray-500">
              <i className="ri-links-line text-2xl"></i>
              <span className="ml-2">Nenhum link disponível</span>
            </div>
          ) : (
            links.map((item) => (
              <a
                key={item.label}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center w-full rounded-2xl shadow-md px-4 py-3 font-semibold bg-pink-600 text-white transition-transform duration-200 hover:scale-[1.02] hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 no-underline hover:no-underline focus:no-underline active:no-underline visited:no-underline"
                style={{ textDecoration: 'none' }}
              >
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.label} className="w-10 h-10 rounded-full object-cover mr-4" />
                )}
                <span className="flex-grow text-center">{item.label}</span>
              </a>
            ))
          )}
        </div>

        {/* Ícones sociais */}
        
      </div>
    </div>
  );
}