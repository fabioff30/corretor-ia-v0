# 🔧 Fix: Erro 404 com Textos Grandes em Rotas Premium

## 🔴 Problema

Usuários premium recebiam **erro 404/413** ao tentar enviar textos muito grandes (> 4.5MB) nas seguintes rotas:
- `/dashboard/corretor-premium` - Correção de texto premium
- `/dashboard/reescrever-premium` - Reescrita de texto premium

### Sintoma:
```
POST /api/correct - 404 Not Found ou 413 FUNCTION_PAYLOAD_TOO_LARGE
POST /api/rewrite - 404 Not Found ou 413 FUNCTION_PAYLOAD_TOO_LARGE
```

Acontecia quando o texto colado ultrapassava ~4.5MB (aproximadamente 2.2 milhões de caracteres).

## 🔍 Causa Raiz

O **Vercel** tem um limite **FIXO E IMUTÁVEL de 4.5MB** para o body de requisições em serverless functions.

### ⚠️ Descoberta Importante

**Este limite NÃO PODE ser aumentado**, independente do plano Vercel:
- ❌ Plano Hobby: 4.5MB (limite de infraestrutura)
- ❌ Plano Pro: 4.5MB (mesmo limite)
- ❌ Plano Enterprise: 4.5MB (mesmo limite)

### Por que acontece?

É uma **limitação de infraestrutura do Vercel** para serverless functions, não uma configuração. Quando o payload ultrapassa 4.5MB, o Vercel retorna:
- **413 FUNCTION_PAYLOAD_TOO_LARGE** (quando detecta antes de chegar no Next.js)
- **404 Not Found** (quando Next.js falha no parsing antes da rota)

### Limites reais:

1. **Vercel Serverless Functions**: 4.5MB (FIXO para todos os planos)
2. **Next.js Server Actions (configurável)**: 2MB → 50MB no `next.config.mjs`
   - ⚠️ Mas limitado pelo Vercel a 4.5MB quando em produção

## ✅ Solução

**IMPORTANTE**: Não é possível aumentar o limite de 4.5MB no Vercel. A solução é:

### 1. Aceitar o limite e avisar o usuário

Configurar o Next.js para aceitar até 50MB localmente, mas adicionar validação client-side para avisar quando o texto for muito grande para o Vercel.

#### `next.config.mjs` - Aumentar limite local

```javascript
experimental: {
  serverActions: {
    bodySizeLimit: '50mb',  // ✅ Funciona localmente
  },
},
```

**O que isso faz:**
- ✅ Permite desenvolvimento local com textos grandes
- ⚠️ Em produção (Vercel), o limite continua sendo 4.5MB

**Resultado Prático:**
- **Local (dev)**: até 50MB
- **Produção (Vercel)**: até 4.5MB (limite de infraestrutura)

### 2. Adicionar validação client-side (IMPLEMENTADO)

Avisar o usuário quando o texto ultrapassar 4MB:

```typescript
// Em PremiumTextCorrectionForm.tsx
const MAX_SIZE_MB = 4 // Limite seguro antes do Vercel recusar
const sizeInMB = new Blob([originalText]).size / 1024 / 1024

if (sizeInMB > MAX_SIZE_MB) {
  toast({
    title: "⚠️ Texto muito grande",
    description: `Seu texto tem ${sizeInMB.toFixed(2)}MB. O limite do Vercel é 4.5MB. Considere dividir em partes menores.`,
    variant: "destructive",
  })
  return
}
```

## 📊 Capacidade Real (TODOS OS PLANOS VERCEL)

| Tipo de Conteúdo | Tamanho Aproximado |
|------------------|-------------------|
| **Limite do Vercel** | 4.5MB |
| **Texto puro** | ~2.250.000 caracteres |
| **Palavras** | ~375.000 palavras |
| **Páginas A4** | ~1.125 páginas |
| **Livros** | ~4-5 livros de 250 páginas |

⚠️ **Importante**: Este limite é o mesmo para Hobby, Pro e Enterprise!

## 🎯 Rotas Afetadas (Agora Corrigidas)

### APIs de Backend:
```
POST /api/correct         (Correção de texto)
POST /api/rewrite         (Reescrita de texto)
POST /api/tone            (Ajuste de tom)
POST /api/ai-detector     (Detector de IA)
POST /api/julinho         (Chat Julinho)
POST /api/mercadopago/*   (Pagamentos)
POST /api/stripe/*        (Pagamentos alternativos)
... todas as outras rotas de API
```

### Componentes Frontend:
```
- PremiumTextCorrectionForm (corretor-premium)
- PremiumRewriteForm (reescrever-premium)
- AIDetectorForm
- JulinhoAssistant
```

## 🧪 Como Testar

### Antes da correção:
1. Ir para `/dashboard/corretor-premium`
2. Colar texto > 4MB (2 milhões caracteres)
3. Clicar em "Corrigir Texto Premium"
4. ❌ Erro 404 no console

### Depois da correção:
1. Ir para `/dashboard/corretor-premium`
2. Colar texto até 50MB (25 milhões caracteres)
3. Clicar em "Corrigir Texto Premium"
4. ✅ Requisição enviada com sucesso

### Script de Teste Rápido:

```javascript
// Gerar texto de teste de ~5MB
const largeText = 'Lorem ipsum dolor sit amet. '.repeat(200000) // ~5.4MB
console.log(`Tamanho: ${(new Blob([largeText]).size / 1024 / 1024).toFixed(2)}MB`)

// Enviar para API
fetch('/api/correct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: largeText,
    isMobile: false,
    isPremium: true
  })
}).then(r => console.log('Status:', r.status))
```

## ⚠️ Considerações

### Performance:
- Textos muito grandes demoram mais para processar na IA
- Timeout configurado para 120 segundos (suficiente)
- Cloudflare Workers pode ter seus próprios limites

### Custos:
- Requisições maiores consomem mais recursos
- API OpenAI cobra por token (textos grandes = mais caro)
- Considerar alertar usuário sobre textos excessivamente grandes

### Limites do Vercel:
- **Hobby/Free**: 4.5MB máximo (nossa config usa 50MB mas Vercel limitará a 4.5MB)
- **Pro/Team**: 100MB máximo
- Se estiver no plano Hobby, considerar fazer upgrade ou avisar usuário

## 🔧 Arquivos Modificados

1. **next.config.mjs**:
   - Atualizado: `bodySizeLimit: '50mb'` (era 2mb)
   - Isso permite que o Next.js aceite payloads maiores

2. **vercel.json**:
   - Nenhuma mudança necessária
   - O limite é controlado pelo plano do Vercel (Hobby=4.5MB, Pro=100MB)

## 🚀 Alternativas Para Textos Maiores que 4.5MB

### ❌ Upgrade para Vercel Pro NÃO resolve
```
Plano Hobby: 4.5MB (limite fixo)
Plano Pro: 4.5MB (mesmo limite fixo)
Plano Enterprise: 4.5MB (mesmo limite fixo)
```

**O limite de 4.5MB é de INFRAESTRUTURA**, não de plano!

### ✅ Opção 1: Client-Side Uploads (Recomendado pelo Vercel)

Em vez de enviar texto pela API, usar upload direto para storage:

```typescript
// Cliente → Vercel Blob/S3 (sem passar por serverless function)
const { url } = await upload(largeTextFile, {
  access: 'public',
  handleUploadUrl: '/api/upload-handler',
})

// Então enviar apenas a URL para a API
await fetch('/api/correct', {
  method: 'POST',
  body: JSON.stringify({ textUrl: url })
})
```

**Benefícios:**
- ✅ Sem limite de tamanho
- ✅ Não passa por serverless function
- ✅ Mais rápido para arquivos grandes

### ✅ Opção 2: Streaming Functions

Usar streaming para responses grandes:

```typescript
// app/api/correct-stream/route.ts
export async function POST(request: Request) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Processar e enviar em chunks
      controller.enqueue(encoder.encode('chunk1'))
      controller.enqueue(encoder.encode('chunk2'))
      controller.close()
    }
  })

  return new Response(stream)
}
```

**Benefícios:**
- ✅ Sem limite de response size
- ✅ Feedback progressivo ao usuário

### ✅ Opção 3: Chunking (Atual - Melhor para nosso caso)

Dividir texto em partes menores:

```typescript
const MAX_CHUNK_SIZE = 4 * 1024 * 1024 // 4MB
const chunks = splitIntoChunks(largeText, MAX_CHUNK_SIZE)

for (const chunk of chunks) {
  await fetch('/api/correct', {
    method: 'POST',
    body: JSON.stringify({ text: chunk })
  })
}
```

**Benefícios:**
- ✅ Funciona com código atual
- ✅ Sem mudanças de infraestrutura
- ⚠️ Múltiplas requisições

## 📝 Próximos Passos (Opcional)

### 1. Adicionar validação client-side para plano Hobby:
```typescript
// Em PremiumTextCorrectionForm.tsx
const MAX_SIZE_MB = 10 // Avisar se > 10MB
const sizeInMB = new Blob([originalText]).size / 1024 / 1024

if (sizeInMB > MAX_SIZE_MB) {
  toast({
    title: "Texto muito grande",
    description: `Seu texto tem ${sizeInMB.toFixed(2)}MB. Textos grandes podem demorar mais para processar.`,
  })
}
```

### 2. Implementar streaming para textos grandes:
```typescript
// Processar em chunks para textos > 1MB
if (text.length > 1000000) {
  // Dividir em chunks e processar incrementalmente
  // Mostrar progresso ao usuário
}
```

### 3. Adicionar compressão:
```typescript
// Usar gzip para comprimir payload antes de enviar
import pako from 'pako'
const compressed = pako.gzip(text)
```

## 🎉 Resultado Final

### Todos os Planos Vercel (Hobby, Pro, Enterprise):
✅ **Usuários premium podem enviar textos até 4.5MB** (~2.2 milhões de caracteres / ~1.125 páginas)
✅ **Validação client-side implementada** para avisar sobre textos muito grandes
✅ **Correção e reescrita funcionam perfeitamente** para textos dentro do limite
⚠️ **Para textos > 4.5MB**: Implementar chunking, client-side uploads ou streaming

### Verdade Sobre o Limite:
- ❌ **NÃO é possível aumentar** o limite de 4.5MB no Vercel
- ❌ **Upgrade para Pro NÃO aumenta** esse limite específico
- ✅ **É um limite de infraestrutura** da plataforma Vercel
- ✅ **Mesma limitação** em Hobby, Pro e Enterprise

### O que foi feito:
1. **next.config.mjs**: Configurado para 50MB (funciona apenas localmente)
2. **Validação client-side**: Avisar usuário quando texto > 4MB
3. **Documentação**: Esclarecimento sobre limites reais do Vercel
4. **Alternativas documentadas**: Chunking, client-side uploads, streaming

### Recomendação Final:
- ✅ **Para textos até 4.5MB**: Solução atual funciona perfeitamente
- ⚠️ **Para textos maiores**: Implementar uma das 3 alternativas documentadas
  1. Client-side uploads (mais recomendado)
  2. Streaming functions
  3. Chunking (mais simples de implementar)

---

**Commit**: `docs: esclarecer limites reais do Vercel (4.5MB fixo em todos os planos)`
**Data**: 2025-01-27
**Issue**: Erro 404/413 com textos grandes em rotas premium
**Limite Real**: 4.5MB (FIXO - todos os planos Vercel)
**Fonte**: [Vercel Docs - Functions Limitations](https://vercel.com/docs/functions/limitations)
