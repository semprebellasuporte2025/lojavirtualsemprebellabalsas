# 📋 Configuração do Mercado Pago - Modo Teste

Este guia detalha como configurar a integração com o Mercado Pago em modo de teste (sandbox) para o projeto SempreBella.

## 🔑 Credenciais de Teste Fornecidas

- **Public Key**: APP_USR-5883158630627677-111712-da54f0c79431e17e0cb8d9ec79b304b8-2997053008
- **Access Token**: APP_USR-5d7a496b-b8e2-4191-8599-1b7ae9d8fa0d
- **Webhook Secret**: 26c1280021e1b8b9241b8675c8eb0864a96e907129175e6bfc5a7d57218092cb

## 🚀 Passo a Passo para Configuração

### 1. Instalar CLI do Supabase

Escolha um dos métodos abaixo:

#### **Opção A: Via Scoop (Recomendado para Windows)**
```powershell
# Instalar Scoop (se ainda não tiver)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Instalar CLI do Supabase
scoop install supabase

# Verificar instalação
supabase --version
```

#### **Opção B: Binário Manual**
1. Baixe o binário: https://github.com/supabase/cli/releases
2. Extraia e mova para `C:\Program Files\Supabase\`
3. Adicione ao PATH do sistema

#### **Opção C: Via Docker**
```bash
docker run --rm -it supabase/cli:latest version
```

### 2. Configurar Secrets no Supabase

Execute os comandos abaixo no terminal (substitua `YOUR_PROJECT_REF` pela referência do seu projeto):

```bash
# Configurar Access Token do Mercado Pago
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-5d7a496b-b8e2-4191-8599-1b7ae9d8fa0d

# Configurar Webhook Secret do Mercado Pago
supabase secrets set MERCADOPAGO_WEBHOOK_SECRET=26c1280021e1b8b9241b8675c8eb0864a96e907129175e6bfc5a7d57218092cb

# Configurar URL do site (usar URL do Vercel em produção)
supabase secrets set SITE_URL=https://semprebella.vercel.app

# Configurar URL de notificação (opcional)
supabase secrets set MERCADOPAGO_NOTIFICATION_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1/mercado-pago-webhook
```

### 3. Deploy das Funções Edge

```bash
# Fazer deploy de todas as funções do Mercado Pago
supabase functions deploy mercado-pago-checkout-pro
supabase functions deploy mercado-pago-payments
supabase functions deploy mercado-pago-status
supabase functions deploy mercado-pago-webhook
```

### 4. Testar a Integração

#### Cartões de Teste para Sandbox:
- **Cartão Aprovado**: 5031 7557 3453 0604 (CVV: 123)
- **Cartão Recusado**: 5031 4444 4444 4448 (CVV: 123)
- **CPF**: 123.456.789-00

#### URLs para Teste:
- **Checkout Pro**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mercado-pago-checkout-pro`
- **Status Pagamentos**: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/mercado-pago-status`

### 5. Verificar Configuração

```bash
# Listar secrets configurados
supabase secrets list

# Verificar status das funções
supabase functions list
```

## 🌐 Dashboard de Teste do Mercado Pago

Acesse: https://www.mercadopago.com.br/developers/panel
- Credenciais: suas credenciais de desenvolvedor
- Navegue até "Minhas aplicações"
- Verifique as transações de teste na aba "Atividade"

## 🔧 Troubleshooting

### Erro: "supabase: command not found"
- Verifique se o CLI está instalado: `supabase --version`
- Se não encontrar, reinstale seguindo as instruções acima

### Erro: "Missing MERCADOPAGO_ACCESS_TOKEN"
- Verifique se o secret foi configurado: `supabase secrets list`
- Execute novamente: `supabase secrets set MERCADOPAGO_ACCESS_TOKEN=...`

### Erro 500 nas funções Edge
- Verifique os logs: `supabase functions logs mercado-pago-checkout-pro`
- Confirme se as variáveis de ambiente estão corretas

## ⚠️ Avisos Importantes

1. **NUNCA** commit as credenciais no GitHub
2. Use sempre variáveis de ambiente para dados sensíveis
3. Em produção, substitua as credenciais de teste pelas de produção
4. Configure webhooks corretamente para receber notificações de pagamento

## 📊 Monitoramento

Após configurar, monitore:
- Logs das funções Edge
- Dashboard do Mercado Pago
- Transações no modo sandbox
- Status dos pagamentos via API

## 🔗 Links Úteis

- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Dashboard Sandbox](https://www.mercadopago.com.br/developers/panel)
- [CLI Supabase](https://supabase.com/docs/reference/cli)

---

**Próximo passo**: Após testar em sandbox, configurar as credenciais de produção seguindo o mesmo processo, mas usando as chaves de produção do Mercado Pago.