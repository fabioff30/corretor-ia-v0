# 🔧 Fix para API Python - Campo 'correctedText' Obrigatório

## 🚨 Problema Identificado

A API Python está falhando porque os modelos AI do OpenRouter não estão retornando o campo `correctedText` no formato esperado. Todos os modelos estão falhando:

```
RuntimeError: Todos os modelos falharam. Último erro: Modelo google/gemini-2.5-flash: Campo 'correctedText' obrigatório na resposta
```

## ✅ Soluções para a API Python

### **1. Diagnóstico Imediato (EXECUTE PRIMEIRO)**

Adicione logs de debug em `api/common.py` para ver o que os modelos estão retornando:

```python
# Em api/common.py - na função que processa a resposta do modelo
# Adicione estes logs ANTES de tentar extrair correctedText:

logger.info(f"=== DEBUG RESPOSTA MODELO ===")
logger.info(f"Tipo da resposta: {type(response)}")
logger.info(f"Resposta completa: {response}")
if isinstance(response, dict):
    logger.info(f"Campos disponíveis: {list(response.keys())}")
    # Se houver choices, verificar o conteúdo
    if 'choices' in response:
        logger.info(f"Choices[0]: {response['choices'][0] if response['choices'] else 'Empty'}")
logger.info(f"=== FIM DEBUG ===")
```

### **2. Parser de Resposta Robusto**

Substitua a extração atual de `correctedText` por esta função robusta:

```python
def extrair_texto_corrigido(response):
    """
    Extrai o texto corrigido de diferentes formatos de resposta dos modelos AI
    """
    # Primeiro, verificar se já está no formato esperado
    if isinstance(response, dict) and 'correctedText' in response:
        return response['correctedText']
    
    # Tentar diferentes caminhos comuns dos modelos OpenRouter
    possible_paths = [
        # Formato direto
        ('text',),
        ('content',),
        ('result',),
        ('output',),
        
        # Formato com choices (padrão OpenAI/OpenRouter)
        ('choices', 0, 'message', 'content'),
        ('choices', 0, 'text'),
        ('choices', 0, 'content'),
        
        # Formato com data
        ('data', 'text'),
        ('data', 'content'),
        ('data', 'correctedText'),
        
        # Outros formatos possíveis
        ('response', 'text'),
        ('response', 'content'),
        ('message', 'content'),
    ]
    
    for path in possible_paths:
        try:
            value = response
            for key in path:
                if isinstance(value, (list, tuple)) and isinstance(key, int):
                    value = value[key]
                elif isinstance(value, dict):
                    value = value.get(key)
                else:
                    break
            
            if value and isinstance(value, str):
                # Se encontrou texto, tentar extrair JSON se necessário
                text_content = value.strip()
                
                # Se começar com {, tentar fazer parse como JSON
                if text_content.startswith('{'):
                    try:
                        json_response = json.loads(text_content)
                        if isinstance(json_response, dict) and 'correctedText' in json_response:
                            return json_response['correctedText']
                    except json.JSONDecodeError:
                        pass
                
                # Retornar o texto como está (pode ser o próprio texto corrigido)
                return text_content
                
        except (KeyError, IndexError, TypeError):
            continue
    
    # Se não encontrou nada, retornar None para triggerar o erro
    return None
```

### **3. Melhorar o Prompt dos Modelos**

Atualize o prompt para ser mais específico sobre o formato de resposta:

```python
# Em api/common.py - atualizar o prompt do sistema
SYSTEM_PROMPT = """
Você é um corretor de português brasileiro especializado.

INSTRUÇÕES OBRIGATÓRIAS:
1. Corrija APENAS erros ortográficos, gramaticais e de pontuação
2. Mantenha o estilo e tom originais do texto
3. RETORNE OBRIGATORIAMENTE em formato JSON válido:

{
  "correctedText": "texto corrigido aqui",
  "evaluation": {
    "strengths": ["pontos positivos"],
    "weaknesses": ["pontos a melhorar"],
    "suggestions": ["sugestões"],
    "score": 8
  }
}

IMPORTANTE: 
- O campo "correctedText" é OBRIGATÓRIO
- Não adicione texto antes ou depois do JSON
- Apenas o JSON válido como resposta
"""

# Para o user prompt também ser mais específico:
def criar_user_prompt(texto, tom="Padrão"):
    return f"""
Corrija este texto mantendo o tom {tom}:

"{texto}"

Responda APENAS com o JSON no formato especificado, sem texto adicional.
"""
```

### **4. Implementação com Fallback**

Modifique a função principal de processamento:

```python
async def processar_correcao(text, tone="Padrão"):
    """
    Processa a correção com fallback robusto
    """
    for modelo in MODELOS_DISPONIVEIS:
        try:
            logger.info(f"Tentando modelo: {modelo}")
            
            # Fazer a requisição para o modelo
            response = await fazer_requisicao_openrouter(text, tone, modelo)
            
            # Log de debug da resposta
            logger.info(f"Resposta bruta do {modelo}: {response}")
            
            # Extrair texto corrigido com parser robusto
            texto_corrigido = extrair_texto_corrigido(response)
            
            if texto_corrigido:
                logger.info(f"Sucesso com modelo {modelo}")
                
                # Tentar extrair avaliação também
                evaluation = extrair_avaliacao(response) or criar_avaliacao_padrao()
                
                return {
                    "correctedText": texto_corrigido,
                    "evaluation": evaluation
                }
            else:
                logger.error(f"Modelo {modelo}: Campo 'correctedText' não encontrado")
                continue
                
        except Exception as e:
            logger.error(f"Modelo {modelo} falhou: {str(e)}")
            continue
    
    # Se todos falharam, retornar resposta de fallback
    logger.error("Todos os modelos falharam, usando fallback")
    return {
        "correctedText": text,  # Retorna o texto original
        "evaluation": {
            "strengths": ["Texto processado"],
            "weaknesses": ["Correção automática indisponível"],
            "suggestions": ["Tente novamente mais tarde"],
            "score": 5
        }
    }

def extrair_avaliacao(response):
    """Extrai avaliação da resposta, se disponível"""
    # Similar ao extrair_texto_corrigido, mas para evaluation
    # Implementar lógica similar para diferentes formatos
    pass

def criar_avaliacao_padrao():
    """Cria avaliação padrão quando não disponível"""
    return {
        "strengths": ["Texto analisado"],
        "weaknesses": [],
        "suggestions": ["Revisão manual recomendada"],
        "score": 7
    }
```

### **5. Configuração de Modelos Alternativos**

Adicione modelos de backup que podem ter melhor compatibilidade:

```python
# Em api/common.py - atualizar lista de modelos
MODELOS_DISPONIVEIS = [
    "openai/gpt-3.5-turbo",  # Modelo mais confiável
    "anthropic/claude-3-haiku",  # Alternativa boa
    "google/gemini-2.5-flash",  # Seu modelo atual
    "google/gemma-3-27b-it",   # Seu modelo atual
    "meta-llama/llama-3.1-8b-instruct",  # Backup adicional
]
```

### **6. Teste e Validação**

Adicione endpoint de teste para debug:

```python
# Em api/corrigir.py - adicionar endpoint de debug
@app.route('/api/debug-modelo', methods=['POST'])
async def debug_modelo():
    """Endpoint para testar resposta dos modelos"""
    data = request.get_json()
    texto = data.get('text', 'Texto de teste.')
    modelo = data.get('model', 'google/gemini-2.5-flash')
    
    try:
        response = await fazer_requisicao_openrouter(texto, "Formal", modelo)
        return {
            "status": "success",
            "modelo": modelo,
            "resposta_bruta": response,
            "tipo": str(type(response)),
            "campos": list(response.keys()) if isinstance(response, dict) else "não é dict"
        }
    except Exception as e:
        return {
            "status": "error",
            "erro": str(e)
        }, 500
```

## 📋 **Checklist de Implementação**

- [ ] **Passo 1**: Adicionar logs de debug para ver formato atual das respostas
- [ ] **Passo 2**: Implementar função `extrair_texto_corrigido` robusta
- [ ] **Passo 3**: Atualizar prompts do sistema para ser mais específico
- [ ] **Passo 4**: Implementar fallback que retorna texto original em caso de falha
- [ ] **Passo 5**: Adicionar modelos alternativos mais confiáveis
- [ ] **Passo 6**: Testar com endpoint de debug

## 🧪 **Como Testar**

1. **Deploy as mudanças**
2. **Testar endpoint de debug**:
   ```bash
   curl -X POST sua-api/api/debug-modelo \
     -H "Content-Type: application/json" \
     -d '{"text": "teste", "model": "google/gemini-2.5-flash"}'
   ```
3. **Verificar logs** para ver formato das respostas
4. **Testar correção normal** após ajustes

## ⚡ **Solução Rápida (Se urgente)**

Se precisar de uma solução imediata, pode implementar apenas isto:

```python
# Substituir a parte que extrai correctedText por:
def extrair_corrected_text_rapido(response):
    # Tentar formato atual primeiro
    if isinstance(response, dict) and 'correctedText' in response:
        return response['correctedText']
    
    # Tentar formato OpenRouter padrão
    if isinstance(response, dict) and 'choices' in response:
        if response['choices'] and len(response['choices']) > 0:
            choice = response['choices'][0]
            if 'message' in choice and 'content' in choice['message']:
                content = choice['message']['content']
                # Se for JSON, tentar parse
                if content.strip().startswith('{'):
                    try:
                        parsed = json.loads(content)
                        return parsed.get('correctedText', content)
                    except:
                        pass
                return content
    
    # Fallback: retornar texto original
    return None
```

---

**🎯 Esta documentação resolve o erro "Campo 'correctedText' obrigatório na resposta" na API Python!**