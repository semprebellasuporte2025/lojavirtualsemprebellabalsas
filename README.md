# 🛍️ SempreBella E-commerce

Sistema completo de e-commerce desenvolvido com React, TypeScript, Vite e Supabase.

## ✨ Funcionalidades

### 🛒 Loja Virtual
- Catálogo de produtos com categorias
- Sistema de carrinho de compras
- Checkout completo com integração de pagamento
- Cálculo de frete automático
- Sistema de favoritos
- Avaliações e comentários de produtos

### 👥 Área do Cliente
- Cadastro e login de usuários
- Perfil do cliente
- Histórico de pedidos
- Acompanhamento de entregas

### 🔧 Painel Administrativo
- Dashboard com métricas de vendas
- Gestão de produtos (CRUD completo)
- Gestão de categorias
- Gestão de usuários administrativos
- Relatórios de vendas
- Sistema de permissões

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Roteamento**: React Router DOM
- **Estado**: Context API + Hooks
- **Formulários**: React Hook Form
- **Validação**: Zod
- **Notificações**: React Hot Toast
- **Ícones**: Lucide React
- **PDF**: jsPDF
- **Deploy**: Vercel

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório
```bash
git clone https://github.com/seuusuario/semprebella-ecommerce.git
cd semprebella-ecommerce
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` e configure:

```env
VITE_PUBLIC_SUPABASE_URL=sua_url_do_supabase
VITE_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase
VITE_ORDER_WEBHOOK_URL=sua_url_do_webhook
```

### 4. Configure o banco de dados
Execute as migrações SQL no Supabase Dashboard:
```sql
-- Execute os arquivos em supabase/migrations/ na ordem
```

### 5. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3003`

## 🗂️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── base/           # Componentes base (Button, Input, etc.)
│   └── feature/        # Componentes específicos de funcionalidades
├── pages/              # Páginas da aplicação
│   ├── admin/          # Painel administrativo
│   ├── auth/           # Autenticação
│   ├── checkout/       # Processo de compra
│   └── ...
├── hooks/              # Custom hooks
├── lib/                # Configurações e utilitários
├── contexts/           # Context providers
└── utils/              # Funções utilitárias
```

## 🔐 Funcionalidades de Segurança

- Autenticação JWT via Supabase Auth
- Row Level Security (RLS) no banco de dados
- Validação de dados no frontend e backend
- Sanitização de inputs
- Proteção contra XSS e CSRF

## 📱 Responsividade

O sistema é totalmente responsivo e otimizado para:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push na branch main

### Outras plataformas
O projeto é compatível com qualquer plataforma que suporte aplicações React/Vite.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@semprebella.com

---

**🚀 Deploy Automático Ativo** - Última atualização: 22/01/2025

Desenvolvido com ❤️ para SempreBella