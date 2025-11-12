# Ponto de Restauração 08 - Banners dinâmicos na Categoria + Filtro Mobile

## Informações Básicas
- **Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Escopo:** Banners dinâmicos nas páginas de categoria, otimização de cache e cliente público do Supabase, filtro de tamanhos horizontal exclusivo para mobile
- **Método:** Documentação do estado atual + snapshots de arquivos
- **Responsável:** Sistema
- **Local de Armazenamento:** `docs/backups/backup-08.md`

## Descrição
Este ponto de restauração consolida as correções e melhorias implementadas recentemente:
- Substituição do `HeroSlider` por `BannerSlider` dinâmico nas páginas de categoria, consumindo dados públicos do Supabase.
- Ajuste de cache no `BannerSlider` para ignorar caches vazios e persistir apenas quando há conteúdo válido (TTL 5 minutos), com fallback seguro.
- Configuração do cliente público do Supabase como singleton com `storageKey` próprio, evitando avisos de múltiplas instâncias do GoTrueClient em HMR.
- Implementação de filtro de tamanhos horizontal e rolável (exclusivo para mobile) na página de categoria; sidebar de filtros permanece no desktop.

## Principais Alterações
- ✅ `Categoria`: `BannerSlider` dinâmico substitui o slider anterior e respeita RLS pública.
- ✅ `BannerSlider`: ignora caches vazios; só grava cache com banners; mantém último estado válido.
- ✅ `supabasePublic`: singleton e `storageKey: 'semprebella-public-auth'` para evitar múltiplos GoTrueClient.
- ✅ `Categoria (mobile)`: barra de tamanhos horizontal com scroll e estilo consistente.

## Arquivos Modificados
- `src/pages/categoria/page.tsx`
- `src/components/feature/BannerSlider/BannerSlider.tsx`
- `src/lib/supabasePublic.ts`

## Snapshots dos Arquivos
- `docs/backups/snapshots/2025-11-12-CategoriaPage.tsx`
- `docs/backups/snapshots/2025-11-12-BannerSlider.tsx`
- `docs/backups/snapshots/2025-11-12-supabasePublic.ts`

## Checklist de Validação Funcional
- [x] Banners aparecem nas páginas de categoria para administradores logados.
- [x] Filtro de tamanhos horizontal (mobile) exibe chips com scroll e seleção.
- [x] Placeholder de produto é exibido quando imagem falha/é abortada.
- [x] Servidor de desenvolvimento ativo e preview validado em `http://localhost:3012/categoria/Blusas`.

## Como Testar
1. Abra `http://localhost:3012/categoria/Blusas`.
2. No mobile ou simulando viewport pequena, valide a barra horizontal de tamanhos: scroll, seleção, botão "Limpar" quando selecionado.
3. Valide que banners carregam e trocam slides; alterações em tempo real refletem sem precisar recarregar.
4. Em caso de imagens temporárias inválidas (produtos), confirme que o placeholder é exibido sem quebrar o layout.

## Comandos para Gerar Backup Físico (Opcional)

```powershell
# No diretório do projeto
Compress-Archive -Path * -DestinationPath backup08.zip -Force

# Hash SHA-256
Get-FileHash -Algorithm SHA256 .\backup08.zip | Select-Object -ExpandProperty Hash

# Metadados
(Get-Item .\backup08.zip | Select-Object Name, Length, LastWriteTime)
```

## Como Restaurar Este Ponto
Substitua os arquivos pelos snapshots correspondentes:
- `src/pages/categoria/page.tsx` ← `docs/backups/snapshots/2025-11-12-CategoriaPage.tsx`
- `src/components/feature/BannerSlider/BannerSlider.tsx` ← `docs/backups/snapshots/2025-11-12-BannerSlider.tsx`
- `src/lib/supabasePublic.ts` ← `docs/backups/snapshots/2025-11-12-supabasePublic.ts`

## Observações
- Logs como `net::ERR_ABORTED` ou `net::ERR_NETWORK_CHANGED` durante HMR em desenvolvimento são esperados; a UI está protegida por fallbacks.
- O cache de banners agora evita persistir estados vazios para impedir telas sem banners em sessões específicas.
- A barra de tamanhos é exclusiva para mobile; o desktop mantém a sidebar clássica de filtros.

---
*Backup criado automaticamente seguindo a política de backups do projeto*