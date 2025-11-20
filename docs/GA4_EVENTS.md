# Google Analytics 4 - Eventos Configurados

Este documento lista todos os eventos customizados enviados para o Google Analytics 4.

## 📊 Configuração

- **Measurement ID**: `G-ZR7B5DMLER`
- **Property ID**: `482373349`
- **Método de envio**: gtag.js (código direto)
- **Consentimento**: Respeitando configuração de cookies (localStorage)

## 📍 Eventos Implementados

### 1. Correção de Texto

#### `text_corrected`
**Descrição**: Disparado quando um texto é corrigido com sucesso (usuário free ou premium)

**Parâmetros**:
- `textLength` (number): Tamanho do texto em caracteres
- `correctionScore` (number): Pontuação da correção (0-100)

**Localização**: `components/text-correction-form.tsx:742`

**Exemplo**:
```javascript
sendGTMEvent("text_corrected", {
  textLength: 1234,
  correctionScore: 85
})
```

---

### 2. Reescrita de Texto

#### `rewrite_text`
**Descrição**: Disparado quando um texto é reescrito com sucesso

**Parâmetros**:
- `textLength` (number): Tamanho do texto em caracteres
- `rewriteStyle` (string): Estilo de reescrita selecionado

**Localização**: `components/text-correction-form.tsx:747`

**Exemplo**:
```javascript
sendGTMEvent("rewrite_text", {
  textLength: 1234,
  rewriteStyle: "Formal"
})
```

---

### 3. Avaliação de Correção

#### `correction_rating`
**Descrição**: Disparado quando o usuário avalia uma correção com estrelas

**Parâmetros**:
- `rating` (number): Avaliação em estrelas (1-5)
- `feedback` (string): Comentário do usuário (ou "No feedback provided")

**Localização**: `components/star-rating.tsx:35`

**Exemplo**:
```javascript
sendGTMEvent("correction_rating", {
  rating: 5,
  feedback: "Excelente correção!"
})
```

---

### 4. Seleção de Tom

#### `tone_selected`
**Descrição**: Disparado quando o usuário seleciona um tom para a correção

**Parâmetros**:
- `tone` (string): Tom selecionado (ex: "Formal", "Casual", "Técnico", etc.)

**Localização**: `components/tone-adjuster.tsx:51`

**Exemplo**:
```javascript
sendGTMEvent("tone_selected", {
  tone: "Formal"
})
```

---

### 5. Autenticação

#### `login`
**Descrição**: Disparado quando um usuário faz login

**Parâmetros**:
- `method` (string): Método de login ("email", "google", "google_one_tap")
- `user_id` (string): ID do usuário

**Localizações**:
- `app/login/page.tsx:58` (email/password)
- `contexts/auth-context.tsx:118` (todos os métodos via onAuthStateChange)

**Exemplo**:
```javascript
sendGTMEvent("login", {
  method: "google_one_tap",
  user_id: "uuid-do-usuario"
})
```

---

#### `login_attempt`
**Descrição**: Disparado quando há uma tentativa de login (antes da confirmação)

**Parâmetros**:
- `method` (string): Método de login tentado

**Localizações**:
- `app/login/page.tsx:83` (Google OAuth)
- `components/google-one-tap.tsx:79` (One Tap)

---

#### `logout`
**Descrição**: Disparado quando um usuário faz logout

**Parâmetros**:
- `method` (string): Método de logout ("manual")
- `user_id` (string, opcional): ID do usuário

**Localização**: `contexts/auth-context.tsx:125`

**Exemplo**:
```javascript
sendGTMEvent("logout", {
  method: "manual",
  user_id: "uuid-do-usuario"
})
```

---

#### `sign_up`
**Descrição**: Disparado quando um novo usuário se cadastra

**Parâmetros**:
- `method` (string): Método de cadastro ("email")
- `user_id` (string): ID do novo usuário

**Localização**: `contexts/auth-context.tsx:197`

---

### 6. Google One Tap

#### `one_tap_displayed`
**Descrição**: Disparado quando o prompt do Google One Tap é exibido

**Parâmetros**:
- `moment_type` (string): Tipo do momento de exibição

**Localização**: `components/google-one-tap.tsx:150`

---

#### `one_tap_dismissed`
**Descrição**: Disparado quando o usuário dispensa o Google One Tap

**Parâmetros**:
- `reason` (string): Razão da dispensação

**Localização**: `components/google-one-tap.tsx:144`

---

### 7. Premium - Reescrita

#### `premium_rewrite_started`
**Descrição**: Disparado quando um usuário premium inicia uma reescrita

**Parâmetros**:
- `charCount` (number): Tamanho do texto em caracteres
- `style` (string): Estilo de reescrita selecionado

**Localização**: `components/dashboard/PremiumRewriteForm.tsx:219`

---

#### `premium_rewrite_completed`
**Descrição**: Disparado quando uma reescrita premium é concluída

**Parâmetros**:
- `charCount` (number): Tamanho do texto em caracteres
- `style` (string): Estilo de reescrita aplicado

**Localização**: `components/dashboard/PremiumRewriteForm.tsx:274`

---

### 8. Premium - Correção

#### `premium_correction_completed`
**Descrição**: Disparado quando uma correção premium é concluída

**Parâmetros**:
- `charCount` (number): Tamanho do texto em caracteres
- `score` (number): Pontuação da correção (0-100)

**Localização**: `components/dashboard/PremiumTextCorrectionForm.tsx:245`

---

## 🔧 Implementação Técnica

### Helper Function

Todos os eventos são enviados através da função `sendGTMEvent()` localizada em `utils/gtm-helper.ts`:

```typescript
export function sendGTMEvent(eventName: string, eventData: Record<string, any> = {}) {
  if (typeof window === "undefined") return

  // Enviar para dataLayer (GTM - temporário)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    })
  }

  // Enviar diretamente para GA4 via gtag
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, eventData)
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[GA4 Event] ${eventName}`, eventData)
  }
}
```

### Inicialização do GA4

O script do GA4 é carregado em `app/layout.tsx` com verificação de consentimento de cookies:

```javascript
// Google Analytics 4 - gtag.js
<Script
  src="https://www.googletagmanager.com/gtag/js?id=G-ZR7B5DMLER"
  strategy="afterInteractive"
/>

// Google Analytics 4 - Configuration
<Script id="ga4-config" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    var ga4Consent = localStorage.getItem('cookie-consent');
    if (ga4Consent === 'accepted') {
      gtag('config', 'G-ZR7B5DMLER', {
        page_path: window.location.pathname,
        send_page_view: true
      });
    }
  `}
</Script>
```

---

## 📝 Notas

1. **Consentimento de Cookies**: Todos os eventos respeitam a configuração de cookies do usuário armazenada em `localStorage.getItem('cookie-consent')`

2. **Compatibilidade com GTM**: O código atual envia eventos tanto para o dataLayer (GTM) quanto diretamente para o GA4. Após validação, o envio via GTM pode ser removido.

3. **Debug em Desenvolvimento**: Em modo de desenvolvimento (`NODE_ENV === "development"`), todos os eventos são logados no console com o prefixo `[GA4 Event]`.

4. **Nomenclatura**: Os eventos seguem a convenção:
   - Nome do evento: snake_case (ex: `text_corrected`, `login_attempt`)
   - Parâmetros: camelCase (ex: `textLength`, `correctionScore`)

---

**Última atualização**: 2025-01-26
**Versão**: 1.0.0
