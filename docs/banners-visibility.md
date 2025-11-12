## Fluxo de visibilidade de banners

- Cliente dedicado: leituras e assinaturas de banners usam `src/lib/supabasePublic.ts`, que não envia `Authorization` — apenas `apikey`.
- Políticas RLS: a tabela `public.banners` permite `SELECT` público apenas para `ativo = true`. Usuários autenticados continuam podendo gerenciar via políticas existentes.
- Independência de autenticação: estando logado ou não, o fluxo de exibição usa o cliente público, garantindo consistência.
- Robustez no componente: o `BannerSlider` mantém o último conjunto válido de banners, ignora cache após eventos realtime e tenta refetch controlado para evitar janelas de inconsistência.

### Segurança
- O uso do cliente público não expõe dados sensíveis: apenas lê registros com `ativo = true`, conforme RLS.
- Operações de CRUD (admin) continuam exigindo autenticação e seguem políticas de escrita.

### Validação
- Verifique logs no console: `Cache sessionStorage HIT`, `Evento Realtime recebido`, `Bypass de cache após realtime`, `Banners carregados do banco`.
- Cadastre/edite/exclua um banner e confirme que o slider permanece visível para usuários não autenticados, autenticados e administradores.