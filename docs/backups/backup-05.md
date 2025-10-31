# Registro do Backup 05

- Arquivo: `backup05.zip`
- Data/Hora: 2025-10-30 (UTC)
- Escopo: código-fonte e configs (sem `out` e `node_modules`) do projeto `semprebella2`
- Método: PowerShell `Compress-Archive -Path src, public, supabase, scripts, docs, package.json, package-lock.json, tailwind.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, postcss.config.ts, vite.config.ts, .env, .env.example, index.html -DestinationPath backup05.zip -Force`
- Local: diretório raiz do projeto (`c:\semprebella2`)

## Principais alterações desde o último backup

- Página de Produto: descrição agora renderiza HTML real do editor, removendo mock e com fallback “Descrição não disponível” quando vazio (`src/pages/product/components/ProductTabs.tsx`).
- Avaliações reais integradas: `ProductTabs.tsx` busca `reviews` no Supabase por `produto_id`, calcula média e distribuição por estrelas, atualiza rótulo da aba “Avaliações (N)”, e renderiza lista de avaliações, com estados de carregamento/erro/vazio.
- Observação: nome do cliente é opcional (dependente de relation no PostgREST); quando ausente, exibe “Cliente”. Sugestão futura: conectar `ProductInfo` às métricas reais de rating/contagem para consistência.

## Validação funcional (resultado: OK)

- ✅ Servidor de desenvolvimento inicia sem erros aparentes (porta 3005).
- ✅ Página de Produto exibe descrição com formatação correta.
- ✅ Aba “Avaliações” mostra contagem real ou mensagem de vazio quando não há dados.
- ✅ Navegação básica (Home → Produto) OK.

## Como verificar integridade

- Hash SHA-256: FB8A91B5BA20DA89E68B94C197CE17FE061385F57C57B97069F8AACA5C699114
- Tamanho: 299.797 bytes (~293KB)
- Data/Hora (local): 30/10/2025 08:37:57

### Comandos úteis

```powershell
# Gerar backup (código + configs)
Compress-Archive -Path src, public, supabase, scripts, docs, package.json, package-lock.json, tailwind.config.ts, tsconfig.json, tsconfig.app.json, tsconfig.node.json, postcss.config.ts, vite.config.ts, .env, .env.example, index.html -DestinationPath backup05.zip -Force

# Calcular hash
Get-FileHash -Algorithm SHA256 .\backup05.zip | Select-Object -ExpandProperty Hash

# Obter tamanho e data
(Get-Item .\backup05.zip | Select-Object Name, Length, LastWriteTime)
```

> Política: Este backup documenta a correção de renderização da descrição e a integração de avaliações reais na página de produto. Ver detalhes da política em `docs/backups/README.md`.