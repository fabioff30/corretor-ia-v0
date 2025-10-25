## Integração Front-End: Modelos Free x Premium

### 1. Objetivo
- Alinhar o front-end com os novos prompts/shared logic do worker em https://workers-api.fabiofariasf.workers.dev/.
- Exibir e segregar estilos gratuitos e premium, mantendo as opções premium visíveis (com mensagem de assinatura).
- Ajustar chamadas de API para usar os endpoints corretos e payloads expected pela API.

### 2. Catálogo de Estilos

**Gratuito (POST https://workers-api.fabiofariasf.workers.dev/api/reescrever)**
1. FORMAL — linguagem séria, vocabulário preciso.
2. HUMANIZADO — tom próximo, 1ª pessoa opcional, empatia.
3. ACADÊMICO — impessoal, termos técnicos, 3ª pessoa.
4. CRIATIVO — metáforas originais, emojis moderados (máx. 3).
5. COMO UMA CRIANÇA — frases curtas, palavras simples, tom lúdico.

**Premium (POST https://workers-api.fabiofariasf.workers.dev/api/premium-reescrever)**
6. TÉCNICO — precisão e instruções claras. Uso: manuais, docs, tutoriais passo-a-passo. Tom objetivo, sequencial. Comprimento médio a longo. Ex: "1. Faça download...".
7. JORNALÍSTICO — lead forte, pirâmide invertida. Uso: notícias, releases, comunicados. Tom impactante e factual. Comprimento curto a médio. Ex: "Empresa anuncia transformação digital...".
8. PUBLICITÁRIO — persuasivo orientado à conversão. Uso: anúncios, landing pages. Tom benefit-driven, emotivo, CTA claro. Comprimento curto. Ex: "Aumente produtividade 3x...".
9. BLOG POST — estrutura web-friendly com subtítulos. Uso: artigos, guias, SEO. Tom engajador e autorizado. Comprimento longo (1000+ palavras). Ex: "## Por Que Cursos Online...".
10. ROTEIRO PARA REELS — hook em 3 segundos, ultra dinâmico. Uso: Instagram Reels, TikTok. Tom coloquial com emojis/hashtags. Comprimento ~30 s. Ex: "[Hook] Você sabia...".
11. ROTEIRO PARA YOUTUBE — Hook → Story → Desenvolvimento → CTA distribuído. Uso: scripts long-form. Tom conversacional com storytelling. Comprimento 5–20 min. Ex: "[Hook] E se eu disser...".
12. PALESTRA / APRESENTAÇÃO — didático com pontos-chave marcados. Uso: slides, talks. Tom professoral acessível. Comprimento variável.

### 3. UI/UX Recomendado
- Separar visualmente os blocos “Modelos Gratuitos” e “Modelos Premium”.
- Premium deve aparecer visível, mas com badge/botão “Assine para usar” quando usuário não for premium.
- Ao selecionar um modelo premium sem assinatura, abrir modal de upsell (comparativo de benefícios + CTA “Assinar agora”).
- Mostrar tooltip ou drawer com detalhes (Uso, Tom, Comprimento, Exemplo) ao focar/hover em cada modelo.
- Se o usuário premium estiver na aba gratuita, informe que pode alternar para premium sem custo adicional.

### 4. Controle de Acesso
- Verificar status de assinatura no estado global (ex.: Query ao backend, JWT, feature flag). Sugestão: `isPremiumUser`.
- Desabilitar o submit do formulário para free quando um estilo premium estiver selecionado por usuário não premium. Mostrar mensagem inline (“Requer plano Premium”).
- Para usuários premium, habilitar os dois grupos normalmente.

### 5. Payload das Requisições
- Rota gratuita (`/api/reescrever`):
  ```json
  {
    "text": "<texto original>",
    "style": "<ESTILO EM CAPSLOCK>",
    "authToken": "<TOKEN DO WORKER>"
  }
  ```
- Rota premium (`/api/premium-reescrever`): mesmo payload.
- O worker diferencia estilos via campo `style`. Garantir que as labels enviadas correspondam exatamente às opções listadas.
- Adicionar headers: `Content-Type: application/json`, `x-client: frontend` (se conveniente para rastreamento).

### 6. Seleção do Endpoint
- Usuário free + modelo free → POST `/api/reescrever`.
- Usuário free + modelo premium → bloquear envio, acionar fluxo de assinatura.
- Usuário premium → escolher endpoint (`/api/reescrever` ou `/api/premium-reescrever`) conforme modelo (sugestão: sempre usar `/api/premium-reescrever` para estilos premium, `/api/reescrever` para os demais, para preservar telemetria separada).

### 7. Persistência & Analytics
- Persistir a última escolha de estilo (localStorage ou user profile) para pré-selecionar ao retornar.
- Emitir eventos:
  - `rewrite_model_selected` (payload: `{ modelId, tier: "free"|"premium" }`)
  - `rewrite_model_locked_premium` quando usuário free tentar premium.
  - `rewrite_submitted` com tier/tempo de execução para embasar monitoramento.

### 8. Tratamento de Erros
- 401 → solicitar login/token válido.
- 400 → mostrar validação (“Campo texto vazio”, etc.).
- 500/timeout → sugerir retry; logar em tool de observabilidade.
- Exibir sempre o `model` retornado na resposta para auditoria (ex.: `gemini-flash-latest` ou `models/gemini-2.0-flash-lite`).

### 9. Checklist de Deploy
1. Ajustar componentes de seleção (lista, cards, badges).
2. Implementar modal de upsell premium.
3. Atualizar data layer / analytics com os novos eventos.
4. Garantir envio de `style` em CAPSLOCK.
5. Configurar variáveis de ambiente para `authToken` no front-end.
6. Testar manualmente as rotas via curl/inspector antes do deploy.
7. Rodar testes e revisar com UX/Conteúdo.

### 10. Recursos Úteis
- Worker de staging: https://workers-api.fabiofariasf.workers.dev/
- Endpoint free: https://workers-api.fabiofariasf.workers.dev/api/reescrever
- Endpoint premium: https://workers-api.fabiofariasf.workers.dev/api/premium-reescrever
- Documentação API (rever payloads): README no repositório ou https://workers-api.fabiofariasf.workers.dev/api/ (health check).
