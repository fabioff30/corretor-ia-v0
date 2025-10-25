# Defensive JSON Parsing & Error Handling

## O Problema

Quando a API retorna JSON malformado ou truncado, o frontend quebra com:
```
TypeError: Cannot read properties of undefined (reading 'verdict')
```

Exemplo de resposta truncada:
```json
{
  "preview": "{\"correctedText\":\"...\",\"evaluation\":{\"strengths\":[\"...\"],",
  ...truncated at position 645
}
```

## Soluções Implementadas

### 1. **Safe JSON Parsing** (`utils/safe-json-fetch.ts`)

#### `safeJsonParse()`
- Faz parse seguro de JSON com try-catch
- Retorna `{ success, data, error }`
- Loga erro detalhado com posição e preview
- Detecta padrões de truncamento

```typescript
const result = safeJsonParse<MyType>(responseText)
if (!result.success) {
  console.error('Parse error:', result.error)
  console.error('Raw text:', result.rawText)
}
```

#### `extractValidJson()`
- Tenta recuperar JSON válido de respostas truncadas
- Encontra a última posição com braces/brackets completos
- Extrai substring válida e faz parse
- Funciona com respostas parciais

```typescript
const result = extractValidJson<MyType>(malformedJson)
if (result.success) {
  // Funcionou mesmo com JSON parcialmente quebrado!
  const data = result.data
}
```

### 2. **Response Validators**

Validam estrutura antes de usar os dados:

```typescript
// Para AI Detector
const validator = createAIDetectionResponseValidator()

if (!validator.isValid(data)) {
  // Use fallback padrão
  const fallback = validator.getDefaultFallback()
}
```

Benefícios:
- ✅ Type-safe validation
- ✅ Garante campos obrigatórios existem
- ✅ Fallback automático
- ✅ Detecção de estruturas inválidas

### 3. **Error Boundary** (`components/error-boundary.tsx`)

Component que captura erros de render:

```typescript
<ErrorBoundary fallback={(error) => <CustomError error={error} />}>
  <MyComponent />
</ErrorBoundary>
```

Benefícios:
- ✅ Evita crash de toda página
- ✅ Mostra erro amigável
- ✅ Opção de reload
- ✅ Detalhes para debug

### 4. **Updated AIDetectorForm Flow**

```
1. Fetch response
   ↓
2. response.ok?
   ├─ Não → Handle error response safely
   └─ Sim → Continue
   ↓
3. response.text() (não .json() direto!)
   ↓
4. safeJsonParse()
   ├─ Success → Continue
   └─ Failed → Try extractValidJson()
   ↓
5. Validar com validator
   ├─ Valid → Render component
   ├─ Invalid → Use fallback + toast warning
   └─ Parse error → Show user-friendly error
```

## Uso em Components

### Básico

```typescript
import { safeJsonParse, createAIDetectionResponseValidator } from '@/utils/safe-json-fetch'

// Sempre fazer assim:
const response = await fetch(url)
const responseText = await response.text()

// Nunca fazer assim:
const response = await fetch(url)
const data = await response.json() // ⚠️ Pode crashear
```

### Com Validator

```typescript
const validator = createAIDetectionResponseValidator()
let parseResult = safeJsonParse<AIDetectionResponse>(responseText)

// Try to recover if first parse fails
if (!parseResult.success) {
  parseResult = extractValidJson<AIDetectionResponse>(responseText)
}

// Validate structure
if (parseResult.success && parseResult.data) {
  if (!validator.isValid(parseResult.data)) {
    console.warn("Invalid response, using fallback")
    parseResult.data = validator.getDefaultFallback()
  }
}
```

### Com Error Boundary

```typescript
<ErrorBoundary
  fallback={(error) => (
    <Alert variant="destructive">
      <AlertTitle>Erro ao processar dados</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  )}
>
  <MyForm />
</ErrorBoundary>
```

## Logging para Debug

Todos os utilitários logam detalhes:

```typescript
// Console shows:
// - Parse error message
// - Exact position of error
// - First 200 chars of text (preview)
// - Response length
// - Truncation detection
```

Monitore:
1. Cloudflare Logs → Ver erros do backend
2. Browser Console → Ver parsing errors
3. Network tab → Inspeccionar response raw

## Cenários Cobertos

### ✅ JSON Truncado
```json
{"result":{"verdict":"ai","probability":0.8...
```
→ `extractValidJson()` recupera a parte válida

### ✅ Parse Error
```
SyntaxError: Expected ',' or ']' after array element
```
→ `safeJsonParse()` loga posição, tenta `extractValidJson()`

### ✅ Null/Undefined Fields
```typescript
result = null // ou undefined
```
→ Validator detecta, usa fallback

### ✅ Rendering Errors
```
Cannot read properties of undefined (reading 'verdict')
```
→ ErrorBoundary captura, mostra UI amigável

### ✅ Network Errors
```
TypeError: Failed to fetch
```
→ Tratado em try-catch, mensagem clara ao usuário

## Próximos Passos

- [ ] Aplicar mesmo padrão ao `TextCorrectionForm`
- [ ] Criar validator para Rewrite API
- [ ] Implementar retry automático com backoff exponencial
- [ ] Adicionar métricas de erro (qual % falha, em qual etapa)
- [ ] Monitorar com Sentry/LogRocket

## Resources

- `utils/safe-json-fetch.ts` - Utilitários principais
- `components/error-boundary.tsx` - Error Boundary
- `components/ai-detector-form.tsx` - Exemplo de uso
