# Backup 04 - Ponto de Restauração

## Informações Básicas
- **Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Escopo:** Ajustes de autenticação e correção de Hooks no Header
- **Método:** Documentação do estado atual + snapshots de arquivos
- **Responsável:** Sistema
- **Local de Armazenamento:** `docs/backups/backup-04.md`

## Descrição
Este backup documenta o estado do projeto após:
- Correção do erro de Hooks no `Header` usando seletor puro no `useCart`.
- Remoção do nome fixo "Karina Arruda" e cálculo dinâmico do `adminName` no `useAuth`.
- Reinício do servidor de desenvolvimento (porta 3003) e validação visual no painel.

Snapshots dos arquivos alterados foram salvos para facilitar rollback:
- `docs/backups/snapshots/2025-11-04-useAuth.ts`
- `docs/backups/snapshots/2025-11-04-Header.tsx`

## Principais Alterações desde o último backup
- ✅ `Header.tsx`: substituído `state.getTotalItems()` por seletor puro `state.items.reduce(...)` evitando hooks condicionais.
- ✅ `useAuth.ts`: removido nome hardcoded e implementado `computeDisplayName` com prioridades: `usuarios_admin.nome` → metadados do usuário → prefixo do e-mail em Title Case.
- ✅ `useAuth.ts`: melhorada verificação de admin com cache, promessa compartilhada e timeouts.
- ✅ Servidor dev reiniciado em `http://localhost:3003/` e preview validado.

## Checklist de Validação Funcional

- [x] **Painel administrativo** exibe o nome correto do usuário logado.
- [x] **Header** renderiza sem erros de hooks e sem warnings.
- [x] **Servidor de desenvolvimento** sobe em `:3003` sem erros.
- [x] **Navegação** entre páginas funciona normalmente.
- [x] **Carrinho** exibe contagem consistente dos itens.

## Como gerar o arquivo físico de backup (zip)

```powershell
# No diretório do projeto
Compress-Archive -Path * -DestinationPath backup04.zip -Force

# Hash SHA-256
Get-FileHash -Algorithm SHA256 .\backup04.zip | Select-Object -ExpandProperty Hash

# Metadados
(Get-Item .\backup04.zip | Select-Object Name, Length, LastWriteTime)
```

## Como restaurar este ponto rapidamente

- Substitua os arquivos pela versão dos snapshots:
  - `src/hooks/useAuth.ts` ← `docs/backups/snapshots/2025-11-04-useAuth.ts`
  - `src/components/feature/Header.tsx` ← `docs/backups/snapshots/2025-11-04-Header.tsx`
- Reinicie o servidor de desenvolvimento.

## Observações
- A correção do nome do usuário depende dos dados em `usuarios_admin` e/ou metadados do usuário.
- Caso o nome ainda apareça incorreto, atualize `usuarios_admin.nome` ou os metadados do usuário.

---
*Backup criado automaticamente seguindo a política de backups do projeto*