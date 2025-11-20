# 📧 Sistema de Debug de Emails

Guia completo para testar o envio de emails no CorretorIA.

## 📋 Visão Geral

O sistema de debug de emails permite que administradores testem o envio de emails antes de disponibilizá-los para usuários reais. Os emails são enviados através do **Brevo** (anteriormente SendinBlue) usando as configurações de produção.

## 🔧 Configuração Necessária

### Variáveis de Ambiente

Certifique-se de que as seguintes variáveis estão configuradas no `.env.local`:

```bash
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_EMAIL=contato@corretordetextoonline.com.br
BREVO_SENDER_NAME=CorretorIA  # Opcional, padrão: "CorretorIA"
```

### Como Obter a API Key do Brevo

1. Acesse [app.brevo.com](https://app.brevo.com)
2. Faça login na conta do CorretorIA
3. Vá em **Settings** → **SMTP & API** → **API Keys**
4. Crie uma nova API key ou copie a existente
5. Cole a key no arquivo `.env.local`

## 🎯 Como Usar

### 1. Acesso ao Debug de Emails

Há duas formas de acessar o debug de emails:

#### Opção A: Via Dashboard Admin
1. Faça login com uma conta **admin**
2. Acesse o [Dashboard Admin](/admin/dashboard)
3. Clique no botão **"Debug Emails"** no topo da página

#### Opção B: Acesso Direto
1. Navegue para: `https://www.corretordetextoonline.com.br/admin/debug/emails`
2. Você será redirecionado se não for admin

### 2. Enviar Email de Teste

1. **Selecione um Template**:
   - Boas-vindas
   - Upgrade Premium
   - Cancelamento
   - Recuperação de Senha

2. **Preencha os Campos**:
   - **Email do Destinatário** (obrigatório): Email real para onde será enviado
   - **Nome do Destinatário** (opcional): Nome que aparecerá no email
   - **Link de Recuperação** (obrigatório apenas para "Recuperação de Senha")

3. **Clique em "Enviar Email de Teste"**

4. **Verifique o Resultado**:
   - ✅ **Sucesso**: Mensagem verde aparecerá confirmando o envio
   - ❌ **Erro**: Mensagem vermelha com detalhes do erro

### 3. Verificar Email Recebido

1. Acesse a caixa de entrada do email de teste
2. Verifique se o email chegou (pode demorar alguns segundos)
3. Confirme que o layout e conteúdo estão corretos
4. Teste todos os links presentes no email

## 📨 Templates Disponíveis

### 1. Boas-vindas (`welcome`)
**Quando é enviado:** Quando um novo usuário cria sua conta

**Campos necessários:**
- `to`: Email do destinatário
- `name`: Nome do usuário (opcional)

**Conteúdo:**
- Mensagem de boas-vindas
- Descrição dos recursos disponíveis
- Convite para conhecer o plano Premium

**Exemplo de uso:**
```json
{
  "template": "welcome",
  "to": "teste@exemplo.com",
  "name": "João Silva"
}
```

---

### 2. Upgrade Premium (`premium-upgrade`)
**Quando é enviado:** Quando um usuário ativa o plano Premium

**Campos necessários:**
- `to`: Email do destinatário
- `name`: Nome do usuário (opcional)

**Conteúdo:**
- Confirmação da assinatura Premium
- Lista de benefícios disponíveis
- Link para acessar o dashboard
- Informações de contato

**Exemplo de uso:**
```json
{
  "template": "premium-upgrade",
  "to": "teste@exemplo.com",
  "name": "Maria Santos"
}
```

---

### 3. Cancelamento (`cancellation`)
**Quando é enviado:** Quando um usuário cancela a assinatura Premium

**Campos necessários:**
- `to`: Email do destinatário
- `name`: Nome do usuário (opcional)

**Conteúdo:**
- Confirmação do cancelamento
- Informação sobre período de acesso restante
- Convite para feedback
- Possibilidade de retorno

**Exemplo de uso:**
```json
{
  "template": "cancellation",
  "to": "teste@exemplo.com",
  "name": "Pedro Costa"
}
```

---

### 4. Recuperação de Senha (`password-reset`)
**Quando é enviado:** Quando um usuário solicita recuperação de senha

**Campos necessários:**
- `to`: Email do destinatário
- `name`: Nome do usuário (opcional)
- `resetLink`: Link completo de recuperação (obrigatório)

**Conteúdo:**
- Informação sobre solicitação de recuperação
- Botão/link para redefinir senha
- Informação sobre validade do link (60 minutos)
- Instrução para ignorar se não foi solicitado

**Exemplo de uso:**
```json
{
  "template": "password-reset",
  "to": "teste@exemplo.com",
  "name": "Ana Lima",
  "resetLink": "https://www.corretordetextoonline.com.br/resetar-senha?token=abc123xyz"
}
```

## 🔌 API Endpoints

### GET `/api/admin/debug/send-test-email`

Lista todos os templates disponíveis.

**Autenticação:** Requer login como admin

**Resposta de Sucesso:**
```json
{
  "templates": [
    {
      "id": "welcome",
      "name": "Boas-vindas",
      "description": "Email enviado quando um novo usuário cria sua conta",
      "requiredFields": ["to", "name"]
    },
    // ... outros templates
  ]
}
```

---

### POST `/api/admin/debug/send-test-email`

Envia um email de teste.

**Autenticação:** Requer login como admin

**Body:**
```json
{
  "template": "welcome",
  "to": "teste@exemplo.com",
  "name": "Usuário Teste",
  "resetLink": "https://..." // Apenas para password-reset
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Email de boas-vindas enviado",
  "details": {
    "template": "welcome",
    "to": "teste@exemplo.com",
    "name": "Usuário Teste",
    "timestamp": "2025-10-27T20:00:00.000Z"
  }
}
```

**Resposta de Erro:**
```json
{
  "error": "Template inválido",
  "details": "..."
}
```

## 🐛 Solução de Problemas

### Erro: "Brevo API key não configurada"

**Causa:** A variável `BREVO_API_KEY` não está configurada ou está vazia.

**Solução:**
1. Verifique se o arquivo `.env.local` existe
2. Certifique-se de que `BREVO_API_KEY` está configurado
3. Reinicie o servidor de desenvolvimento: `pnpm dev`

---

### Erro: "Brevo sender email não configurado"

**Causa:** A variável `BREVO_SENDER_EMAIL` não está configurada.

**Solução:**
1. Adicione `BREVO_SENDER_EMAIL=contato@corretordetextoonline.com.br` no `.env.local`
2. Certifique-se de que o email está verificado no Brevo
3. Reinicie o servidor

---

### Erro: "Falha ao enviar email via Brevo"

**Causas possíveis:**
1. API key inválida ou expirada
2. Email remetente não verificado
3. Limite de envio atingido
4. Problema de conectividade

**Solução:**
1. Verifique os logs do console para detalhes do erro
2. Confirme que a API key está correta
3. Verifique o painel do Brevo para limites e status
4. Tente novamente após alguns minutos

---

### Email não chegou

**Verificações:**
1. Confira a caixa de spam/lixo eletrônico
2. Verifique se o endereço de email está correto
3. Consulte os logs do Brevo para status de entrega
4. Aguarde alguns minutos (pode haver delay)

---

### Erro: "Acesso negado. Apenas administradores."

**Causa:** Usuário não tem permissão de admin.

**Solução:**
1. Faça login com uma conta admin
2. Ou atualize o `plan_type` do usuário no banco:
```sql
UPDATE profiles
SET plan_type = 'admin'
WHERE id = 'user-uuid-here';
```

## 📂 Estrutura de Arquivos

```
CorretorIA Stage/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── debug/
│   │           └── send-test-email/
│   │               └── route.ts          # Endpoint de debug
│   └── admin/
│       └── debug/
│           └── emails/
│               └── page.tsx              # Página de UI para teste
├── lib/
│   └── email/
│       ├── brevo.ts                      # Cliente Brevo
│       ├── send.ts                       # Funções de envio
│       └── templates.ts                  # Templates de email
└── emails/
    └── donation-receipt.tsx              # Template React Email
```

## 🔐 Segurança

### Restrições de Acesso
- Apenas usuários com `plan_type = 'admin'` podem acessar
- Todos os endpoints verificam autenticação via Supabase
- Logs de auditoria registram todos os envios de teste

### Boas Práticas
- Use emails de teste reais (não remetentes fake)
- Não teste com emails de clientes reais sem permissão
- Mantenha a API key do Brevo privada e segura
- Revise os templates antes de enviar em produção

## 📊 Logs e Monitoramento

### Logs do Console
Todos os envios de teste são registrados no console:

```
[Email Debug] Email enviado com sucesso: {
  template: 'welcome',
  to: 'teste@exemplo.com',
  name: 'Usuário Teste',
  timestamp: '2025-10-27T20:00:00.000Z'
}
```

### Painel do Brevo
Acesse [app.brevo.com](https://app.brevo.com) para:
- Ver histórico completo de emails enviados
- Verificar taxas de entrega e abertura
- Consultar bounces e reclamações de spam
- Monitorar limites de envio

## 🚀 Próximos Passos

Após testar os emails:

1. **Validar Conteúdo**: Revise textos, links e formatação
2. **Testar Responsividade**: Abra em diferentes dispositivos e clientes de email
3. **Verificar Spam Score**: Use ferramentas como [Mail Tester](https://www.mail-tester.com/)
4. **Integrar no Fluxo**: Use as funções de `lib/email/send.ts` no código da aplicação
5. **Monitorar em Produção**: Acompanhe métricas no Brevo após deploy

## 📝 Notas Adicionais

- Os emails usam HTML inline styles para compatibilidade
- Templates seguem o padrão visual do CorretorIA
- Sistema suporta texto plano como fallback
- Todos os emails incluem link de contato
- Footer com copyright é adicionado automaticamente

## 🤝 Suporte

Se encontrar problemas:

1. Verifique este guia e a seção de troubleshooting
2. Consulte os logs do console e do Brevo
3. Entre em contato com o time de desenvolvimento
4. Abra um issue no repositório (se aplicável)

---

**Última atualização:** 2025-10-27
**Versão:** 1.0.0
