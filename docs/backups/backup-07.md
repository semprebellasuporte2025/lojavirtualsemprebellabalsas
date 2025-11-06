# Ponto de Restauração 07 - Pedidos Recentes clicáveis e Deep-link de Vendas

## Informações Básicas
- **Data:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Escopo:** Navegação em "Pedidos Recentes" + deep-link automático na listagem de vendas + ajustes visuais de links no AdminLayout
- **Método:** Documentação do estado atual + snapshots de arquivos
- **Responsável:** Sistema
- **Local de Armazenamento:** `docs/backups/backup-07.md`

## Descrição
Este ponto de restauração documenta e consolida as seguintes implementações:
- Tornar os cartões da seção "Pedidos Recentes" do dashboard clicáveis, navegando para `Vendas → Listar` com `?pedido=<numero_pedido>`.
- Habilitar deep-link na página `Vendas → Listar` para abrir automaticamente o modal de edição quando a URL contém `?pedido=<numero_pedido>` ou `?edit=<id>`.
- Ajustar o estilo dos links do menu e submenu no `AdminLayout` para remover sublinhado e manter a cor branca (`no-underline` e `visited:text-white`).

## Principais Alterações
- ✅ `Dashboard`: clique em pedidos recentes navega para `vendas/listar?pedido=...`.
- ✅ `Vendas → Listar`: reconhece `?pedido` ou `?edit` e abre o modal de edição automaticamente.
- ✅ `AdminLayout`: links do menu/submenu sem sublinhado, cor branca consistente.

## Arquivos Modificados
- `src/components/feature/AdminLayout.tsx`
- `src/pages/admin/dashboard/page.tsx`
- `src/pages/admin/vendas/listar/page.tsx`

## Snapshots dos Arquivos
- `docs/backups/snapshots/2025-11-05-AdminLayout.tsx`
- `docs/backups/snapshots/2025-11-05-AdminDashboardPage.tsx`
- `docs/backups/snapshots/2025-11-05-VendasListarPage.tsx`

## Checklist de Validação Funcional

- [x] Dashboard carrega sem erros e exibe "Pedidos Recentes".
- [x] Clique em um pedido recente navega para `Vendas → Listar` com `?pedido=<numero_pedido>`.
- [x] Página `Vendas → Listar` abre automaticamente o modal de edição quando há `?pedido` ou `?edit` na URL.
- [x] Menu e submenus do Admin sem sublinhado, com fonte branca.
- [x] Servidor de desenvolvimento rodando e aplicando HMR sem erros.

## Como Testar
1. Acesse o dashboard em `http://localhost:3002/paineladmin/dashboard`.
2. Clique em um item de "Pedidos Recentes" e confirme a navegação para `vendas/listar?pedido=<numero_pedido>`.
3. Verifique se o modal de edição abre automaticamente com os dados da venda.
4. Opcional: acesse diretamente `http://localhost:3002/paineladmin/vendas/listar?edit=<id>` para abrir por ID.
5. Confirme o estilo dos links do menu/submenu (sem sublinhado e cor branca) no admin.

## Comandos para Gerar Backup Físico (Opcional)

```powershell
# No diretório do projeto
Compress-Archive -Path * -DestinationPath backup07.zip -Force

# Hash SHA-256
Get-FileHash -Algorithm SHA256 .\backup07.zip | Select-Object -ExpandProperty Hash

# Metadados
(Get-Item .\backup07.zip | Select-Object Name, Length, LastWriteTime)
```

## Como Restaurar Este Ponto
Substitua os arquivos pelos snapshots correspondentes:
- `src/components/feature/AdminLayout.tsx` ← `docs/backups/snapshots/2025-11-05-AdminLayout.tsx`
- `src/pages/admin/dashboard/page.tsx` ← `docs/backups/snapshots/2025-11-05-AdminDashboardPage.tsx`
- `src/pages/admin/vendas/listar/page.tsx` ← `docs/backups/snapshots/2025-11-05-VendasListarPage.tsx`

## Observações
- O deep-link aceita `?pedido=<numero_pedido>` ou `?edit=<id>` e abre o modal após o carregamento das vendas.
- Opcionalmente, você pode limpar o parâmetro da URL após abrir o modal para evitar reabertura em refresh.
- Estilo dos links foi padronizado no `AdminLayout` usando utilitários do Tailwind.

---
*Backup criado automaticamente seguindo a política de backups do projeto*