# Troubleshooting: MarkItDown API não está acessível

**Status**: Service is not reachable
**URL**: https://markitdown-markitdown.3j5ljv.easypanel.host/
**Data**: 2025-11-14

---

## 🔍 Diagnóstico Rápido

O erro "Service is not reachable" no EasyPanel significa que:
- ❌ O container não está rodando OU
- ❌ A aplicação crashou ao iniciar OU
- ❌ A porta está errada OU
- ❌ O health check falhou

---

## ✅ Checklist de Verificação no EasyPanel

### 1. Verificar Status do Container

**Onde**: EasyPanel → `markitdown-api` → **Overview**

Procure por:
- ✅ **Status**: Deve estar "Running" (verde)
- ❌ **Status**: Se está "Stopped", "Failed", "Restarting" (vermelho/amarelo)

### 2. Verificar Logs

**Onde**: EasyPanel → `markitdown-api` → **Logs**

**O que procurar**:

#### ✅ Logs de Sucesso (deve aparecer):
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

#### ❌ Erros Comuns:

**Erro 1: Módulo não encontrado**
```
ModuleNotFoundError: No module named 'markitdown'
```
**Solução**: `requirements.txt` não foi instalado corretamente.

**Erro 2: Porta em uso**
```
OSError: [Errno 98] Address already in use
```
**Solução**: Mudar variável `PORT` ou reiniciar container.

**Erro 3: Memória insuficiente**
```
Killed
```
**Solução**: Aumentar RAM da aplicação.

**Erro 4: Build falhou**
```
ERROR: Could not find a version that satisfies the requirement markitdown
```
**Solução**: Verificar `requirements.txt`.

### 3. Verificar Variáveis de Ambiente

**Onde**: EasyPanel → `markitdown-api` → **Environment**

**Variáveis obrigatórias**:

| Variável | Valor | Status |
|----------|-------|--------|
| `PORT` | `8000` | ✅ Definida? |
| `API_TOKEN` | `5vi2Y+LzHq...` | ✅ Definida? |
| `ALLOWED_ORIGINS` | `*` ou seu domínio | ⚠️ Opcional |

### 4. Verificar Build

**Onde**: EasyPanel → `markitdown-api` → **Builds** (ou Deployments)

- Último build foi **sucesso**? (verde)
- Quanto tempo demorou?
- Há erros de build?

### 5. Verificar Porta/Domínio

**Onde**: EasyPanel → `markitdown-api` → **Domains**

- Domínio está configurado?
- SSL está ativo?
- Port mapping está correto? (8000 → 80/443)

---

## 🔧 Soluções por Problema

### Problema 1: App não inicia (Container Stopped)

**Verificar**:
1. Logs → Procurar erro no final
2. Environment → Checar variáveis
3. Resources → Verificar se tem RAM suficiente (mín 2GB)

**Solução**:
```bash
# Se o problema for memória
EasyPanel → Settings → Resources → RAM: 2GB → Redeploy

# Se o problema for código
Verificar app.py está correto (comparar com guia)
```

### Problema 2: Build falha

**Sintoma**: Logs mostram "Build failed" ou erro durante pip install

**Solução**:

1. **Verificar `requirements.txt`**:
   ```txt
   fastapi==0.109.0
   uvicorn[standard]==0.27.0
   python-multipart==0.0.6
   markitdown[all]==0.1.0
   python-dotenv==1.0.0
   ```

2. **Verificar `Dockerfile`** (deve ter estas linhas):
   ```dockerfile
   FROM python:3.11-slim

   RUN apt-get update && apt-get install -y \
       poppler-utils \
       tesseract-ocr \
       curl \
       && rm -rf /var/lib/apt/lists/*

   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt

   COPY app.py .
   CMD ["python", "app.py"]
   ```

3. **Forçar rebuild**:
   - EasyPanel → Settings → Redeploy (checkbox "Force rebuild")

### Problema 3: Porta errada

**Sintoma**: Logs mostram app rodando mas EasyPanel não consegue acessar

**Verificar**:
- App está rodando na porta `8000`? (ver logs)
- EasyPanel está mapeando corretamente?

**Solução**:
1. Environment → `PORT=8000`
2. `app.py` deve ter:
   ```python
   port = int(os.getenv("PORT", 8000))
   uvicorn.run(app, host="0.0.0.0", port=port)
   ```

### Problema 4: Health check falha

**Sintoma**: App roda mas EasyPanel marca como "unhealthy"

**Solução**:
1. Verificar se rota `/health` existe no `app.py`:
   ```python
   @app.get("/health")
   async def health():
       return {"status": "healthy", "version": "1.0.0"}
   ```

2. Desabilitar health check temporariamente:
   - Dockerfile → Comentar linha `HEALTHCHECK`
   - Redeploy

### Problema 5: Dependências faltando (poppler, tesseract)

**Sintoma**: Conversão de PDF falha com erro de biblioteca

**Solução**:
Dockerfile deve incluir:
```dockerfile
RUN apt-get update && apt-get install -y \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-por \
    && rm -rf /var/lib/apt/lists/*
```

---

## 🚀 Solução Rápida: Recriar do Zero

Se nada funcionar, vamos recriar passo a passo:

### Passo 1: Criar app.py mínimo

```python
from fastapi import FastAPI
import uvicorn
import os

app = FastAPI(title="MarkItDown API - Test")

@app.get("/")
async def root():
    return {"status": "ok", "message": "API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### Passo 2: Dockerfile mínimo

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install fastapi uvicorn[standard]

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

### Passo 3: Deploy e testar

1. Commit e push
2. EasyPanel → Redeploy
3. Testar: `curl https://seu-dominio/health`

Se funcionar, adicionar incrementalmente:
1. `requirements.txt` completo
2. Dependências do sistema (poppler, etc)
3. Código completo do MarkItDown

---

## 📋 Checklist de Debug

Execute isso no EasyPanel:

- [ ] Container está "Running"?
- [ ] Logs mostram "Uvicorn running"?
- [ ] Porta é 8000?
- [ ] Variável `PORT=8000` está definida?
- [ ] `API_TOKEN` está definida?
- [ ] Build foi sucesso?
- [ ] RAM >= 2GB?
- [ ] Domínio configurado?
- [ ] SSL ativo?
- [ ] `app.py` existe e está correto?
- [ ] `Dockerfile` está correto?
- [ ] `requirements.txt` está correto?

---

## 💬 O Que Fazer Agora

**Por favor, me envie**:

1. **Screenshot dos Logs** (EasyPanel → Logs → últimas 50 linhas)
2. **Status do Container** (Running/Stopped/Failed?)
3. **Variáveis de ambiente** (screenshot, pode ocultar o token)
4. **Último build** (Sucesso ou falha?)

Com essas informações, posso diagnosticar exatamente qual é o problema!

---

## 🔗 Links Úteis

- [EasyPanel Docs - Troubleshooting](https://easypanel.io/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Próximo passo**: Vamos resolver isso juntos! Me mande as informações acima. 🚀
