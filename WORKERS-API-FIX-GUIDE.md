# Guia de Correção: Workers API - Escape de JSON

## 🔍 Problema

O Workers API está retornando JSON malformado quando o texto contém aspas duplas não escapadas, causando erro:
```
"Expected double-quoted property name in JSON at position 100"
```

**Exemplo de texto problemático:**
```
"No dia 07/11... "Festa do Casarão Abandonado"..."
```

## 📁 Repositório do Workers API

**Localização:** `/Users/fabioff30/Documents/my-corretor-ia/workers-api/`

## 🛠️ Alterações Necessárias

### **1. Adicionar função de escape JSON**

**Arquivo:** `src/index.ts`
**Localização:** Logo após a função `sanitizeSmartCharacters` (por volta da linha 1488)

**Adicionar o seguinte código:**

```typescript
/**
 * Escapes special characters in strings for safe JSON serialization
 * Prevents "Expected double-quoted property name" errors from unescaped quotes
 */
function escapeJsonString(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/"/g, '\\"')      // Escape double quotes
    .replace(/\n/g, '\\n')     // Escape newlines
    .replace(/\r/g, '\\r')     // Escape carriage returns
    .replace(/\t/g, '\\t')     // Escape tabs
    .replace(/\f/g, '\\f')     // Escape form feeds
    .replace(/\b/g, '\\b');    // Escape backspaces
}
```

### **2. Atualizar função `sanitizeUserFacingText`**

**Arquivo:** `src/index.ts`
**Localização:** Por volta da linha 1490-1495

**ANTES:**
```typescript
function sanitizeUserFacingText(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  return sanitizeSmartCharacters(value);
}
```

**DEPOIS:**
```typescript
function sanitizeUserFacingText(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  const cleaned = sanitizeSmartCharacters(value);
  return escapeJsonString(cleaned);  // Add JSON escaping to prevent malformed JSON
}
```

### **3. Atualizar prompt do AI (Opcional mas Recomendado)**

**Arquivo:** `src/prompts/correct/default.ts`
**Localização:** Seção "FORMATO DE RESPOSTA OBRIGATÓRIO" (por volta da linha 51-56)

**Adicionar as seguintes linhas após a linha sobre caracteres UTF-8:**

```typescript
- ASPAS DUPLAS: Se o texto original contém aspas duplas ("), MANTENHA-AS no texto corrigido exatamente como estão.
- NÃO tente escapar aspas duplas manualmente - o sistema fará isso automaticamente.
- Se precisar citar algo dentro de suggestions, use aspas simples (') ao invés de duplas (").
```

## 📝 Exemplo de Alteração Completa

### Localização no arquivo `src/index.ts`:

```typescript
// ... código existente ...

function sanitizeSmartCharacters(text: string): string {
  if (typeof text !== 'string') {
    return text;
  }
  return text
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(ZERO_WIDTH_SEPARATORS, '')
    .replace(/\u2028|\u2029/g, '\n');
}

// ✅ ADICIONAR ESTA FUNÇÃO AQUI
/**
 * Escapes special characters in strings for safe JSON serialization
 * Prevents "Expected double-quoted property name" errors from unescaped quotes
 */
function escapeJsonString(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\\/g, '\\\\')   // Escape backslashes first
    .replace(/"/g, '\\"')      // Escape double quotes
    .replace(/\n/g, '\\n')     // Escape newlines
    .replace(/\r/g, '\\r')     // Escape carriage returns
    .replace(/\t/g, '\\t')     // Escape tabs
    .replace(/\f/g, '\\f')     // Escape form feeds
    .replace(/\b/g, '\\b');    // Escape backspaces
}

// ✅ ATUALIZAR ESTA FUNÇÃO
function sanitizeUserFacingText(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }
  const cleaned = sanitizeSmartCharacters(value);
  return escapeJsonString(cleaned);  // ✅ Adicionar esta linha
}

function sanitizeStringArrayOutput(values: string[]): string[] {
  return values.map((item) => sanitizeUserFacingText(item));
}

// ... resto do código ...
```

## 🚀 Deploy

Após fazer as alterações:

```bash
# Navegar para o diretório do Workers API
cd /Users/fabioff30/Documents/my-corretor-ia/workers-api

# Fazer o deploy
npm run deploy
```

## ✅ Como Testar

### **Teste 1: Texto com aspas duplas**

**Input:**
```
No dia 07/11, sexta-feira, estaremos realizando a "Festa do Casarão Abandonado", projeto que trabalhamos durante o semestre.
```

**Resultado esperado:**
- ✅ JSON válido retornado
- ✅ Aspas duplas escapadas corretamente
- ✅ Nenhum erro de parsing

### **Teste 2: Verificar logs do Cloudflare**

Após o deploy, verificar os logs do Cloudflare Workers:
- Não deve haver erros de "Expected double-quoted property name"
- JSON deve ser parseável

### **Teste 3: No Next.js**

Fazer uma correção com texto contendo aspas e verificar:
- Texto é corrigido sem erros
- Resposta é recebida corretamente
- Logs não mostram erros de parsing

## 🔄 Integração com Next.js

As alterações no Next.js já foram implementadas:
- ✅ `app/api/correct/route.ts` agora usa `safeJsonParse()`
- ✅ Tentativa de recuperação automática com `extractValidJson()`
- ✅ Fallback gracioso em caso de erro

## ⚠️ Notas Importantes

1. **Backup:** Faça backup do arquivo `src/index.ts` antes de modificar
2. **Teste local:** Use `npm run dev` para testar localmente antes do deploy
3. **Rollback:** Se houver problemas, você pode fazer rollback pelo dashboard do Cloudflare
4. **Monitoramento:** Monitore os logs nas primeiras horas após o deploy

## 📊 Impacto Esperado

Após as correções:
- ✅ Erros de JSON malformado eliminados
- ✅ Textos com aspas duplas processados corretamente
- ✅ Sistema mais robusto contra caracteres especiais
- ✅ Melhor experiência do usuário (sem erros inesperados)

## 🐛 Troubleshooting

### Se o erro persistir:

1. **Verificar se o deploy foi bem-sucedido:**
   ```bash
   wrangler tail
   ```

2. **Verificar versão ativa no Cloudflare:**
   - Dashboard → Workers → workers-api → Deployments
   - Confirmar que a nova versão está ativa

3. **Verificar logs de erro:**
   - Dashboard → Workers → workers-api → Logs
   - Procurar por "JSON" ou "parse"

4. **Testar endpoint diretamente:**
   ```bash
   curl -X POST https://workers-api.fabiofariasf.workers.dev/api/corrigir \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $AUTH_TOKEN" \
     -d '{"text":"Teste com \"aspas duplas\" no texto"}'
   ```

## 📞 Suporte

Se tiver dúvidas ou problemas:
1. Verifique os logs do Cloudflare Workers
2. Verifique os logs do Next.js (`/api/correct`)
3. Compare o código com este guia
4. Reverta para a versão anterior se necessário

---

**Data de criação:** 2025-11-03
**Autor:** Claude Code
**Versão:** 1.0
