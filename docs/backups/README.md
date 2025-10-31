# Política de Backups

Este diretório mantém a política, o histórico e os registros (runbooks) de cada backup do sistema.

Regras obrigatórias:

- Todo backup deve ser DOCUMENTADO com: data, escopo, método, responsável e local de armazenamento.
- Todo backup só é considerado VÁLIDO após a validação funcional: principais fluxos devem estar funcionando.
- Cada registro de backup deve conter uma checklist de verificação marcada como OK.
- Recomenda-se registrar hash (SHA-256) do arquivo gerado e tamanho final.
- Manter pelo menos 2 gerações de backups recentes (ex.: backup01, backup02).

Checklist mínimo de validação funcional:

- Home carrega produtos sem erros (recentes, destaques e seções por categoria).
- Botão “Ver Detalhes” navega para a página de produto corretamente.
- Página de Produto carrega galeria, informações e produtos relacionados.
- Minha Conta > Meus Pedidos: modal “Ver Detalhes” abre e exibe os itens.
- Carrinho e fluxo de checkout básicos (adicionar item e navegar até checkout) iniciam sem erros.
- Servidor de desenvolvimento sobe sem erros aparentes.

Comandos úteis (PowerShell):

- Criar backup zip no diretório do projeto:
  `Compress-Archive -Path * -DestinationPath backupXX.zip -Force`

- Calcular hash SHA-256 do arquivo de backup:
  `Get-FileHash -Algorithm SHA256 .\backupXX.zip | Select-Object -ExpandProperty Hash`

- Obter tamanho e data de modificação:
  `(Get-Item .\backupXX.zip | Select-Object Name, Length, LastWriteTime)`

Estrutura sugerida:

- `docs/backups/backup-XX.md` — registro detalhado de cada backup.
- `docs/backups/README.md` — esta política e instruções.