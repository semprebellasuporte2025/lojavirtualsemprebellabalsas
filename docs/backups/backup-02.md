# Registro do Backup 02

- Arquivo: `backup02.zip`
- Data/Hora: 2025-10-28 (UTC)
- Escopo: repositório completo do projeto `semprebella2` (código-fonte, configs e scripts)
- Método: PowerShell `Compress-Archive -Path * -DestinationPath backup02.zip -Force`
- Local: diretório raiz do projeto (`c:\semprebella2`)

Validação funcional (resultado: OK):

- Home carrega e exibe produtos (recentes/destaques/categorias) sem erros visíveis.
- Botões “Ver Detalhes” (Home, Categoria e Relacionados) navegam para `/produto/:id` corretamente.
- Minha Conta > Meus Pedidos: botão “Ver Detalhes” abre modal com dados do pedido e itens.
- Servidor de desenvolvimento inicia e a navegação básica ocorre sem erros no console do navegador.

Observações:

- Consultas do Supabase foram refatoradas previamente para evitar joins aninhados que causavam erros 400.
- Botões “Ver Detalhes” foram padronizados para `Link`, respeitando `basename` e evitando conflitos de clique com o card.

Como verificar integridade (opcional, recomendado):

- Hash SHA-256: `Get-FileHash -Algorithm SHA256 .\backup02.zip | Select-Object -ExpandProperty Hash`
- Tamanho e data: `(Get-Item .\backup02.zip | Select-Object Name, Length, LastWriteTime)`

Política (resumo): todo backup deve ser documentado e validado com as funcionalidades principais funcionando. Ver detalhes em `docs/backups/README.md`.