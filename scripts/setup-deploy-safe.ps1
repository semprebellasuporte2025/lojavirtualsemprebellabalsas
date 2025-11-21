# Script de Setup Seguro para Deploy
# Este script ajuda a configurar o ambiente de forma segura sem expor chaves

Write-Host "🚀 Configuração Segura para Deploy - SempreBella" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

# Verificar se há arquivos sensíveis
$sensitiveFiles = Get-ChildItem -Path . -Force -Include "*.env", "*.local" -Recurse
if ($sensitiveFiles.Count -gt 0) {
    Write-Host "❌ ALERTA: Arquivos sensíveis encontrados:" -ForegroundColor Red
    $sensitiveFiles | ForEach-Object { Write-Host "   $($_.Name)" -ForegroundColor Red }
    Write-Host ""
    Write-Host "⚠️  REMOVA ESTES ARQUIVOS ANTES DO COMMIT!" -ForegroundColor Yellow
    Write-Host "   Use: git rm --cached <arquivo> && rm <arquivo>" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Nenhum arquivo sensível encontrado no git" -ForegroundColor Green

# Verificar gitignore
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue
if ($gitignoreContent -contains "*.env" -and $gitignoreContent -contains "*.local") {
    Write-Host "✅ .gitignore configurado corretamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Verifique se .gitignore inclui: *.env e *.local" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS PARA DEPLOY SEGURO:" -ForegroundColor Cyan
Write-Host "1. Crie um repositório no GitHub"
Write-Host "2. Configure os SECRETS no GitHub Actions:"
Write-Host "   - VERCEL_TOKEN"
Write-Host "   - VERCEL_ORG_ID"  
Write-Host "   - VERCEL_PROJECT_ID"
Write-Host "   - VITE_PUBLIC_SUPABASE_URL"
Write-Host "   - VITE_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "   - SITE_URL"
Write-Host "3. Configure as variáveis no Vercel Dashboard"
Write-Host "4. Use supabase functions secrets set para chaves privadas"

Write-Host ""
Write-Host "🔒 CHAVES QUE NUNCA DEVEM SER COMMITADAS:" -ForegroundColor Red
Write-Host "- SUPABASE_SERVICE_ROLE_KEY"
Write-Host "- Qualquer chave que comece com 'eyJ' (JWT)"
Write-Host "- Tokens de API privados"

Write-Host ""
Write-Host "✅ Para verificar se está seguro: git status && git ls-files | Select-String -Pattern '(\\.env|\\.local|secret|key|token)'" -ForegroundColor Green