# 🚀 Configuração de Deploy Automático - Vercel

## 📋 Projeto Vercel Existente
**URL do Projeto:** https://vercel.com/sempre-bella-balsas-projects/lojavirtualsemprebellabalsas

## 🔗 Passo 1: Conectar Repositório GitHub

1. **Acesse seu projeto no Vercel:**
   - Vá para: https://vercel.com/sempre-bella-balsas-projects/lojavirtualsemprebellabalsas
   - Clique em **Settings** (Configurações)

2. **Conectar ao GitHub:**
   - Vá para **Git Repository**
   - Clique em **Connect Git Repository**
   - Selecione: `semprebellasuporte2025/lojavirtualsemprebellabalsas`
   - Branch de produção: `main`

## ⚙️ Passo 2: Configurar Variáveis de Ambiente

Vá para **Settings > Environment Variables** e adicione:

### 🔑 Variáveis de Produção (Production)
```
VITE_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
VITE_ORDER_WEBHOOK_URL=https://seu-dominio.vercel.app/api/webhook/orders
SITE_URL=https://seu-dominio.vercel.app
```

### 🔍 Variáveis de Preview (Preview)
```
VITE_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
VITE_ORDER_WEBHOOK_URL=https://preview-seu-dominio.vercel.app/api/webhook/orders
SITE_URL=https://preview-seu-dominio.vercel.app
```

## 🛠️ Passo 3: Configurações de Build

Vá para **Settings > General** e configure:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`
- **Development Command:** `npm run dev`

## 🔄 Passo 4: Deploy Automático

Após conectar o repositório:

1. **Deploy Automático:** Ativado automaticamente
2. **Branch de Produção:** `main`
3. **Preview Deployments:** Ativado para PRs

## 📦 Passo 5: Testar Deploy

1. **Fazer um commit de teste:**
   ```bash
   git add .
   git commit -m "test: Deploy automático configurado"
   git push origin main
   ```

2. **Verificar no Vercel:**
   - O deploy deve iniciar automaticamente
   - Acompanhe o progresso na aba **Deployments**

## 🎯 Funcionalidades Configuradas

### ✅ Deploy Automático
- ✅ Push na branch `main` → Deploy de produção
- ✅ Pull Request → Deploy de preview
- ✅ GitHub Actions configurado

### ✅ Otimizações
- ✅ Cache otimizado para assets
- ✅ Headers de segurança
- ✅ Roteamento SPA
- ✅ Compressão automática

### ✅ Monitoramento
- ✅ Logs de build em tempo real
- ✅ Métricas de performance
- ✅ Notificações de deploy

## 🔧 Comandos Úteis

### Deploy Manual (se necessário)
```bash
npx vercel --prod
```

### Preview Deploy
```bash
npx vercel
```

### Logs do Deploy
```bash
npx vercel logs
```

## 📱 URLs do Projeto

- **Produção:** https://lojavirtualsemprebellabalsas.vercel.app
- **Dashboard:** https://vercel.com/sempre-bella-balsas-projects/lojavirtualsemprebellabalsas

## 🆘 Solução de Problemas

### Build Falha
1. Verifique as variáveis de ambiente
2. Confirme se todas as dependências estão no `package.json`
3. Teste o build localmente: `npm run build`

### Deploy Não Inicia
1. Verifique se o repositório está conectado
2. Confirme se a branch `main` existe
3. Verifique permissões do GitHub

### Site Não Carrega
1. Verifique as variáveis de ambiente do Supabase
2. Confirme se o `SITE_URL` está correto
3. Teste localmente: `npm run dev`

## 🎉 Próximos Passos

1. ✅ Conectar repositório GitHub
2. ✅ Configurar variáveis de ambiente
3. ✅ Testar deploy automático
4. 🔄 Configurar domínio personalizado (opcional)
5. 🔄 Configurar analytics (opcional)

---

**🚀 Seu e-commerce SempreBella está pronto para deploy automático!**