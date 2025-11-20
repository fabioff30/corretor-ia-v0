# 🚀 Setup do CorretorIA Pro

Este guia mostra como configurar o sistema completo de planos premium.

## 📋 Requisitos

- Node.js 18+
- Conta no Supabase
- Conta no MercadoPago (opcional para desenvolvimento)

## 🔧 Configuração Rápida

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em `Settings` > `API` e copie:
   - `Project URL`
   - `anon/public key`
   - `service_role key` (opcional)

### 3. Configurar Variáveis de Ambiente

Renomeie `.env.local` e configure com seus dados:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Premium Plan Configuration  
PREMIUM_PLAN_PRICE=19.90
PREMIUM_CHARACTER_LIMIT=10000
```

### 4. Criar Tabelas no Supabase

1. Acesse o painel do Supabase
2. Vá em `SQL Editor`
3. Execute o conteúdo do arquivo `supabase/schema.sql`

### 5. Executar Aplicação

```bash
pnpm dev
```

## 🔍 Verificação

- ✅ Aplicação roda sem erros
- ✅ Sistema de login/registro funciona
- ✅ Dashboard carrega para usuários logados
- ✅ Página de upgrade disponível
- ✅ Anúncios são ocultados para usuários premium (simulado)

## 🎯 Funcionalidades

### Com Supabase Configurado
- ✅ Login/Registro de usuários
- ✅ Dashboard personalizado
- ✅ Sistema de assinaturas
- ✅ Limite de 10.000 caracteres para premium
- ✅ Remoção automática de anúncios

### Modo Desenvolvimento (sem Supabase)
- ✅ Formulário de correção funciona normalmente
- ✅ Limite padrão de 1.500 caracteres
- ✅ Anúncios exibidos normalmente
- ⚠️ Aviso de "Modo de desenvolvimento" exibido

## 🚀 Deploy em Produção

### 1. Deploy do Frontend (Vercel)
```bash
vercel --prod
```

### 2. Configurar Webhook do MercadoPago
- URL: `https://seu-dominio.com/api/webhooks/mercadopago-subscription`
- Eventos: `payment`, `subscription_preapproval`

### 3. Testar Fluxo Completo
1. Criar conta
2. Fazer upgrade para premium
3. Testar limite de 10.000 caracteres
4. Verificar ausência de anúncios

## 📝 Estrutura do Projeto

```
├── lib/supabase.ts                 # Cliente Supabase
├── contexts/auth-context.tsx       # Context de autenticação
├── hooks/use-subscription.ts       # Hook de assinatura
├── components/auth/               # Componentes de autenticação
├── app/api/subscriptions/         # APIs de assinatura
├── app/api/webhooks/              # Webhooks MercadoPago
├── supabase/schema.sql            # Schema do banco
└── .env.local                     # Variáveis de ambiente
```

## 🐛 Troubleshooting

### Erro: "supabaseUrl is required"
- Verifique se `.env.local` existe e está configurado
- Reinicie o servidor de desenvolvimento

### Erro: "Invalid JWT"
- Verifique se as chaves do Supabase estão corretas
- Confirme se o projeto Supabase está ativo

### Webhook não funciona
- Verifique se `MERCADO_PAGO_ACCESS_TOKEN` está configurado
- Confirme a URL do webhook no painel do MercadoPago

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do MercadoPago](https://www.mercadopago.com.br/developers)
- Arquivo `CLAUDE.md` com detalhes técnicos