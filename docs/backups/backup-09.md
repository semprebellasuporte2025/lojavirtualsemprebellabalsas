# Ponto de Restauração 09 - Consolidação de Snapshots e Estabilidade da Categoria

## Informações Básicas
- **Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Escopo:** Consolidação de snapshots dos arquivos críticos (Categoria, BannerSlider e cliente público do Supabase) e checkpoint de estabilidade pós correções
- **Método:** Documentação do estado atual + snapshots de arquivos
- **Responsável:** Sistema
- **Local de Armazenamento:** `docs/backups/backup-09.md`

## Descrição
Este ponto de restauração registra um checkpoint estável da aplicação após as melhorias recentes:
- `Categoria`: barra de tamanhos horizontal exclusiva para mobile com scroll, chips responsivos e botão "Limpar"; sidebar de filtros oculta em mobile e mantida no desktop.
- `BannerSlider`: cache refinado que ignora estados vazios, mantém último estado válido e não persiste fallback; tratamento seguro de URLs desktop/mobile; realtime atualiza sem regressões.
- `supabasePublic`: cliente público singleton com `storageKey` próprio (`semprebella-public-auth`) para evitar avisos de múltiplas instâncias do GoTrueClient em HMR.

Nenhum código adicional foi alterado desde o último ponto; este backup consolida os snapshots e valida o comportamento atual.

## Principais Alterações
- ✅ Consolidação de snapshots dos arquivos críticos (Categoria, BannerSlider, supabasePublic).
- ✅ Confirmação de estabilidade da UI e dos filtros mobile na Categoria.
- ✅ Validação de fallbacks visuais para imagens de produto e banners.

## Arquivos de Referência (estado atual)
- `src/pages/categoria/page.tsx`
- `src/components/feature/BannerSlider/BannerSlider.tsx`
- `src/lib/supabasePublic.ts`

## Snapshots dos Arquivos
- `docs/backups/snapshots/2025-11-12-CategoriaPage.tsx`
- `docs/backups/snapshots/2025-11-12-BannerSlider.tsx`
- `docs/backups/snapshots/2025-11-12-supabasePublic.ts`

## Checklist de Validação Funcional
- [x] Banners dinâmicos exibidos nas páginas de categoria; fallback quando necessário.
- [x] Filtro de tamanhos horizontal (mobile) com scroll e seleção funcional.
- [x] Sidebar de filtros aparece apenas em desktop; oculta em mobile.
- [x] Placeholder de imagens de produto e banners em falhas/abortos de rede.
- [x] Servidor de desenvolvimento ativo e preview validado em `http://localhost:3012/categoria/Blusas`.

## Como Testar
1. Acesse `http://localhost:3012/categoria/Blusas`.
2. Em viewport mobile (≤ 768px), valide a barra horizontal de tamanhos: scroll, seleção, e o botão "Limpar" quando há seleção.
3. Verifique a exibição dos banners e a navegação entre slides.
4. Inspecione se produtos com URLs inválidas usam o placeholder sem quebrar o layout.

## Comandos para Gerar Backup Físico (Opcional)

```powershell
# No diretório do projeto
Compress-Archive -Path * -DestinationPath backup09.zip -Force

# Hash SHA-256
Get-FileHash -Algorithm SHA256 .\backup09.zip | Select-Object -ExpandProperty Hash

# Metadados
(Get-Item .\backup09.zip | Select-Object Name, Length, LastWriteTime)
```

## Como Restaurar Este Ponto
Substitua os arquivos pelos snapshots correspondentes:
- `src/pages/categoria/page.tsx` ← `docs/backups/snapshots/2025-11-12-CategoriaPage.tsx`
- `src/components/feature/BannerSlider/BannerSlider.tsx` ← `docs/backups/snapshots/2025-11-12-BannerSlider.tsx`
- `src/lib/supabasePublic.ts` ← `docs/backups/snapshots/2025-11-12-supabasePublic.ts`

## Observações
- Erros de rede como `net::ERR_ABORTED` e `net::ERR_NETWORK_CHANGED` em desenvolvimento podem ocorrer durante HMR; a UI está protegida por fallbacks.
- O cache de banners evita persistir estados vazios para impedir telas sem banners.
- A barra de tamanhos é exclusiva para mobile; o desktop mantém a sidebar clássica.

---
*Backup criado automaticamente seguindo a política de backups do projeto*