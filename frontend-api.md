# Guia de Integração Front-end ↔️ Workers API

Este documento orienta o time de front-end sobre como consumir os endpoints expostos pelo worker (`workers-api.fabiofariasf.workers.dev`). Todos os exemplos consideram requisições `fetch` em aplicações web modernas.

> **Requisitos gerais**
>
> - **Método HTTP**: `POST` (exceto health check, que é `GET`).
> - **Header obrigatório**: `Content-Type: application/json`.
> - **Autenticação**: `authToken` (ou `x-auth-token`) com o mesmo valor configurado no Worker (`AUTH_TOKEN`).
> - **Timeout sugerido**: 60 s para evitar abortos prematuros (o worker aguenta filas longas devido ao modo thinking do Gemini 2.5).
> - **Tratamento de erros**: responses diferentes de `2xx` vêm com JSON `{ error: string, details?: string[] }`. Faça sempre `response.json()` antes de exibir mensagens ao usuário.

---

## 1. Correção (`POST /api/corrigir`)

### Payload

```ts
type CorrigirRequest = {
  text: string;      // texto original
  authToken: string; // mesmo token utilizado pelos demais endpoints
};
```

### Resposta (200)

```ts
type CorrigirResponse = {
  correctedText: string;
  evaluation: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    score: number;           // 0-10
    toneChanges?: string[];
    improvements?: string[];
    analysis?: string;
  };
};
```

### Boas práticas no front

- Sanitizar a `textarea` removendo espaços extras antes de enviar.
- Exibir `evaluation.score` como nota de 0–10 (usar progress bar ou chip).
- Preservar emojis e caracteres especiais (o endpoint já sanitiza, basta usar `UTF-8`).
- Tratar `400` (texto vazio) retornando feedback imediato ao usuário.

### Exemplo `fetch`

```ts
const response = await fetch(`${API_BASE}/api/corrigir`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text, authToken }),
});

const payload = await response.json();
if (!response.ok) throw new Error(payload.error ?? "Erro ao corrigir");
```

---

## 2. Correção Premium (`POST /api/premium-corrigir`)

### Diferenças vs. versão free

- Usa o modelo `gemini-flash-latest`.
- Retorna campo `model` com a identificação do modelo utilizado.
- Mesmo contrato de request e response.

### Quando chamar

- Usuários premium ou créditos dedicados.
- Sempre validar o plano do usuário antes de exibir o botão “Corrigir Premium”.

---

## 3. Reescrita (`POST /api/reescrever`)

### Payload

```ts
type ReescreverRequest = {
  text: string;
  style: string;     // ex.: "formal", "casual", "marketing" etc.
  authToken: string;
};
```

### Resposta (200)

```ts
type ReescreverResponse = Array<{
  output: {
    adjustedText: string;
    rewrittenText: string; // igual ao adjustedText (mantido por compatibilidade)
    evaluation: {
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
      changes: string[];
      toneApplied: string;
      styleApplied: string;
      score?: number;
      improvements?: string[];
    };
    model?: string; // presente em alguns cenários, útil para telemetria
  };
}>;
```

### Boas práticas no front

- Garantir seleção de estilo antes de habilitar o botão enviar.
- Mostrar `evaluation.changes` como bullet list para evidenciar o que foi alterado.
- Caso a resposta seja idêntica ao texto original (raro, mas possível), sugerir ao usuário fornecer mais contexto.

---

## 4. Reescrita Premium (`POST /api/premium-reescrever`)

### Diferenças vs. versão free

- Usa o modelo `gemini-flash-latest` com instruções mais exigentes.
- Inclui `model` no objeto `output`.
- Ideal para UX voltada a clientes do plano pago.

---

## 5. Análise de Autoria (`POST /api/analysis-ai`)

### Payload

```ts
type AnalysisRequest = {
  text: string;
  authToken: string;
};
```

### Resposta (200)

```ts
type AnalysisResponse = {
  result: {
    verdict: "ai" | "human" | "uncertain";
    probability: number;         // 0-1
    confidence: "low" | "medium" | "high";
    metadata: {
      promptVersion: string;
      termsVersion: string;
      termsSignature: string;
    };
    signals: Array<{
      category: string;
      direction: "ai" | "human";
      description: string;
      terms?: string[];
      count?: number;
    }>;
  };
  termsSnapshot: Record<string, unknown>;
  textStats: {
    charCount: number;
    wordCount: number;
    sentenceCount: number;
    avgSentenceLength: number;
    avgWordLength: number;
    uppercaseRatio: number;
    digitRatio: number;
    punctuationRatio: number;
  };
  brazilianism: {
    available: boolean;
    count: number;
    terms: string[];
    score: number;
    explanation: string;
  };
  grammarSummary: {
    verdict: "ai" | "human" | "uncertain";
    grammarErrors: number;
    orthographyErrors: number;
    concordanceErrors: number;
    markdownBlocks: number;
    bulletLines: number;
    evaluation: string;
    confidence: string;
    model: string;
  };
  metadata: {
    promptVersion: string;
    termsVersion: string;
    termsSignature: string;
    model: string;
    grammarErrors: number;
  };
};
```

### Renderização recomendada

- Badge grande com `result.verdict` e label textual (“Provavelmente humano”, etc.).
- Slider ou gauge exibindo `probability` (multiplique por 100 para %).
- Listar `signals` com ícone indicando direção (`ai` → vermelho, `human` → verde).
- Exibir métricas de gramática (erros, bullets, markdown) em cards auxiliares.

### Erros comuns

- `401`: token ausente ou inválido.
- `400`: texto vazio.
- `502`: timeout do modelo. O front deve oferecer retry ou fallback.

---

## 6. Health Checks

- `GET /api/corrigir`, `/api/reescrever`, `/api/analysis-ai` → `{ "status": "OK" }`.
- Úteis para monitoramento e telas de status.

---

## Tratamento de Erros no Front

```ts
async function callApi(url: string, input: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.error ?? `Erro ${response.status}`;
    const details = Array.isArray(payload.details) ? payload.details.join("\n") : null;
    throw new Error([message, details].filter(Boolean).join(": "));
  }

  return payload;
}
```

> Garanta que qualquer exceção seja capturada na UI com mensagens amigáveis (“Algo deu errado, tente novamente”). Para o chat do suporte, preserve `requestId` retornado nos headers (`cf-ray`) quando possível.

---

## Observabilidade

- Registre em analytics o modelo (`model`) retornado nos endpoints premium.
- Para `/api/analysis-ai`, armazene `metadata.termsVersion` e `metadata.promptVersion` para auditorias.
- Em caso de erro `502`, registre o tempo decorrido antes do timeout para posterior ajuste de UX.

---

## Checklist Front-end

- [ ] Validar entrada (`text.trim().length > 0`).
- [ ] Bloquear UI enquanto a requisição está em andamento (spinner).
- [ ] Implementar botão “Tentar novamente” quando `response.status >= 500`.
- [ ] Encodar corretamente caracteres especiais (use sempre `JSON.stringify`).
- [ ] Promover logging client-side com `console.error` + ferramenta de monitoramento (Sentry, Datadog, etc.) para diagnósticos rápidos.

Com essas diretrizes, o front-end permanece alinhado com o contrato atual do worker e evita regressões ao integrar novos fluxos. Atualize este guia sempre que novos campos ou endpoints forem introduzidos.
