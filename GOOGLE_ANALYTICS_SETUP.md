# Google Analytics 4 - Guia de Configuração

Este documento descreve como configurar e usar o Google Analytics 4 no projeto CorretorIA.

## 📋 Visão Geral

A integração do Google Analytics 4 foi implementada seguindo as melhores práticas de 2025:

- ✅ Usa o pacote oficial `@next/third-parties/google` do Next.js
- ✅ Respeita o consentimento de cookies do usuário (LGPD/GDPR)
- ✅ Carregamento otimizado com cache de credenciais
- ✅ Suporte a eventos customizados
- ✅ Credenciais armazenadas de forma segura no Vercel Blob

## 🚀 Configuração Inicial

### 1. Obter o ID do Google Analytics

1. Acesse o [Google Analytics](https://analytics.google.com/)
2. Crie uma propriedade GA4 (se ainda não tiver)
3. Copie o ID da medição (formato: `G-XXXXXXXXXX`)

### 2. Obter o ID da Propriedade (Property ID)

Além do ID de medição (G-XXXXXXXXXX), você precisa do ID numérico da propriedade:

1. No Google Analytics, clique em **Admin** (engrenagem no canto inferior esquerdo)
2. Em **Property**, clique em **Property Settings**
3. Copie o **Property ID** (número, ex: 123456789)

### 3. Configurar Variáveis de Ambiente

No arquivo `.env.local`, substitua os placeholders:

```bash
# Google Analytics Configuration
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-ZR7B5DMLER  # Substitua com seu ID do Google Analytics
GA4_PROPERTY_ID=123456789  # ID numérico da propriedade (para Data API)

# Google Cloud Credentials (Vercel Blob)
GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=  # Será preenchido após upload
```

### 3. Fazer Upload das Credenciais para o Vercel Blob

As credenciais do Google Cloud Service Account são armazenadas de forma segura no Vercel Blob Storage.

#### Pré-requisitos

1. Certifique-se de ter configurado o Vercel Blob no projeto:
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Vá em **Storage** → **Create Database** → **Blob**
   - Copie o `BLOB_READ_WRITE_TOKEN` para o `.env.local`

2. Adicione a variável ao `.env.local`:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXX
```

#### Método 1: Upload via Vercel CLI (Recomendado)

**Vantagens:**
- Mais simples e direto
- Não requer configuração de token manualmente
- Integrado ao fluxo de trabalho da Vercel

**Passos:**

1. Instale a Vercel CLI (se ainda não tiver):
   ```bash
   npm install -g vercel
   ```

2. Faça login:
   ```bash
   vercel login
   ```

3. Execute o script de upload:
   ```bash
   ./scripts/upload-google-credentials.sh
   ```

4. Copie a URL retornada e adicione ao `.env.local`:
   ```bash
   GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=https://blob.vercel-storage.com/...
   ```

#### Método 2: Upload Programático

Se preferir usar o script TypeScript:

```bash
pnpm tsx scripts/upload-google-credentials.ts
```

O script irá:
1. Ler o arquivo `utils/corretor-de-texto-454602-fc315fd1360a.json`
2. Validar o JSON
3. Fazer upload para o Vercel Blob com acesso privado
4. Retornar a URL do blob

#### Atualizar Variável de Ambiente

Copie a URL retornada pelo script e adicione ao `.env.local`:

```bash
GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=https://blob.vercel-storage.com/google-credentials.json
```

### 4. Configurar no Vercel (Produção)

No dashboard do Vercel, adicione as variáveis de ambiente:

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione:
   - `NEXT_PUBLIC_GOOGLE_ANALYTICS` = seu ID do GA4
   - `GA4_PROPERTY_ID` = ID numérico da propriedade
   - `GOOGLE_CLOUD_CREDENTIALS_BLOB_URL` = URL do blob
   - `BLOB_READ_WRITE_TOKEN` = seu token do Vercel Blob

## 📊 Como Funciona

### Componente GoogleAnalyticsWrapper

O componente `GoogleAnalyticsWrapper` gerencia o carregamento do Google Analytics:

```tsx
import { GoogleAnalyticsWrapper } from '@/components/google-analytics-wrapper'

// No layout.tsx
<GoogleAnalyticsWrapper />
```

**Características:**
- ✅ Só carrega se o usuário aceitou cookies
- ✅ Respeita a escolha de consentimento em tempo real
- ✅ Não carrega em desenvolvimento se o ID for o placeholder
- ✅ Usa o componente oficial `GoogleAnalytics` do `@next/third-parties`

### Sistema de Consentimento

O componente `CookieConsent` foi atualizado para disparar eventos customizados:

```javascript
// Quando o usuário aceita cookies
window.dispatchEvent(new CustomEvent("cookie-consent-changed", {
  detail: { consent: "accepted" }
}))

// Quando o usuário recusa cookies
window.dispatchEvent(new CustomEvent("cookie-consent-changed", {
  detail: { consent: "declined" }
}))
```

O `GoogleAnalyticsWrapper` escuta esses eventos e carrega/descarrega o GA4 dinamicamente.

## 🎯 Enviando Eventos Customizados

Use o hook `useGoogleAnalytics` para enviar eventos personalizados:

```tsx
import { useGoogleAnalytics } from '@/components/google-analytics-wrapper'

function MyComponent() {
  const sendGAEvent = useGoogleAnalytics()

  const handleClick = () => {
    sendGAEvent('button_click', {
      category: 'engagement',
      label: 'premium_upgrade',
      value: 1
    })
  }

  return <button onClick={handleClick}>Upgrade</button>
}
```

### Eventos Recomendados

```tsx
// Correção de texto
sendGAEvent('text_correction', {
  category: 'feature_usage',
  character_count: text.length,
  user_plan: 'free' // ou 'pro'
})

// Upgrade para Premium
sendGAEvent('premium_conversion', {
  category: 'conversion',
  plan: 'monthly',
  value: 29.90
})

// Compartilhamento
sendGAEvent('share', {
  method: 'whatsapp',
  content_type: 'correction_result'
})
```

## 🔧 Gerenciamento de Credenciais

### Buscar Credenciais (Server-Side)

```typescript
import { getGoogleCredentials } from '@/lib/google-analytics/credentials'

// Em uma API route ou Server Component
const credentials = await getGoogleCredentials()
```

**Recursos:**
- ✅ Cache automático em memória para reduzir requisições
- ✅ Validação de estrutura das credenciais
- ✅ Tratamento de erros com mensagens descritivas

### Limpar Cache (Testes)

```typescript
import { clearCredentialsCache } from '@/lib/google-analytics/credentials'

// Útil em testes ou ao atualizar credenciais
clearCredentialsCache()
```

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- `components/google-analytics-wrapper.tsx` - Componente wrapper do GA4
- `lib/google-analytics/credentials.ts` - Gerenciamento de credenciais
- `scripts/upload-google-credentials.ts` - Script de upload para Vercel Blob
- `GOOGLE_ANALYTICS_SETUP.md` - Esta documentação

### Arquivos Modificados
- `app/layout.tsx` - Adicionado GoogleAnalyticsWrapper
- `components/cookie-consent.tsx` - Eventos customizados de consentimento
- `.gitignore` - Ignorar arquivos de credenciais
- `.env.local` - Novas variáveis de ambiente

## 🔒 Segurança

### Arquivo de Credenciais

O arquivo `utils/corretor-de-texto-454602-fc315fd1360a.json` contém informações sensíveis:

- ❌ **NUNCA** commitar no Git
- ✅ Adicionado ao `.gitignore`
- ✅ Armazenado com acesso privado no Vercel Blob
- ✅ Acessível apenas via URL autenticada

### Boas Práticas

1. **Desenvolvimento Local**
   - Use `.env.local` para credenciais locais
   - Nunca commite `.env.local`

2. **Produção**
   - Configure variáveis de ambiente no Vercel Dashboard
   - Use Vercel Blob para arquivos sensíveis
   - Ative autenticação no Blob (access: 'private')

3. **Rotação de Credenciais**
   - Periodicamente, gere novas credenciais no Google Cloud
   - Execute o script de upload novamente
   - Atualize a URL no ambiente de produção

## 🧪 Testando

### Verificar se o GA4 está Carregando

1. Abra o DevTools (F12)
2. Vá para a aba **Network**
3. Filtre por `google-analytics` ou `gtag`
4. Aceite os cookies no banner
5. Você deve ver requisições para `www.google-analytics.com`

### Verificar Eventos

1. Instale a extensão [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/)
2. Ative a extensão
3. Abra o Console do navegador
4. Execute ações no site
5. Veja os eventos sendo enviados no console

### Verificar no Google Analytics

1. Acesse [Google Analytics](https://analytics.google.com/)
2. Vá em **Realtime** → **Events**
3. Execute ações no site
4. Veja os eventos aparecendo em tempo real

## 🐛 Troubleshooting

### GA4 não está carregando

**Possíveis causas:**

1. **Consentimento não foi dado**
   - Verifique se você aceitou os cookies
   - Limpe o localStorage e tente novamente

2. **ID do GA4 inválido**
   - Verifique se `NEXT_PUBLIC_GOOGLE_ANALYTICS` está correto
   - Não deve ser `G-XXXXXXXXXX` (placeholder)

3. **Bloqueador de anúncios**
   - Desative extensões de bloqueio de rastreamento
   - Teste em uma janela anônima

### Credenciais não encontradas

**Erro:** `GOOGLE_CLOUD_CREDENTIALS_BLOB_URL não está configurada`

**Solução:**
1. Execute o script de upload: `pnpm tsx scripts/upload-google-credentials.ts`
2. Copie a URL retornada
3. Adicione ao `.env.local` e às variáveis do Vercel

### Eventos não aparecem no GA4

**Possíveis causas:**

1. **Atraso no processamento**
   - O GA4 pode levar alguns minutos para processar eventos
   - Verifique em **Realtime** primeiro

2. **Configuração de propriedade**
   - Certifique-se de estar vendo a propriedade correta no GA4
   - Verifique se o ID corresponde ao configurado

## 📈 Google Analytics Data API - Buscar Métricas

Além do rastreamento de eventos, o projeto também **busca dados do Google Analytics** para exibir métricas em tempo real.

### Como Funciona

A integração com o **Google Analytics Data API** permite buscar a contagem de eventos diretamente do GA4 e exibi-los na aplicação.

#### Arquitetura

```
/oferta-especial
    ↓
SocialProofStats Component
    ↓
/api/social-proof
    ↓
getMonthlyCorrectionsCount()
    ↓
Google Analytics Data API
    ↓
Retorna: contagem de eventos "text_corrected" no mês
```

### Evento Rastreado

O sistema busca especificamente o evento **`text_corrected`**, que é disparado sempre que um usuário corrige um texto na aplicação.

### API Endpoint

**GET** `/api/analytics/monthly-corrections`

Retorna a contagem de correções do mês atual:

```json
{
  "count": 15234,
  "period": "current_month",
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

### Integração na Página /oferta-especial

A página `/oferta-especial` usa o componente `SocialProofStats` que:

1. Busca dados da API `/api/social-proof`
2. A API tenta buscar do **Google Analytics primeiro** (usando `getMonthlyCorrectionsCount`)
3. Se o GA4 falhar ou não estiver configurado, faz **fallback para o Supabase**
4. Exibe o número de correções com atualização em tempo real

**Benefícios:**
- ✅ Dados mais precisos do Google Analytics
- ✅ Fallback automático para Supabase
- ✅ Cache de 30 minutos para otimizar performance
- ✅ Prova social dinâmica na página de ofertas

### Configuração do Evento text_corrected

Para que os dados apareçam, você precisa garantir que o evento `text_corrected` está sendo enviado ao GA4.

Adicione este código ao componente de correção de texto:

```tsx
import { useGoogleAnalytics } from '@/components/google-analytics-wrapper'

function TextCorrectionForm() {
  const sendGAEvent = useGoogleAnalytics()

  const handleCorrection = async () => {
    // ... lógica de correção

    // Enviar evento ao GA4
    sendGAEvent('text_corrected', {
      category: 'text_processing',
      user_plan: userPlan, // 'free' ou 'pro'
      character_count: text.length
    })
  }
}
```

### Logs e Debugging

O sistema registra logs úteis para debugging:

```
✅ Using Google Analytics data: 15234 corrections this month
⚠️ Google Analytics unavailable, falling back to Supabase
```

Verifique os logs no Vercel Dashboard para confirmar se os dados estão sendo buscados corretamente.

## 📚 Recursos Adicionais

- [Documentação oficial do Google Analytics 4](https://developers.google.com/analytics/devguides/collection/ga4)
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Next.js Third Parties - Google Analytics](https://nextjs.org/docs/app/guides/third-party-libraries)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Vercel CLI - Blob Commands](https://vercel.com/docs/cli/blob)
- [GDPR e Analytics](https://support.google.com/analytics/answer/9019185)

## 🎓 Próximos Passos

Após a configuração básica, considere:

1. **Configurar conversões** no Google Analytics
2. **Criar dashboards personalizados** para métricas específicas
3. **Integrar com Google Ads** para remarketing
4. **Configurar alertas** para eventos importantes
5. **Implementar Enhanced Ecommerce** para rastreamento de vendas
