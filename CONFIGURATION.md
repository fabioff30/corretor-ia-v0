# Guia de Configuração - CorretorIA

## ✅ Configuração Básica Concluída

As variáveis de ambiente foram configuradas automaticamente com tokens seguros gerados criptograficamente.

### 📁 Arquivos Criados:
- `.env.local` - Configurações de desenvolvimento (gerado automaticamente)
- `.env.example` - Exemplo para novos ambientes
- `CONFIGURATION.md` - Este guia

## 🔐 Tokens de Segurança Gerados

Os seguintes tokens seguros foram gerados e salvos em `.env.local`:

```env
AUTH_TOKEN=b3bf267556c5144331481f721cf1b825fc08bf51277f54d7a734cce4c05a51b7
REVALIDATION_TOKEN=00b3a3e8bcca6745f52ec95e9e81409703d2a889c09e5ddec079b7ac29aa8394
WEBHOOK_SECRET=418280ae4e0f7f88ae424ff527236ba41aa73dd8af4361ad4f3d38c62319f9db
ADMIN_API_KEY=af1d8c2fa92748238ca357d901da28348dd83b41eb8d64edbe8219c34903a906
```

## 🚀 Próximos Passos

### 1. Desenvolvimento Local
Sua aplicação já está pronta para desenvolvimento. Execute:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

### 2. Configurações Opcionais

Para funcionalidades completas, configure as seguintes variáveis em `.env.local`:

#### 🤖 OpenAI (para correção de texto)
```env
OPENAI_API_KEY=sk-sua-chave-aqui
```

#### 💳 MercadoPago (para pagamentos)
```env
MERCADO_PAGO_ACCESS_TOKEN=seu-access-token
MERCADO_PAGO_PUBLIC_KEY=sua-public-key
```

#### ⚡ Redis/Upstash (para rate limiting em produção)
```env
UPSTASH_REDIS_REST_URL=https://sua-instancia.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-redis
```

### 3. Produção

Para produção, use as mesmas variáveis mas altere:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
```

⚠️ **IMPORTANTE**: Remova ou altere `NEXT_PUBLIC_ADMIN_PASSWORD` em produção!

## 🛡️ Verificação de Segurança

O sistema irá automaticamente:
- ✅ Validar tokens na inicialização
- ✅ Bloquear tokens inseguros em produção
- ✅ Aplicar rate limiting
- ✅ Sanitizar logs
- ✅ Implementar CSP headers

## 🔧 Comandos Úteis

### Gerar novos tokens (se necessário):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Testar configuração:
```bash
npm run build
npm run start
```

### Verificar logs de segurança:
```bash
# Procurar por eventos de segurança nos logs
grep "Security Event" logs/
```

## 🚨 Troubleshooting

### Erro: "Environment validation failed"
- Verifique se o `.env.local` existe
- Confirme que os tokens têm pelo menos 32 caracteres
- Não use tokens com "default" ou "change-this"

### Erro: Rate limiting não funciona
- Configure Redis/Upstash para produção
- Em desenvolvimento, funciona em memória

### Erro: Autenticação admin
- Use a senha: `admin123` em desenvolvimento
- Acesse `/admin` para testar

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console
2. Confirme se todas as variáveis estão definidas
3. Teste com `npm run build` antes de fazer deploy

---

**Configuração concluída com sucesso!** 🎉

Sua aplicação agora possui:
- Tokens de segurança únicos e seguros
- Validação automática de ambiente
- Sistema de autenticação JWT
- Rate limiting robusto
- Sanitização de HTML
- Content Security Policy
- Logs seguros com redação de dados sensíveis

Tudo configurado e pronto para uso!