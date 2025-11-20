# Guia de Endpoints da API CorretorIA

Este documento detalha todos os endpoints da API, seus parâmetros, limites, autenticação e fluxos de processamento.

---

## 📋 Índice

1. [Arquitetura Geral](#arquitetura-geral)
2. [Cloudflare Workers API (Backend)](#cloudflare-workers-api-backend)
3. [Endpoint: Correção de Texto](#1-correção-de-texto)
4. [Endpoint: Reescrita de Texto](#2-reescrita-de-texto)
5. [Endpoint: Detecção de IA](#3-detecção-de-ia)
6. [Endpoint: Ajuste de Tom](#4-ajuste-de-tom)
7. [Módulos Compartilhados (Next.js)](#módulos-compartilhados)
8. [Fluxo de Requisição Completo](#fluxo-de-requisição-completo)
9. [Considerações para Nova Arquitetura](#considerações-para-nova-arquitetura)

---

## Arquitetura Geral

### Pattern BFF (Backend-For-Frontend)

```
Cliente (Browser)
    ↓ fetch()
Next.js API Routes (/api/*)
    ↓ Validação + Rate Limiting + Sanitização
    ↓ callWebhook() com AUTH_TOKEN
Cloudflare Workers API
    ↓ Processamento IA
Resposta para Cliente
```

### Workers API Base URL
```
https://workers-api.fabiofariasf.workers.dev
```

### Características Comuns

Todos os endpoints compartilham:

1. **Rate Limiting**: Redis-backed com fallback in-memory
2. **Input Validation**: Zod schemas + sanitização de texto
3. **Timeout Handling**: Timeouts diferenciados por tipo de endpoint
4. **Error Handling**: Fallback automático em caso de erro
5. **Request ID**: UUID único para tracking
6. **CF-Ray Forwarding**: Para correlação de suporte

### Formato de Erro Padrão

Todos os endpoints retornam erros no formato:

```json
{
  "error": "Título do erro",
  "message": "Descrição detalhada",
  "details": ["Detalhe 1", "Detalhe 2"]
}
```

### Headers de Response Padrão

```
X-API-Version: 2.0
X-Service: CorretorIA-[Correction|Rewrite|AI-Detector]
X-Request-ID: <uuid>
X-Processing-Time: <ms>
CF-Ray: <cloudflare-ray-id> (quando disponível)
Cache-Control: no-store
```

---

## Cloudflare Workers API (Backend)

Esta seção detalha o funcionamento interno do Cloudflare Worker que processa todas as requisições de IA.

**Arquivo**: `src/index.ts` (Worker repository)
**Base URL**: `https://workers-api.fabiofariasf.workers.dev`

### 2.1 Autenticação e CORS

#### AUTH_TOKEN (Binding)

Todas as rotas POST exigem `authToken` no corpo da requisição igual ao binding `AUTH_TOKEN` configurado no Worker.

**Validação**:
```typescript
// Retorna 401 imediatamente se token não bater
if (payload.authToken !== env.AUTH_TOKEN) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401
  })
}
```

**Localização**: `src/index.ts:124-149, :1382-1392, :2463, :2654-2660, :3243`

#### CORS

- **Métodos**: POST, OPTIONS
- **Origin permitida**: `corretordetextoonline.com.br`
- **Health Checks**: GET em `/api/corrigir` e `/api/analysis-ai` retorna `{"status":"OK"}`
  - Útil para monitoramento/load balancer
  - Não requer autenticação

**Código de referência**: `src/index.ts:124-149, :1382-1392, :2463, :2654-2660, :3243`

### 2.2 Modelos de IA e Providers

#### Providers Suportados

| Provider | API Key Binding | Modelos |
|----------|----------------|---------|
| **Google Gemini** | `GEMINI_API_KEY` | gemini-2.0-flash, gemini-2.5-pro, gemini-flash-lite |
| **OpenRouter** | `OPENROUTER_API_KEY` | gpt-4o-mini, gpt-4.1 |

#### Modelos por Endpoint

| Endpoint | Plano | Modelo | Características |
|----------|-------|--------|-----------------|
| `/api/corrigir` | Free | `gemini-2.0-flash` | Correção padrão |
| `/api/premium-corrigir` | Premium | `gemini-2.5-pro` | Thinking habilitado, mais insights |
| `/api/premium-corrigir-long` | Premium | `gpt-4.1` (OpenRouter) | Textos longos (chunks) |
| `/api/reescrever` | Free | `gemini-flash-lite` | Reescrita básica |
| `/api/premium-reescrever` | Premium | `gemini-flash-latest` | Thinking seletivo por estilo |
| `/api/analysis-ai` | Todos | `gpt-4o-mini` (OpenRouter) | Detecção de IA |
| Grammar Agent | - | `OPENROUTER_GRAMMAR_MODEL` | Análise gramatical (análise IA) |

**Código de referência**: `src/index.ts:19-69`

#### Configuração de Modelos

```typescript
// Limites padrão (src/index.ts:19-69)
const FREE_MAX_TEXT_LENGTH = 1500        // Reescrita free
const PREMIUM_MAX_TEXT_LENGTH = 20000    // Premium rewrite e análise
const ANALYSIS_MAX_TEXT_LENGTH = 20000   // AI detector
const DEFAULT_CHUNK_SIZE = 8000          // Chunking para textos longos
const DEFAULT_TIMEOUT_MS = 120000        // 120s timeout padrão

// OpenRouter específico
const OPENROUTER_TIMEOUT_MS = env.OPENROUTER_TIMEOUT_MS || 120000
const OPENROUTER_MAX_TOKENS = env.OPENROUTER_MAX_TOKENS || 4096
```

### 2.3 Schemas JSON de Resposta

Todos os retornos seguem schemas rígidos para garantir compatibilidade com o frontend.

#### CORRECTION_RESPONSE_SCHEMA

```json
{
  "correctedText": "string (obrigatório)",
  "evaluation": {
    "strengths": ["array de strings"],
    "weaknesses": ["array de strings"],
    "suggestions": ["array de strings"],
    "score": "number (0-10)",
    "toneChanges": ["array opcional"],
    "improvements": ["array opcional - premium only"]
  }
}
```

**Código**: `src/index.ts:333-349`

#### REWRITE_RESPONSE_SCHEMA

```json
{
  "rewrittenText": "string (obrigatório)",
  "changes": ["array de mudanças"],
  "toneApplied": "string",
  "styleApplied": "string"
}
```

**Código**: `src/index.ts:360-374`

#### ANALYSIS_RESPONSE_SCHEMA

```json
{
  "result": {
    "verdict": "ai | human | uncertain",
    "probability": "number (0-1)",
    "confidence": "low | medium | high",
    "signals": ["array de sinais detectados"]
  }
}
```

**Código**: `src/index.ts:400-434`

**⚠️ Importante**: Qualquer mudança nesses schemas quebra o frontend. Alterações devem ser versionadas.

### 2.4 Versionamento de Prompts

Prompts são versionáveis via environment bindings:

```typescript
// Versões de prompt (src/index.ts:124-149)
CORRIGIR_PROMPT_VERSION   // Ex: "v2.1"
REESCREVER_PROMPT_VERSION // Ex: "v1.5"
ANALYSIS_PROMPT_VERSION   // Ex: "v3.0"
```

**Estratégia de Deploy**:
- Canary: Mude apenas o binding sem deploy de código
- Rollback: Reverta o binding para versão anterior
- A/B Test: Use múltiplos workers com bindings diferentes

**Código**: `src/index.ts:124-149, :554-566, :1406-1429`

### 2.5 Normalização de Estilos (Reescrita)

Estilos são normalizados e recebem dicas específicas:

```typescript
// Mapeamento de estilos (src/index.ts:554-566)
const styleHints = {
  "youtube": "roteiro youtube",
  "blog": "blog post",
  "newsletter": "newsletter profissional",
  "storytelling": "narrativa envolvente",
  // ... outros estilos
}
```

**Processamento**:
1. Cliente envia `style: "youtube"`
2. Worker normaliza para `"roteiro youtube"`
3. Adiciona dicas específicas ao prompt
4. Modelo recebe contexto enriquecido

**Código**: `src/index.ts:554-566, :1406-1429`

### 2.6 Correção de Textos Longos (Chunking)

**Endpoint**: `/api/premium-corrigir-long`

#### Limites

- **Max total**: 4× `PREMIUM_MAX_TEXT_LENGTH` = **80.000 caracteres** (default)
- **Chunk size**: 2.000 - `chunkSize` caracteres (configurável)
- **Modelo**: `gpt-4.1` via OpenRouter

#### Fluxo

```
1. Valida texto total ≤ 80k
2. Divide em chunks de 2k-8k caracteres
   → Respeita fronteiras de sentenças
3. Para cada chunk:
   → Aplica styleGuide opcional
   → Chama OpenRouter gpt-4.1
   → Extrai texto entre <<<CORRIGIDO>>>
4. Agrega chunks corrigidos
5. Mescla avaliações (strengths/weaknesses/etc)
6. Retorna metadata com:
   → provider: "openrouter"
   → model: "gpt-4.1"
   → chunks: [{ original, corrected, evaluation }]
```

**Código**: `src/index.ts:2778-2877, :65-66, :1303-1353`

#### Response Exemplo

```json
{
  "correctedText": "Texto completo corrigido",
  "evaluation": {
    "strengths": ["Agregado de todos os chunks"],
    "weaknesses": ["..."],
    "suggestions": ["..."],
    "score": 8
  },
  "metadata": {
    "provider": "openrouter",
    "model": "gpt-4.1",
    "totalChunks": 5,
    "chunks": [
      {
        "index": 0,
        "originalLength": 8000,
        "correctedLength": 7950,
        "evaluation": { "score": 8 }
      }
    ]
  }
}
```

### 2.7 Detecção de IA - Orquestração Completa

#### Pipeline de Análise

```
1. Carrega marcadores externos
   → ANALYSIS_MARKERS_BASE_URL
   → Fallback local se fetch falhar
   → Cache com versionDescriptor

2. Calcula textStats
   → Palavras, caracteres, sentenças
   → Densidade, uppercase ratio, etc.

3. Detecta brasileirismos
   → Termos coloquiais brasileiros
   → Count e score agregado

4. Executa agente de gramática
   → OPENROUTER_GRAMMAR_MODEL
   → Detecta erros gramaticais
   → Fallback "uncertain" em caso de erro

5. Monta payload completo
   → termsSnapshot (marcadores)
   → textStats
   → brazilianism
   → grammarSummary

6. Envia para gpt-4o-mini
   → ANALYSIS_TIMEOUT (120s default)
   → Prompt versionado
   → Schema forçado via response_format

7. Retorna AnalysisResponsePayload
```

**Código**: `src/index.ts:1004-1084, :19-34, :2403-2448, :1033-1058, :2101-2109`

#### Marcadores (Signals)

**Fonte**: JSON externo com fallback local

```json
{
  "category": "linguistic",
  "weight": 0.8,
  "version": "v1.2",
  "terms": [
    { "term": "além disso", "pattern": "regex" },
    { "term": "em resumo", "pattern": "regex" }
  ]
}
```

**Processamento**:
- Fetch de `ANALYSIS_MARKERS_BASE_URL`
- Fallback para marcadores embarcados
- Serializa no payload para auditoria

**Código**: `src/index.ts:2156-2304`

#### Text Stats

```typescript
interface TextStats {
  words: number
  characters: number
  sentences: number
  avgSentenceLength: number
  avgWordLength: number
  uppercaseRatio: number
  digitRatio: number
  punctuationRatio: number
}
```

**Código**: `src/index.ts:2307-2346`

#### Brasileirismos

```typescript
interface BrazilianismResult {
  found: boolean
  count: number
  score: number
  terms: Array<{ term: string, count: number }>
  source: string
  version: string
}
```

**Termos detectados**: "tá", "né", "pô", "cara", "mano", etc.

**Código**: `src/index.ts:2349-2398`

#### Response Final

```json
{
  "result": {
    "verdict": "ai",
    "probability": 0.85,
    "confidence": "high",
    "signals": [
      "[Linguistic] Uso excessivo de conectivos formais",
      "[Grammar] Ausência de erros típicos humanos"
    ]
  },
  "textStats": { /* ... */ },
  "brazilianism": { /* ... */ },
  "grammarSummary": {
    "errors": 2,
    "grammarErrors": 1,
    "orthographyErrors": 1,
    "evaluation": "Boa qualidade",
    "confidence": "high",
    "model": "gpt-4o-mini"
  },
  "metadata": {
    "promptVersion": "v3.0",
    "termsVersion": "v1.2",
    "termsSignature": "sha256-abc123",
    "model": "gpt-4o-mini",
    "grammarErrors": 2
  }
}
```

**Uso de metadata**:
- `promptVersion`, `termsVersion`: Cache busting
- `termsSignature`: Validação de integridade
- `model`, `grammarErrors`: Auditoria

**Código**: `src/index.ts:2112-2124, :1071-1083`

### 2.8 Tratamento de Erros no Worker

#### Erros HTTP

| Status | Cenário | Ação |
|--------|---------|-------|
| 401 | `authToken` inválido | Rejeita imediatamente |
| 413 | Texto > limite | Retorna erro com limite |
| 400 | JSON inválido | Parse error |
| 500 | Erro no modelo IA | Retorna details array |
| 504 | Timeout modelo | Propagado ao cliente |

#### Fallbacks

1. **Gramática Agent (AI Detector)**:
   - Erro → `verdict: "uncertain"`
   - Continua com análise parcial

2. **Marcadores (AI Detector)**:
   - Fetch falha → usa marcadores locais
   - Cache com TTL baseado em version

3. **Reescrita (tentativas múltiplas)**:
   - Resposta idêntica → 2ª tentativa com prompt mais rígido
   - Resumo detectado → 3ª tentativa com anti-compressão

**Código**: `src/index.ts:2403-2458, :3248-3279, :2973-3032`

### 2.9 Pós-Processamento

#### Sanitização de Correção

```typescript
// Garante campos obrigatórios
function sanitizeCorrection(response) {
  return {
    correctedText: response.correctedText || originalText,
    evaluation: {
      strengths: Array.isArray(response.evaluation?.strengths)
        ? response.evaluation.strengths
        : [],
      weaknesses: response.evaluation?.weaknesses || [],
      suggestions: response.evaluation?.suggestions || [],
      score: typeof response.evaluation?.score === 'number'
        ? response.evaluation.score
        : 5
    }
  }
}
```

#### Sanitização de Reescrita

```typescript
// Valida se reescrita é válida
function isLikelySummary(original, rewritten) {
  const lengthRatio = rewritten.length / original.length
  return lengthRatio < 0.7 // 70% threshold
}

function extractAdjustedText(response) {
  // Tenta múltiplos campos
  return response.rewrittenText
    || response.adjustedText
    || response.text
    || originalText
}
```

**Código**: `src/index.ts:1406-1465, :3039-3047, :3221-3228`

#### Pain Banner (Upsell)

Calculado por palavras-chave no texto e evaluation:

```typescript
function calculatePainBanner(text, evaluation) {
  const keywords = [
    "erro", "correção", "ajuda", "melhorar",
    "profissional", "importante", "urgente"
  ]

  const hasKeywords = keywords.some(k => text.includes(k))
  const lowScore = evaluation.score < 7
  const hasWeaknesses = evaluation.weaknesses.length > 2

  if (hasKeywords && (lowScore || hasWeaknesses)) {
    return {
      show: true,
      message: "Precisa de mais recursos? Conheça o Premium!"
    }
  }
}
```

**Código**: `src/index.ts:1881-1966, :2690-2699`

### 2.10 Dependências Externas

#### Google Gemini

- **Binding**: `GEMINI_API_KEY`
- **Formato**: JSON (via `responseMimeType: "application/json"`)
- **Endpoints**: Correção e Reescrita
- **Thinking Mode**: Habilitado em premium para melhor raciocínio

#### OpenRouter

- **Binding**: `OPENROUTER_API_KEY`
- **Formato**: `response_format: { type: "json_object", schema: ... }`
- **Endpoints**: AI Detector, Grammar Agent, Long Correction
- **Configurações**:
  ```typescript
  timeout: OPENROUTER_TIMEOUT_MS || 120000
  max_tokens: OPENROUTER_MAX_TOKENS || 4096
  ```

**Código**: `src/index.ts:21-34, :1214-1256, :1303-1341`

---

## 3. Correção de Texto

**Endpoint**: `POST /api/correct`
**Health Check**: `GET /api/correct` → `{ "status": "OK" }`
**Arquivo**: `/app/api/correct/route.ts`
**Max Duration**: 300 segundos

### 1.1 Request

#### Headers
```
Content-Type: application/json
```

#### Body
```json
{
  "text": "Texto a ser corrigido",
  "isMobile": false,
  "tone": "Padrão",
  "customTone": "Tom personalizado (opcional)",
  "isPremium": false,
  "useAdvancedAI": false
}
```

#### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `text` | string | ✅ Sim | Texto a ser corrigido |
| `isMobile` | boolean | ❌ Não | Se requisição vem de mobile (default: false) |
| `tone` | string | ❌ Não | Tom desejado (default: "Padrão") |
| `customTone` | string | ❌ Não | Tom personalizado customizado |
| `isPremium` | boolean | ❌ Não | Se deve usar endpoint premium |
| `useAdvancedAI` | boolean | ❌ Não | Ativa modelos avançados (requer plano premium) |

### 1.2 Limites

#### Por Plano

| Plano | Limite de Caracteres | Correções/Dia | Validação |
|-------|---------------------|---------------|-----------|
| Anônimo | 5.000 | Ilimitado* | Sem autenticação |
| Free | 5.000 | 3 | Via Supabase `usage_limits` |
| Pro/Admin | Ilimitado | Ilimitado | Via Supabase `profiles` |

*Limitado apenas por rate limiting global

#### Rate Limiting

- **Limite Global**: Configurado em `middleware/rate-limit.ts` (Redis)
- **Verificação**: Via `applyRateLimit()` em `lib/api/shared-handlers.ts`

### 1.3 Autenticação

- **Usuários Free**: Cookie de sessão Supabase
- **Premium/Admin**: Cookie + verificação `plan_type` em `profiles` table
- **Advanced AI**: Requer `useAdvancedAI: true` + plano Pro/Admin

### 1.4 Webhooks

#### Gratuito
- **URL**: `https://workers-api.fabiofariasf.workers.dev/api/corrigir`
- **Timeout**: 85 segundos
- **Fallback**: Mesmo endpoint

#### Premium
- **URL**: `https://workers-api.fabiofariasf.workers.dev/api/premium-corrigir`
- **Timeout**: 295 segundos (5 min)
- **Fallback**: Endpoint gratuito

#### Request para Webhook
```json
{
  "text": "Texto sanitizado",
  "source": "mobile|desktop",
  "tone": "Tom selecionado",
  "authToken": "AUTH_TOKEN do servidor"
}
```

#### Processamento no Worker

**Free** (`/api/corrigir`):
1. Valida `authToken` (retorna 401 se inválido)
2. Valida texto ≤ `ANALYSIS_MAX_TEXT_LENGTH` (20.000 chars)
3. Chama **Gemini 2.0 Flash** com prompt versionado
4. Sanitiza resposta com schema `CORRECTION_RESPONSE_SCHEMA`
5. Calcula Pain Banner baseado em keywords/evaluation
6. Retorna JSON + banner (se aplicável)

**Premium** (`/api/premium-corrigir`):
1. Mesma validação de authToken
2. Sem limite de caracteres adicional
3. Chama **Gemini 2.5 Pro** com **thinking mode** habilitado
4. Executa `ensurePremiumInsights()`:
   - Adiciona campo `improvements`
   - Análise mais profunda
   - Marca `model: "gemini-2.5-pro"`
5. Retorna resposta enriquecida

**Referências**: [Seção 2.2](#22-modelos-de-ia-e-providers), [2.9](#29-pós-processamento)

### 1.5 Response

#### Sucesso (200)
```json
{
  "correctedText": "Texto corrigido",
  "evaluation": {
    "strengths": ["Pontos fortes"],
    "weaknesses": ["Pontos fracos"],
    "suggestions": ["Sugestões"],
    "score": 8,
    "toneChanges": ["Mudanças de tom (se tom != Padrão)"],
    "toneApplied": "Tom aplicado (se customTone ou tone != Padrão)"
  },
  "correctionId": "uuid" // Apenas para usuários autenticados
}
```

#### Headers Adicionais
```
X-Text-Length: <caracteres>
X-Tone-Applied: <tom>
```

### 1.6 Fluxo de Processamento

1. **Parse do body** → `parseRequestBody()`
2. **Rate limiting** → `applyRateLimit()`
3. **Validação + Sanitização** → `validateAndSanitizeInput()`
4. **Verificação de autenticação** (se `isPremium` ou `useAdvancedAI`)
   - Checa cookie Supabase
   - Valida `plan_type` = "pro" ou "admin"
5. **Verificação de limites diários** (se usuário free autenticado)
   - `canUserPerformOperation(userId, 'correct')`
   - Retorna 429 se excedido
6. **Validação de tamanho** (pulado para premium)
   - `validateTextLength(text, 5000)` para free
7. **Chamada ao webhook**
   - `callWebhook()` com retry e fallback
   - Webhook escolhido: premium se `isPremium`, senão gratuito
8. **Normalização da resposta** → `normalizeWebhookResponse()`
9. **Processamento de avaliação**
   - Se `tone !== "Padrão"`: mantém apenas `toneChanges`
   - Adiciona `toneApplied` se custom ou tone específico
10. **Persistência** (se usuário autenticado)
    - Premium: `saveCorrection()` sem incrementar contador
    - Free: `saveCorrection()` + `incrementUserUsage(userId, 'correct')`
11. **Response ao cliente** com headers de debug

### 1.7 Correção de Textos Longos (Premium)

**⚠️ Nota**: Existe um endpoint adicional no Worker para textos muito longos:

**Endpoint Worker**: `POST /api/premium-corrigir-long`

**Características**:
- Suporta até **80.000 caracteres** (4× o limite premium padrão)
- Divide texto em chunks de 2.000-8.000 caracteres
- Processa cada chunk individualmente via **OpenRouter GPT-4.1**
- Agrega resultados ao final
- Retorna metadata detalhado por chunk

**Limitações Atuais**:
- ⚠️ Não exposto via Next.js API Routes
- ⚠️ Chunking síncrono (pode causar timeouts)
- ⚠️ Sem UI frontend

**Uso Futuro**:
Para implementar este endpoint no Next.js:
1. Adicionar rota `/app/api/correct-long/route.ts`
2. Aumentar `maxDuration` para 300s
3. Implementar UI com progress tracking
4. Considerar migrar para processamento assíncrono (fila)

Ver [Seção 2.6](#26-correção-de-textos-longos-chunking) para detalhes técnicos.

### 1.8 Tratamento de Erros

| Erro | Status | Fallback |
|------|--------|----------|
| Rate limit excedido | 429 | - |
| JSON inválido | 400 | - |
| Texto muito grande | 413 | - |
| Não autenticado (premium) | 401 | - |
| Plano insuficiente | 403 | - |
| Limite diário excedido | 429 | - |
| Webhook 401 | - | Retry automático com fallback |
| Webhook timeout/erro | 504/500 | Fallback com texto original + avaliação genérica |
| JSON malformado do webhook | - | Fallback com `safeJsonParse()` + `extractValidJson()` |

---

## 2. Reescrita de Texto

**Endpoint**: `POST /api/rewrite`
**Health Check**: `GET /api/rewrite` → `{ "status": "OK" }`
**Arquivo**: `/app/api/rewrite/route.ts`
**Max Duration**: 300 segundos

### 2.1 Request

#### Body
```json
{
  "text": "Texto a ser reescrito",
  "isMobile": false,
  "style": "formal",
  "isPremium": false
}
```

#### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `text` | string | ✅ Sim | Texto a ser reescrito |
| `isMobile` | boolean | ❌ Não | Se requisição vem de mobile |
| `style` | string | ❌ Não | Estilo de reescrita (default: "formal") |
| `isPremium` | boolean | ❌ Não | Se deve usar endpoint premium |

### 2.2 Estilos Disponíveis

#### Gratuitos
- `formal` → "FORMAL"
- `humanized` → "HUMANIZADO"
- `academic` → "ACADÊMICO"
- `creative` → "CRIATIVO"

#### Premium (requer plano Pro/Admin)
- `childlike` → "COMO_UMA_CRIANCA"
- `technical` → "TÉCNICO"
- `journalistic` → "JORNALÍSTICO"
- `advertising` → "PUBLICITÁRIO"
- `blog_post` → "BLOG_POST"
- `reels_script` → "ROTEIRO_REELS"
- `youtube_script` → "ROTEIRO_YOUTUBE"
- `presentation` → "PALESTRA_APRESENTACAO"

**Validação**: `isStylePremium(style)` em `utils/rewrite-styles.ts`

### 2.3 Limites

Idênticos ao endpoint de correção:

| Plano | Limite de Caracteres | Reescritas/Dia |
|-------|---------------------|----------------|
| Anônimo | 5.000 | Ilimitado* |
| Free | 5.000 | 3 |
| Pro/Admin | Ilimitado | Ilimitado |

### 2.4 Webhooks

#### Gratuito
- **URL**: `https://workers-api.fabiofariasf.workers.dev/api/reescrever`
- **Timeout**: 85 segundos

#### Premium
- **URL**: `https://workers-api.fabiofariasf.workers.dev/api/premium-reescrever`
- **Timeout**: 295 segundos

#### Request para Webhook
```json
{
  "text": "Texto sanitizado",
  "style": "FORMAL", // Convertido para CAPSLOCK
  "authToken": "AUTH_TOKEN"
}
```

#### Processamento no Worker

**Free** (`/api/reescrever`):
1. Valida `authToken`
2. Limita texto a `FREE_MAX_TEXT_LENGTH` (1.500 chars)
3. Normaliza estilo (ex: "youtube" → "roteiro youtube")
4. Adiciona dicas específicas por estilo
5. Chama **Gemini Flash Lite** com thinking seletivo
6. Valida resposta com `isLikelySummary()`:
   - Se resposta ≈ original → 2ª tentativa com prompt mais rígido
   - Se resumo detectado (< 70% do tamanho) → 3ª tentativa anti-compressão
7. Extrai texto com `extractAdjustedText()`
8. Retorna array: `[{ output: { rewrittenText, ... } }]`

**Premium** (`/api/premium-reescrever`):
1. Mesma validação de authToken
2. Limite ampliado: `PREMIUM_MAX_TEXT_LENGTH` (20.000 chars)
3. Usa **Gemini Flash Latest**
4. Thinking seletivo por estilo (habilitado para estilos complexos)
5. Instruções anti-resumo mais fortes
6. 2-3 tentativas com prompts progressivamente mais rígidos
7. Marca `model` no output

**Referências**: [Seção 2.5](#25-normalização-de-estilos-reescrita), [2.9](#29-pós-processamento)

### 2.5 Response

#### Sucesso (200)
```json
{
  "rewrittenText": "Texto reescrito",
  "evaluation": {
    "strengths": ["Pontos fortes ou mudanças"],
    "weaknesses": ["Pontos fracos"],
    "suggestions": ["Sugestões ou mudanças"],
    "score": 8,
    "toneApplied": "formal",
    "styleApplied": "formal",
    "changes": ["Lista de mudanças realizadas"]
  },
  "correctionId": "uuid" // Apenas para usuários autenticados
}
```

#### Headers Adicionais
```
X-Style-Applied: <estilo>
```

### 2.6 Fluxo de Processamento

1. Parse do body
2. Rate limiting
3. Validação + sanitização
4. Verificação de autenticação (se `isPremium`)
5. **Verificação de limites diários** (se free autenticado)
   - `canUserPerformOperation(userId, 'rewrite')`
6. **Verificação se estilo é premium** → `isStylePremium(style)`
   - Retorna 403 se estilo premium e usuário não é Pro/Admin
7. Validação de tamanho (pulado para premium)
8. **Conversão de estilo para formato API**
   - Mapeia `"formal"` → `"FORMAL"`, `"blog_post"` → `"BLOG_POST"`, etc.
9. Chamada ao webhook com estilo convertido
10. Normalização com múltiplos campos possíveis:
    - `["rewrittenText", "adjustedText", "correctedText", "text"]`
11. **Construção da avaliação**:
    - Prioriza `changes` se disponível
    - Adiciona `toneApplied` e `styleApplied`
12. Persistência (se autenticado)
    - Premium: `saveCorrection()` com `operationType: "rewrite"`
    - Free: `saveCorrection()` + `incrementUserUsage(userId, 'rewrite')`
13. Response ao cliente

### 2.7 Tratamento de Erros

| Erro | Status | Descrição |
|------|--------|-----------|
| Estilo premium sem plano | 403 | "Este estilo é exclusivo do plano Premium" |
| Demais erros | - | Idênticos ao endpoint de correção |

---

## 3. Detecção de IA

**Endpoint**: `POST /api/ai-detector`
**Health Check**: `GET /api/ai-detector` → `{ "status": "OK" }`
**Arquivo**: `/app/api/ai-detector/route.ts`
**Max Duration**: 300 segundos

### 3.1 Request

#### Body
```json
{
  "text": "Texto para análise de IA",
  "isPremium": false
}
```

#### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `text` | string | ✅ Sim | Texto para detectar conteúdo gerado por IA |
| `isPremium` | boolean | ❌ Não | Se usuário é premium (pula rate limiting diário) |

### 3.2 Limites

#### Por Plano

| Plano | Limite de Caracteres | Análises/Dia | Rate Limiting |
|-------|---------------------|--------------|---------------|
| Anônimo | 10.000 | 2 | Redis-backed via IP/sessão |
| Free | 10.000 | Configurado em `plan_limits_config` | Via `canUserPerformOperation()` |
| Pro/Admin | Ilimitado | Ilimitado | Sem limite diário |

**Constantes**:
- `AI_DETECTOR_CHARACTER_LIMIT` = 10.000
- `AI_DETECTOR_DAILY_LIMIT` = 2 (para não autenticados)

#### Rate Limiting Diário

- **Implementação**: `dailyRateLimiter()` em `lib/api/daily-rate-limit.ts`
- **Identificação**: IP + User-Agent + Session ID
- **Storage**: Redis (Upstash) com fallback in-memory
- **Bypass**: Usuários premium (`isPremium: true`)

### 3.3 Webhook

- **URL**: `https://workers-api.fabiofariasf.workers.dev/api/analysis-ai`
- **Timeout**: 290 segundos (ultrathink models)
- **Sem Fallback**: Único endpoint disponível

#### Request para Webhook
```json
{
  "text": "Texto sanitizado",
  "authToken": "AUTH_TOKEN"
}
```

#### Processamento no Worker

**Pipeline Completo** (`/api/analysis-ai`):

1. **Valida authToken** (retorna 401 se inválido)

2. **Carrega marcadores** (`loadAnalysisMarkers()`):
   - Fetch de `ANALYSIS_MARKERS_BASE_URL`
   - Fallback para marcadores locais embarcados
   - Cache com versionDescriptor

3. **Calcula textStats** (`buildTextStats()`):
   - Palavras, caracteres, sentenças
   - avgSentenceLength, avgWordLength
   - uppercaseRatio, digitRatio, punctuationRatio

4. **Detecta brasileirismos** (`detectBrazilianisms()`):
   - Busca termos coloquiais: "tá", "né", "pô", etc.
   - Calcula count e score
   - Serializa source e version

5. **Executa Grammar Agent**:
   - Chama `OPENROUTER_GRAMMAR_MODEL`
   - Detecta erros gramaticais, ortográficos, concordância
   - Fallback para `verdict: "uncertain"` em caso de erro

6. **Monta payload completo**:
   - termsSnapshot (marcadores)
   - textStats
   - brazilianism
   - grammarSummary

7. **Envia para gpt-4o-mini** (`executeAnalysis()`):
   - Prompt versionado (`ANALYSIS_PROMPT_VERSION`)
   - Schema forçado: `ANALYSIS_RESPONSE_SCHEMA`
   - Timeout: `ANALYSIS_TIMEOUT` (120s default)

8. **Retorna AnalysisResponsePayload**:
   - result (verdict, probability, confidence, signals)
   - textStats, brazilianism, grammarSummary
   - metadata (promptVersion, termsVersion, termsSignature, model)

**Erros**:
- Grammar agent falha → `verdict: "uncertain"`, continua análise
- Marcadores falham → usa fallback local
- Timeout/erro geral → retorna 500/504 com details

**Referências**: [Seção 2.7](#27-detecção-de-ia---orquestração-completa)

### 3.4 Response

#### Sucesso (200)
```json
{
  "result": {
    "verdict": "ai" | "human" | "uncertain",
    "probability": 0.85,
    "confidence": "high" | "medium" | "low",
    "explanation": "Explicação do veredito",
    "signals": [
      "[Categoria] Descrição do sinal detectado",
      "..."
    ]
  },
  "textStats": {
    "words": 150,
    "characters": 850,
    "sentences": 10,
    "avgSentenceLength": 15.0,
    "avgWordLength": 5.67,
    "uppercaseRatio": 0.02,
    "digitRatio": 0.01,
    "punctuationRatio": 0.05
  },
  "brazilianism": {
    "found": true,
    "count": 5,
    "score": 0.8,
    "explanation": "Nível de brasileirismos detectados",
    "terms": [
      { "term": "tá", "count": 2 },
      { "term": "né", "count": 1 }
    ],
    "source": "brasileirismos-v1.json",
    "version": "1.0"
  },
  "grammarSummary": {
    "errors": 3,
    "grammarErrors": 1,
    "orthographyErrors": 1,
    "concordanceErrors": 1,
    "evaluation": "Boa qualidade gramatical",
    "confidence": "high",
    "model": "gpt-4o-mini",
    "details": ["Detalhes dos erros"]
  },
  "metadata": {
    "promptVersion": "v2.1",
    "termsVersion": "1.0",
    "termsSignature": "sha256-hash",
    "models": ["gpt-4o-mini", "ultrathink"],
    "grammarErrors": 3
  },
  "correctionId": "uuid" // Apenas para premium
}
```

#### Headers Adicionais
```
X-Prompt-Version: <versão>
X-Terms-Version: <versão>
X-Terms-Signature: <hash>
```

### 3.5 Normalização de Response

A função `normalizeAIDetectionResponse()` trata múltiplos formatos:

- **Signals**: Arrays de objetos ou strings, formatados como `[Categoria] Descrição`
- **Brazilianism terms**: Object → Array de `{ term, count }`
- **Text stats**: Múltiplos nomes de campo (wordCount/words, charCount/characters)
- **Numbers**: Parse seguro com fallback para 0

### 3.6 Fluxo de Processamento

1. Parse do body
2. **Daily rate limiting** (pulado para premium)
   - `dailyRateLimiter(request, "ai-detector", AI_DETECTOR_DAILY_LIMIT)`
   - Identifica por IP + User-Agent + Session
3. Validação de autenticação (se `isPremium`)
4. Validação de campo `text`
5. **Validação de tamanho** (pulado para premium)
   - `validateTextLength(text, AI_DETECTOR_CHARACTER_LIMIT)`
6. Chamada ao webhook com timeout de 290s
7. **Normalização complexa** da resposta
   - Formata signals
   - Converte terms para array
   - Parse seguro de números
8. Persistência (apenas premium)
   - `saveCorrection()` com `operationType: "ai_analysis"`
   - `correctedText` = JSON compacto do summary
9. **Logging com metadata** para auditoria
   - promptVersion, termsVersion, termsSignature
   - verdict, confidence
10. Response com headers de metadata

### 3.7 Tratamento de Erros

| Erro | Status | Descrição |
|------|--------|-----------|
| Daily limit excedido | 429 | "Limite diário de 2 análises atingido" |
| Texto muito grande | 413 | Max 10.000 caracteres (free) |
| Não autenticado (premium) | 401 | Requer login |
| Webhook timeout | 504 | Após 290 segundos |
| Webhook erro | 500/502 | Erro do serviço externo |

---

## 4. Ajuste de Tom

**Endpoint**: `POST /api/tone`
**Arquivo**: `/app/api/tone/route.ts`
**Max Duration**: 60 segundos

### 4.1 Request

#### Body
```json
{
  "text": "Texto para ajuste de tom",
  "isMobile": false,
  "tone": "Formal"
}
```

#### Parâmetros

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `text` | string | ✅ Sim | Texto para ajustar tom |
| `isMobile` | boolean | ❌ Não | Se requisição vem de mobile |
| `tone` | string | ❌ Não | Tom desejado (default: "Padrão") |

### 4.2 Limites

- **Caracteres**: 5.000 (sem diferença entre planos)
- **Rate Limiting**: Global (Redis)
- **Sem limites diários**: Apenas rate limiting

### 4.3 Webhook

- **URL**: `https://workers-api.fabiofariasf.workers.dev/api/reescrever`
- **Timeout**: 85 segundos (usa `FETCH_TIMEOUT`)

#### Request para Webhook
```json
{
  "text": "Texto sanitizado",
  "style": "Formal", // Tom enviado como style
  "source": "mobile|desktop"
}
```

### 4.4 Response

#### Sucesso (200)
```json
{
  "adjustedText": "Texto com tom ajustado",
  "evaluation": {
    "toneApplied": "Formal",
    "changes": ["Mudanças aplicadas"],
    "suggestions": ["Sugestões adicionais"]
  }
}
```

### 4.5 Fluxo de Processamento

1. **Parse especial do body**
   - Tenta parsear JSON
   - Fallback para `{ tone: "Padrão" }` se falhar
2. Rate limiting
3. Validação + sanitização
   - Recria request com body sanitizado
4. Validação de tamanho (5.000 caracteres)
5. Chamada ao webhook
   - **Tom enviado como `style`** no webhook
6. Normalização com campos:
   - `["rewrittenText", "adjustedText", "text"]`
7. **Construção da resposta**:
   - Campo `adjustedText` (não `rewrittenText`)
   - `evaluation.toneApplied` = tom aplicado
   - `evaluation.changes` = mudanças ou fallback
8. Response (sem persistência em DB)

### 4.6 Tratamento de Erros

**Fallback especial em caso de erro**:
```json
{
  "adjustedText": "Texto original",
  "evaluation": {
    "toneApplied": "Padrão",
    "changes": ["Não foi possível aplicar o ajuste de tom"],
    "suggestions": [
      "Tente novamente mais tarde",
      "Verifique caracteres especiais"
    ]
  }
}
```

---

## Módulos Compartilhados

### 5.1 shared-handlers.ts

Localização: `/lib/api/shared-handlers.ts`

#### Funções

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `applyRateLimit()` | Aplica rate limiting global via Redis | `NextResponse \| null` |
| `sanitizeText()` | Remove espaços excessivos e normaliza newlines | `string` |
| `validateAndSanitizeInput()` | Valida e sanitiza input com Zod | `ValidatedInput \| NextResponse` |
| `parseRequestBody()` | Parse JSON com error handling | `{ body, error }` |
| `validateTextLength()` | Valida tamanho máximo do texto | `NextResponse \| null` |

#### Sanitização de Texto

```typescript
// Remove espaços duplicados e newlines excessivos
text
  .trim()
  .replace(/[ \t]+/g, ' ')      // Múltiplos espaços → 1 espaço
  .replace(/\n{3,}/g, '\n\n')   // 3+ newlines → 2 newlines
```

### 5.2 webhook-client.ts

Localização: `/lib/api/webhook-client.ts`

#### `callWebhook(options)`

```typescript
interface WebhookOptions {
  url: string
  fallbackUrl?: string
  text: string
  requestId: string
  additionalData?: Record<string, any>
  timeout?: number
}
```

**Comportamento**:
1. Prepara headers (sem Connection/Keep-Alive - gerenciado pelo Node.js)
2. Adiciona `authToken` ao body
3. **Auto-detecção de timeout**:
   - `analysis-ai` → 290s
   - `premium-*` → 295s
   - Default → 85s
4. `fetchWithRetry()` com 3 tentativas
5. Se 401 → retry imediato com fallback
6. Se erro → retry com fallback (se disponível)

**Request enviado ao webhook**:
```json
{
  "text": "Texto",
  "authToken": "AUTH_TOKEN (server-side only)",
  ...additionalData
}
```

### 5.3 error-handlers.ts

Localização: `/lib/api/error-handlers.ts`

#### `handleWebhookError(response, requestId, ip)`

Trata erros HTTP do webhook:
- 401/403 → "Erro de autenticação"
- 504 → "Timeout do serviço"
- 500/502/503 → "Erro interno do serviço"

#### `handleGeneralError(error, requestId, ip, text, startTime, operation)`

Trata exceções gerais com fallback response.

### 5.4 response-normalizer.ts

Localização: `/lib/api/response-normalizer.ts`

#### `normalizeWebhookResponse(data, requestId, possibleFields)`

Normaliza respostas de diferentes formatos de webhook:

1. **Texto**: Tenta múltiplos campos possíveis
   - Ex: `["correctedText", "text"]` → primeiro que existir
2. **Evaluation**: Extrai campos padrão
   - strengths, weaknesses, suggestions, score
   - toneChanges, styleApplied, changes
3. **Fallbacks**: Valores padrão se campos ausentes

### 5.5 daily-rate-limit.ts

Localização: `/lib/api/daily-rate-limit.ts`

#### `dailyRateLimiter(request, identifier, limit)`

Rate limiting diário específico (usado pelo AI Detector):

1. **Identificação única**:
   - `${identifier}:${IP}:${User-Agent}:${Session}`
2. **Storage**: Redis (Upstash) com fallback in-memory
3. **TTL**: 24 horas
4. **Response**: 429 se excedido

---

## Fluxo de Requisição Completo

### Exemplo: Correção Premium com Advanced AI

```
1. Cliente envia POST /api/correct
   Body: { text: "...", isPremium: true, useAdvancedAI: true }

2. API: parseRequestBody()
   → Extrai body JSON

3. API: applyRateLimit()
   → Consulta Redis
   → Permite ou retorna 429

4. API: validateAndSanitizeInput()
   → Valida com Zod
   → Sanitiza texto (remove espaços extras)

5. API: getCurrentUserWithProfile()
   → Valida cookie Supabase
   → Busca profile em Supabase
   → Verifica plan_type = "pro" ou "admin"
   → Retorna 401/403 se inválido

6. API: Valida tamanho (pulado para premium)

7. API: callWebhook()
   → URL: PREMIUM_WEBHOOK_URL
   → Timeout: 295s
   → Body: { text, source, tone, authToken }
   → fetchWithRetry() com 3 tentativas

8. Cloudflare Worker processa
   → Modelos avançados (ultrathink)
   → Retorna JSON

9. API: normalizeWebhookResponse()
   → Extrai correctedText
   → Normaliza evaluation

10. API: saveCorrection()
    → Insere em user_corrections
    → NÃO incrementa usage (premium)

11. API: Response
    → JSON: { correctedText, evaluation, correctionId }
    → Headers: X-Request-ID, X-Processing-Time, etc.

12. Cliente recebe resposta
```

---

## Considerações para Nova Arquitetura

### 🔐 Segurança

1. **AUTH_TOKEN deve permanecer server-side**
   - Nunca expor ao cliente
   - Mantém BFF pattern para proteção

2. **Validação em múltiplas camadas**
   - Client-side: UX (feedback imediato)
   - API Route: Segurança (Zod + sanitização)
   - Webhook: Processamento seguro

3. **Rate Limiting deve ser centralizado**
   - Redis para persistência
   - Fallback in-memory para resiliência

### 📊 Monitoramento

1. **Request ID em toda requisição**
   - Permite tracking end-to-end
   - CF-Ray para correlação com Cloudflare

2. **Logging estruturado**
   ```typescript
   logRequest(requestId, {
     status,
     processingTime,
     textLength,
     ip,
     cfRay,
     promptVersion, // Para AI detector
     termsVersion,  // Para auditoria
   })
   ```

3. **Headers de debug**
   - X-Request-ID
   - X-Processing-Time
   - X-Prompt-Version (AI detector)
   - CF-Ray

### ⚡ Performance

1. **Timeouts diferenciados**
   - Standard: 85s
   - Premium: 295s
   - AI Detector: 290s
   - Ajustar por tipo de processamento

2. **Max Duration por rota**
   - Vercel limit: 300s (Hobby/Pro)
   - Configure em `route.ts`: `export const maxDuration = 300`

3. **Retry strategy**
   - 3 tentativas para webhooks principais
   - 2 tentativas para fallback
   - Delay: 2s → 4s → 8s

### 🗄️ Persistência

1. **Histórico apenas para autenticados**
   - `saveCorrection()` para Free/Premium/Admin
   - Inclui originalText, correctedText, evaluation

2. **Usage tracking**
   - Free: incrementa contador após sucesso
   - Premium: salva histórico sem incrementar
   - Admin: salva histórico sem limites

3. **Cleanup automático**
   - Função SQL: `cleanup_old_usage_limits()`
   - Remove registros > 30 dias

### 🔄 Migração/Mudanças

#### Se quiser mover para arquitetura de webhook direto:

**Prós**:
- Menos latência (1 hop a menos)
- Menos código de middleware

**Contras**:
- ❌ AUTH_TOKEN exposto ao cliente
- ❌ Rate limiting distribuído (mais complexo)
- ❌ Validação duplicada (client + webhook)
- ❌ Logs descentralizados

**Recomendação**: Manter BFF pattern, mas otimizar:

1. **Cache de validações**
   - Zod schemas compilados
   - Rate limit checks em batch

2. **Conexão persistente com webhook**
   - HTTP/2 ou keep-alive (Node.js gerencia automático)
   - Pool de conexões

3. **Streaming de response**
   - Para textos longos
   - Response incremental (se webhook suportar)

4. **Edge Functions**
   - Mover API Routes para Vercel Edge
   - Reduz cold start

#### Se quiser adicionar novos endpoints:

**Template**:

```typescript
// /app/api/new-endpoint/route.ts

import { parseRequestBody, applyRateLimit, validateAndSanitizeInput } from "@/lib/api/shared-handlers"
import { callWebhook } from "@/lib/api/webhook-client"
import { handleGeneralError } from "@/lib/api/error-handlers"

export const maxDuration = 300 // Ajustar conforme necessário

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  // 1. Parse
  const { body, error } = await parseRequestBody(request, requestId)
  if (error) return error

  // 2. Rate limit
  const rateLimitResponse = await applyRateLimit(request, requestId)
  if (rateLimitResponse) return rateLimitResponse

  // 3. Validate
  const validated = await validateAndSanitizeInput(request, body, requestId)
  if (validated instanceof NextResponse) return validated

  try {
    // 4. Business logic
    // ...

    // 5. Webhook call
    const response = await callWebhook({
      url: WEBHOOK_URL,
      text: validated.text,
      requestId,
      additionalData: { /* ... */ }
    })

    // 6. Response
    return NextResponse.json(data)
  } catch (error) {
    return handleGeneralError(error, requestId, ip, body.text, startTime, "operation")
  }
}
```

### 📈 Métricas Importantes

Para monitorar em nova arquitetura:

1. **Latência P50/P95/P99**
   - Parse + Validation: < 50ms
   - Webhook call: < 90s (standard), < 300s (premium)
   - Total: < 95s (standard), < 305s (premium)

2. **Taxa de sucesso**
   - Target: > 99% (com fallback)
   - Webhook 5xx: < 0.1%
   - Timeout rate: < 1%

3. **Rate limiting**
   - Blocked requests: monitorar tendência
   - Daily limit hits: < 5% dos usuários free

4. **Uso de planos**
   - Free → Premium conversion
   - Advanced AI adoption (premium)
   - Usage per plan type

### 🏗️ Arquitetura Sugerida (Worker Recommendations)

Baseado no panorama do Cloudflare Worker, as seguintes melhorias são recomendadas:

#### 1. Centralização de Configurações

**Problema Atual**: Bindings e timeouts estão hard-coded no worker (`src/index.ts:19-69`).

**Recomendação**:
- Migrar timeouts para environment bindings configuráveis
- Criar config central para modelos e providers
- Permite switch de provider (Gemini ↔ OpenRouter) sem code deploy

```typescript
// Exemplo de config centralizada
interface AIProviderConfig {
  provider: 'gemini' | 'openrouter'
  model: string
  timeout: number
  maxTokens?: number
}

const CORRECTION_CONFIG: AIProviderConfig = {
  provider: env.CORRECTION_PROVIDER || 'gemini',
  model: env.CORRECTION_MODEL || 'gemini-2.0-flash',
  timeout: env.CORRECTION_TIMEOUT || 120000
}
```

#### 2. CORS e Health Endpoints na Borda

**Recomendação**:
- Replicar middleware CORS + health endpoints em API gateway/load balancer
- Permite balanceamento antes de chegar aos workers
- Health checks: `GET /api/corrigir`, `GET /api/analysis-ai` retornam `{"status":"OK"}`
- Apenas POST/OPTIONS devem chegar ao worker

**Referências**: `src/index.ts:1382-1392, :2463, :3243`

#### 3. Chunking e Filas para Textos Longos

**Problema Atual**: Premium long correction faz chunking síncrono (`src/index.ts:2818-2876`).

**Recomendação**:
- Implementar fila/camada de chunking assíncrona
- Armazena styleGuide por chunk
- Permite retries chunk-a-chunk sem refazer tudo
- Agrega avaliações antes de responder
- Suporta tracking de progresso para UX

**Benefícios**:
- Melhor resiliência (retry individual de chunks)
- Possibilidade de streaming de resultados
- Menor timeout risk

#### 4. Cache de Marcadores e Versioning

**Problema Atual**: Fetch dinâmico de `ANALYSIS_MARKERS_BASE_URL` com fallback (`src/index.ts:2156-2243`).

**Recomendação**:
- Implementar cache local/regional (KV storage ou R2)
- Expose versão/assinatura no response metadata
- Invalida cache quando `versionDescriptor` mudar
- Reduz latência e dependência externa

```typescript
// Pseudo-code para cache
async function getCachedMarkers(version: string) {
  const cached = await KV.get(`markers:${version}`)
  if (cached) return JSON.parse(cached)

  const fresh = await fetchMarkers()
  await KV.put(`markers:${version}`, JSON.stringify(fresh), {
    expirationTtl: 86400 // 24h
  })
  return fresh
}
```

#### 5. Telemetria e Observabilidade

**Recomendação**:
- Adicionar telemetria de chamadas Gemini/OpenRouter
- Métricas:
  - Latência por modelo (p50/p95/p99)
  - Taxa de erro por provider
  - Tokens consumidos (cost tracking)
  - Cache hit ratio (marcadores)
- Integrar com Cloudflare Analytics ou Datadog

**Implementação**:
```typescript
async function trackModelCall(model: string, duration: number, success: boolean) {
  await env.ANALYTICS.writeDataPoint({
    blobs: [model],
    doubles: [duration],
    indexes: [success ? 1 : 0]
  })
}
```

#### 6. Streaming de Respostas

**Recomendação** (futuro):
- Implementar streaming para correções longas
- Worker retorna chunks via Server-Sent Events ou WebSocket
- Next.js API Route propaga stream ao cliente
- UX mostra progresso em tempo real

**Pré-requisitos**:
- Worker deve suportar `ReadableStream`
- Gemini/OpenRouter devem suportar streaming
- Frontend deve implementar progressive rendering

#### 7. Validação e Testes

**Próximos Passos**:

1. **Testes de Compatibilidade**:
   ```bash
   # Testar cada endpoint com tokens reais
   curl -X POST https://workers-api.fabiofariasf.workers.dev/api/corrigir \
     -H "Content-Type: application/json" \
     -d '{"text":"teste","authToken":"$AUTH_TOKEN"}'
   ```

2. **Testes de Carga**:
   - k6 ou Artillery para simular tráfego
   - Validar timeouts e retries
   - Medir latência real vs. esperada

3. **Canary Deployment**:
   - Deploy nova versão em worker secundário
   - Route 10% do tráfego para validação
   - Compare métricas (erros, latência, custos)
   - Rollback automático se degradação > 5%

#### 8. Schema Versioning

**Crítico**: Qualquer mudança nos schemas JSON quebra o frontend.

**Estratégia**:
1. **Adicionar campos**: OK (backward compatible)
2. **Remover campos**: Requer migração coordenada
3. **Mudar tipos**: NUNCA (criar novo campo)

**Exemplo de versioning**:
```typescript
// Response com versão
{
  "schemaVersion": "2.0",
  "correctedText": "...",
  "evaluation": { ... },
  // Novos campos em v2
  "suggestions_v2": { ... }
}
```

**Frontend**:
```typescript
if (response.schemaVersion === "2.0") {
  // Usa novos campos
} else {
  // Fallback para v1
}
```

#### 9. Resumo de Prioridades

| Prioridade | Item | Impacto | Esforço |
|------------|------|---------|---------|
| 🔴 Alta | Centralizar config de modelos | Alto | Baixo |
| 🔴 Alta | Telemetria de chamadas IA | Alto | Médio |
| 🟡 Média | Cache de marcadores | Médio | Baixo |
| 🟡 Média | Fila para textos longos | Médio | Alto |
| 🟢 Baixa | Streaming de respostas | Alto | Alto |
| 🟢 Baixa | CORS na borda | Baixo | Baixo |

---

## Resumo Comparativo

| Característica | Correção | Reescrita | AI Detector | Ajuste Tom |
|----------------|----------|-----------|-------------|------------|
| **Limite Free** | 5k chars | 5k chars | 10k chars | 5k chars |
| **Limite Premium** | Ilimitado | Ilimitado | Ilimitado | - |
| **Daily Limit Free** | 3/dia | 3/dia | 1/dia | - |
| **Daily Limit Anon** | - | - | 2/dia | - |
| **Timeout Standard** | 85s | 85s | 290s | 85s |
| **Timeout Premium** | 295s | 295s | - | - |
| **Fallback** | ✅ Sim | ❌ Não | ❌ Não | ❌ Não |
| **Salva Histórico** | ✅ Auth | ✅ Auth | ✅ Premium | ❌ Não |
| **Conta Usage** | ✅ Free | ✅ Free | Via daily limit | ❌ Não |
| **Rate Limiting** | Global | Global | Global + Daily | Global |
| **Advanced AI** | ✅ Premium | ❌ Não | Sempre | ❌ Não |

---

## Conclusão

Esta arquitetura BFF oferece:

✅ **Segurança**: AUTH_TOKEN server-side, validação centralizada
✅ **Resiliência**: Retry automático, fallbacks, rate limiting
✅ **Monitoramento**: Request ID, CF-Ray, logs estruturados
✅ **Escalabilidade**: Redis-backed rate limit, timeouts ajustáveis
✅ **Flexibilidade**: Múltiplos planos, limites configuráveis

### 🎯 Recomendações Prioritárias

**Para Next.js API (BFF Layer)**:
- ✅ Manter BFF pattern por segurança
- ⚡ Otimizar com Edge Functions
- 📦 Implementar cache de validações
- 📊 Monitorar métricas de latência e sucesso

**Para Cloudflare Worker (Backend)**:
- 🔴 **Alta Prioridade**: Centralizar config de modelos + Telemetria de chamadas IA
- 🟡 **Média Prioridade**: Cache de marcadores + Fila para textos longos
- 🟢 **Futuro**: Streaming de respostas

Ver [Seção 9.9 - Arquitetura Sugerida](#🏗️-arquitetura-sugerida-worker-recommendations) para detalhes completos.

### 📚 Próximos Passos

1. **Validação**: Executar testes de compatibilidade com tokens reais
2. **Observabilidade**: Implementar telemetria de modelos IA
3. **Otimização**: Centralizar configurações do worker
4. **Escalabilidade**: Considerar streaming + filas assíncronas

---

**Gerado em**: 2025-11-14
**Versão da API**: 2.0
**Base**: Next.js 15 + Cloudflare Workers API
**Worker**: `src/index.ts` (Gemini 2.0/2.5, OpenRouter GPT-4o-mini/4.1)
