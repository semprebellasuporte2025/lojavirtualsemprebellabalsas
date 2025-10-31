# Registro do Backup 04

- Arquivo: `backup04.zip`
- Data/Hora: 2025-10-29 (UTC)
- Escopo: repositório completo do projeto `semprebella2` (código-fonte, configs e scripts)
- Método: PowerShell `Compress-Archive -Path * -DestinationPath backup04.zip -Force`
- Local: diretório raiz do projeto (`c:\semprebella2`)

## Principais alterações desde o último backup

- Diagnóstico do erro `StorageApiError: new row violates row-level security policy` no upload de imagens de categorias
- Criação/ajuste de scripts de suporte:
  - `scripts/test-storage-upload.js` (teste de upload usando anon key)
  - `scripts/fix-storage-policies.js` e `scripts/final-fix-storage-rls.js` (orientações para policies do storage)
  - `scripts/test-category-upload.js` e `scripts/test-category-submit.js` (testes do fluxo de cadastro)
- Revisão da página `src/pages/admin/categorias/cadastrar/page.tsx` para upload via `supabaseWithAuth.storage`
- Confirmação de variáveis `.env` e cliente `src/lib/supabaseAuth.ts`

## Validação funcional (resultado: Parcial)

- ✅ Home carrega e exibe produtos sem erros visíveis
- ✅ Servidor de desenvolvimento inicia e navegação básica ocorre sem erros
- ✅ Cadastro de categoria SEM imagem funciona
- ❌ Cadastro de categoria COM imagem falha no upload por RLS do bucket `categorias`

### Ação pendente (após restauração ou em produção)

Criar policies no Supabase Storage para o bucket `categorias`:

- SELECT (leitura pública):
  - Policy name: "Permitir leitura pública do bucket categorias"
  - Operation: SELECT
  - Target roles: public
  - USING: `bucket_id = 'categorias'`

- INSERT (upload por autenticados):
  - Policy name: "Permitir upload de imagens de categorias"
  - Operation: INSERT
  - Target roles: authenticated
  - WITH CHECK: `bucket_id = 'categorias'`

Opcional via SQL (Editor do Supabase):

```sql
create policy "Permitir leitura pública do bucket categorias"
on storage.objects
as permissive
for select
to public
using (bucket_id = 'categorias');

create policy "Permitir upload de imagens de categorias"
on storage.objects
as permissive
for insert
to authenticated
with check (bucket_id = 'categorias');
```

## Como verificar integridade

- Hash SHA-256: `51FB1ABE5BFDEB601CE270289ED4CBFA758D577D02790E10C43243ED067B0463`
- Tamanho: 365.190.614 bytes (~348MB)
- Data/Hora (local): 29/10/2025 18:10:24

> Política: Este backup registra o estado atual do projeto com a pendência de policies RLS no storage de `categorias`. Após aplicar as policies acima, o upload de imagens deve funcionar para usuários autenticados.