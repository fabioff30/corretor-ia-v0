# Guia Completo de Integração - CorretorIA API

Este guia fornece exemplos práticos de como integrar com as APIs do CorretorIA, seguindo as especificações do `frontend-api.md`.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Configuração Inicial](#configuração-inicial)
3. [Endpoints Disponíveis](#endpoints-disponíveis)
4. [Exemplos de Integração](#exemplos-de-integração)
5. [Tratamento de Erros](#tratamento-de-erros)
6. [Retry e Fallback](#retry-e-fallback)
7. [Observabilidade](#observabilidade)

---

## Visão Geral

O CorretorIA implementa um **padrão BFF (Backend-For-Frontend)** onde todas as chamadas passam por rotas Next.js antes de chegarem ao Workers API:

```
Cliente (Browser)
    ↓ fetch()
Next.js /api/* (BFF Layer)
    ↓ Validação + Rate Limiting + Sanitização
Cloudflare Workers API
```

### Vantagens

- ✅ AUTH_TOKEN permanece server-side (segurança)
- ✅ Validação centralizada
- ✅ Rate limiting unificado
- ✅ Logs e observabilidade

---

## Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env.local`:

```bash
# Obrigatório
AUTH_TOKEN=your-secure-token-here

# Opcional (para recursos avançados)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 3. Constantes Importantes

```typescript
// utils/constants.ts
export const API_REQUEST_TIMEOUT = 60000 // 60s
export const FETCH_TIMEOUT = 55000 // 55s
export const FREE_CHARACTER_LIMIT = 1500
export const PREMIUM_CHARACTER_LIMIT = 5000
export const AI_DETECTOR_CHARACTER_LIMIT = 10000
```

---

## Endpoints Disponíveis

### Health Checks (GET)

Todos os endpoints suportam GET para monitoramento:

```typescript
// GET /api/correct
// GET /api/rewrite
// GET /api/ai-detector
{ "status": "OK" }
```

### POST Endpoints

| Endpoint | Descrição | Limite (free) | Limite (premium) |
|----------|-----------|---------------|------------------|
| `/api/correct` | Correção de texto | 1500 chars | 5000 chars |
| `/api/rewrite` | Reescrita de texto | 1500 chars | 5000 chars |
| `/api/ai-detector` | Detecção de IA | 10000 chars | Ilimitado |

---

## Exemplos de Integração

### 1. Correção de Texto

```typescript
// components/exemplo-correcao.tsx
import { useState } from 'react'
import { RetryButton } from '@/components/ui/retry-button'

export function ExemploCorrecao() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleCorrect = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(), // Sanitização automática no backend
          isMobile: false,
          isPremium: false, // ou true para usuários premium
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Formato: { error: string, message?: string, details?: string[] }
        throw new Error(data.error || 'Erro desconhecido')
      }

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    handleCorrect()
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite seu texto aqui..."
      />

      <button onClick={handleCorrect} disabled={isLoading}>
        {isLoading ? 'Corrigindo...' : 'Corrigir'}
      </button>

      {error && (
        <div className="error-alert">
          <p>{error}</p>
          <RetryButton onClick={handleRetry} isLoading={isLoading} />
        </div>
      )}

      {result && (
        <div>
          <h3>Texto Corrigido:</h3>
          <p>{result.correctedText}</p>

          <h4>Avaliação (Nota: {result.evaluation.score}/10)</h4>
          <ul>
            {result.evaluation.strengths.map((s, i) => (
              <li key={i}>✅ {s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### 2. Reescrita de Texto

```typescript
// components/exemplo-reescrita.tsx
async function reescreverTexto(text: string, style: string) {
  const response = await fetch('/api/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      style, // "formal" | "humanized" | "academic" | "creative" | "childlike"
      isMobile: false,
      isPremium: true,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Erro:', data.error)
    console.error('Detalhes:', data.details) // Array de strings
    throw new Error(data.error)
  }

  return {
    rewrittenText: data.rewrittenText,
    evaluation: data.evaluation,
    correctionId: data.correctionId, // ID para histórico (premium)
  }
}
```

### 3. Detecção de IA

```typescript
// components/exemplo-ai-detector.tsx
async function detectarIA(text: string) {
  const response = await fetch('/api/ai-detector', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      isPremium: false,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limit atingido
      console.log('Limite diário atingido')
      console.log('Resetará em:', data.resetAt)
      return null
    }
    throw new Error(data.error)
  }

  // Acessar metadata para auditoria
  console.log('Prompt Version:', response.headers.get('X-Prompt-Version'))
  console.log('Terms Version:', response.headers.get('X-Terms-Version'))

  return {
    verdict: data.result.verdict, // "ai" | "human" | "uncertain"
    probability: data.result.probability, // 0-1
    confidence: data.result.confidence, // "low" | "medium" | "high"
    signals: data.result.signals,
    brazilianism: data.brazilianism,
    grammarSummary: data.grammarSummary,
  }
}
```

---

## Tratamento de Erros

### Formato Padrão de Erro

```typescript
interface ErrorResponse {
  error: string           // Mensagem principal
  message?: string        // Descrição adicional
  details?: string[]      // Detalhes específicos
  code?: string          // Código de erro (opcional)
}
```

### Categorias de Erro

#### 1. Erros de Validação (400)

```typescript
{
  "error": "Texto muito grande",
  "message": "O texto não pode exceder 1500 caracteres",
  "details": [
    "Tamanho atual: 2000 caracteres",
    "Limite: 1500 caracteres",
    "Considere usar um plano Premium para textos maiores"
  ]
}
```

#### 2. Erros de Autenticação (401)

```typescript
{
  "error": "Não autorizado",
  "message": "Usuário não autenticado",
  "details": ["Faça login para usar recursos premium"]
}
```

#### 3. Erros de Rate Limit (429)

```typescript
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "details": [
    "Você atingiu o limite de 10 requisições por minuto",
    "Aguarde 60 segundos antes de tentar novamente",
    "Considere um plano Premium para limites maiores"
  ],
  "retryAfter": 60
}
```

#### 4. Erros de Timeout (504)

```typescript
{
  "error": "Tempo limite excedido",
  "message": "O servidor demorou muito para responder...",
  "details": [
    "O processamento excedeu o tempo limite de 60 segundos",
    "Tente reduzir o tamanho do texto ou tente novamente mais tarde"
  ],
  "code": "TIMEOUT_ERROR"
}
```

#### 5. Erros do Servidor (500)

```typescript
{
  "error": "Erro interno do servidor",
  "message": "Erro ao processar o texto...",
  "details": [
    "Verifique se o texto contém apenas caracteres válidos",
    "Tente reduzir o tamanho do texto",
    "Aguarde alguns minutos antes de tentar novamente"
  ],
  "code": "GENERAL_ERROR"
}
```

### Exemplo de Handler Universal

```typescript
async function callAPI<T>(
  url: string,
  data: unknown,
  options?: { retryable?: boolean }
): Promise<T> {
  const maxRetries = options?.retryable ? 3 : 1
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const payload = await response.json()

      if (!response.ok) {
        // Erros não retryable
        if ([400, 401, 403, 413, 429].includes(response.status)) {
          throw new Error(payload.error || 'Erro na requisição')
        }

        // Erros retryable (5xx)
        if (response.status >= 500 && attempt < maxRetries) {
          console.log(`Tentativa ${attempt}/${maxRetries} falhou. Retrying...`)
          await sleep(2000 * attempt) // Exponential backoff
          continue
        }

        throw new Error(payload.error || `Erro ${response.status}`)
      }

      return payload as T
    } catch (error) {
      lastError = error as Error
      if (attempt === maxRetries) break
    }
  }

  throw lastError || new Error('Falha após múltiplas tentativas')
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

---

## Retry e Fallback

### Client-Side Retry Component

```typescript
// components/ui/retry-button.tsx (já implementado)
import { RefreshCw } from "lucide-react"

<RetryButton
  onClick={handleRetry}
  isLoading={isLoading}
  size="sm"
  variant="outline"
/>
```

### Server-Side Retry (Automático)

O backend já implementa retry automático:

- **3 tentativas** no webhook primário
- **2 tentativas** no webhook fallback
- **Fallback automático em 401** (erro de auth)
- **Delay exponencial**: 2s, 4s, 8s

### Quando Fazer Retry?

| Cenário | Retry? | Motivo |
|---------|--------|--------|
| 400 (Bad Request) | ❌ | Erro de validação |
| 401 (Unauthorized) | ❌ | Problema de autenticação |
| 429 (Rate Limit) | ✅ (com delay) | Aguardar reset time |
| 500 (Server Error) | ✅ | Erro transitório |
| 502 (Bad Gateway) | ✅ | Problema de rede |
| 504 (Timeout) | ✅ | Texto muito longo ou servidor ocupado |

---

## Observabilidade

### Headers de Resposta

Todos os endpoints retornam headers úteis:

```typescript
const response = await fetch('/api/correct', { ... })

// Headers padrão
const requestId = response.headers.get('X-Request-ID')
const processingTime = response.headers.get('X-Processing-Time')
const apiVersion = response.headers.get('X-API-Version')

// Headers específicos de AI Detector
const promptVersion = response.headers.get('X-Prompt-Version')
const termsVersion = response.headers.get('X-Terms-Version')

// Cloudflare Ray ID (para suporte)
const cfRay = response.headers.get('CF-Ray')
```

### Logging Client-Side

```typescript
function logAPICall(
  endpoint: string,
  status: number,
  duration: number,
  requestId: string,
  cfRay?: string
) {
  console.log({
    endpoint,
    status,
    duration: `${duration}ms`,
    requestId,
    cfRay,
    timestamp: new Date().toISOString(),
  })

  // Integração com Sentry/Datadog (futura)
  // Sentry.captureMessage('API Call', { level: 'info', extra: { ... } })
}
```

### Exemplo de Uso

```typescript
const startTime = Date.now()

try {
  const response = await fetch('/api/correct', { ... })
  const data = await response.json()

  logAPICall(
    '/api/correct',
    response.status,
    Date.now() - startTime,
    response.headers.get('X-Request-ID'),
    response.headers.get('CF-Ray')
  )
} catch (error) {
  console.error('API Error:', error)
}
```

---

## Melhores Práticas

### 1. Sanitização de Input

```typescript
// Backend já faz isso automaticamente, mas é bom validar no frontend também
function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[ \t]+/g, ' ')      // Múltiplos espaços → 1 espaço
    .replace(/\n{3,}/g, '\n\n')   // 3+ newlines → 2 newlines
}
```

### 2. Loading States

```typescript
{isLoading && (
  <div className="flex items-center">
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    <span>Processando... (pode levar até 60s)</span>
  </div>
)}
```

### 3. Progressive Enhancement

```typescript
// Detectar suporte a features
const supportsAbortController = typeof AbortController !== 'undefined'

if (supportsAbortController) {
  const controller = new AbortController()

  setTimeout(() => controller.abort(), 60000)

  fetch('/api/correct', { signal: controller.signal })
}
```

### 4. Otimização de Performance

```typescript
// Debounce para evitar chamadas excessivas
import { useMemo } from 'react'
import debounce from 'lodash/debounce'

const debouncedAnalyze = useMemo(
  () => debounce(handleAnalyze, 1000),
  []
)
```

---

## Troubleshooting

### Problema: Timeout frequente

**Solução**:
- Reduzir tamanho do texto
- Verificar se timeout está configurado para 60s
- Considerar processar em chunks

### Problema: Rate limit atingido

**Solução**:
- Implementar exponential backoff
- Mostrar mensagem com reset time
- Sugerir upgrade para premium

### Problema: Erro de CORS

**Solução**:
- Usar Next.js API routes (BFF pattern)
- Configurar headers CORS no middleware
- Verificar domínio autorizado

---

## Links Úteis

- [Frontend API Spec](./frontend-api.md)
- [CLAUDE.md - Arquitetura](./CLAUDE.md)
- [SECURITY.md - Segurança](./SECURITY.md)
- [CONFIGURATION.md - Setup](./CONFIGURATION.md)

---

## Suporte

Para dúvidas ou problemas:
- **Email**: suporte@corretordetextoonline.com.br
- **GitHub Issues**: Reportar problemas técnicos
- **Documentation**: Consultar CLAUDE.md para arquitetura detalhada
