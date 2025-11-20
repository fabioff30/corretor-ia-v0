# 🚀 Deploy Rápido - MarkItDown API Corrigida

**Problema identificado**: ❌ Código original usava subprocess CLI que falhava
**Solução**: ✅ Código corrigido usa biblioteca Python diretamente

---

## ⚡ Passos Rápidos (10 minutos)

### 1️⃣ Atualizar Repositório Git (5 min)

**Se você já tem o repositório Git**:

```bash
# Navegar para o repo
cd /caminho/para/markitdown-api

# Copiar arquivos corrigidos da pasta markitdown-api-fixed/
# Os arquivos estão em: /Users/fabioff30/Documents/CorretorIA Stage/markitdown-api-fixed/

# Substituir app.py
cp /Users/fabioff30/Documents/CorretorIA\ Stage/markitdown-api-fixed/app.py ./app.py

# Substituir Dockerfile
cp /Users/fabioff30/Documents/CorretorIA\ Stage/markitdown-api-fixed/Dockerfile ./Dockerfile

# requirements.txt pode manter (é igual)

# Commit
git add .
git commit -m "Fix: Use MarkItDown library directly instead of CLI subprocess"

# Push
git push
```

**Se NÃO tem repositório ainda**:

```bash
# Criar novo repo
mkdir markitdown-api
cd markitdown-api

# Copiar arquivos corrigidos
cp /Users/fabioff30/Documents/CorretorIA\ Stage/markitdown-api-fixed/* .

# Inicializar Git
git init
git add .
git commit -m "Initial commit: MarkItDown API (fixed version)"

# Conectar ao GitHub/GitLab
git remote add origin https://github.com/seu-usuario/markitdown-api.git
git branch -M main
git push -u origin main
```

### 2️⃣ Redeploy no EasyPanel (3 min)

1. **Acessar EasyPanel**: https://seu-easypanel.com

2. **Ir para a aplicação**:
   - Click em `markitdown-api` (ou nome que você deu)

3. **Forçar rebuild**:
   - Menu lateral → **Settings**
   - Scroll até "Redeploy"
   - ✅ **IMPORTANTE**: Marcar checkbox "**Force Rebuild**"
   - Click "**Redeploy**"

4. **Aguardar build**:
   - Menu lateral → **Logs** → Tab "**Build Logs**"
   - Aguardar ~5-10 minutos
   - Procurar mensagem: `Successfully built`

### 3️⃣ Verificar se Funcionou (2 min)

**Logs de Runtime**:

EasyPanel → **Logs** → Tab "**Runtime Logs**"

**✅ Deve aparecer isto**:
```
[STARTUP] Starting MarkItDown API on port 8000
[STARTUP] Max file size: 50.0MB
[STARTUP] CORS origins: ['*']
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**❌ Se aparecer erro**:
- Copie o erro completo e me envie

**Testar no terminal**:
```bash
curl https://markitdown-markitdown.3j5ljv.easypanel.host/health
```

**✅ Resposta esperada**:
```json
{
  "status": "healthy",
  "version": "1.0.1",
  "uptime_seconds": 123
}
```

---

## 🧪 Teste Completo (Opcional)

```bash
# 1. Baixar PDF de teste
curl -o test.pdf https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf

# 2. Converter
curl -X POST https://markitdown-markitdown.3j5ljv.easypanel.host/convert \
  -H "Authorization: Bearer 5vi2Y+LzHqYxMmU+/wSQJfex6VnQvEIKunsFMzER4eY=" \
  -F "file=@test.pdf"

# 3. Se funcionar, vai retornar JSON com:
# "success": true
# "markdown": "conteúdo do PDF..."
```

---

## 📋 Checklist Final

- [ ] Código atualizado no repositório Git
- [ ] Push feito com sucesso
- [ ] Redeploy no EasyPanel com "Force Rebuild" marcado
- [ ] Build completou com sucesso (sem erros)
- [ ] Logs mostram "Uvicorn running on http://0.0.0.0:8000"
- [ ] `/health` retorna 200 OK
- [ ] Teste de conversão funciona

---

## ❓ Se Algo Der Errado

### Problema 1: Build falha

**Logs mostram erro durante build**

**Solução**:
1. Verificar se todos os arquivos foram commitados
2. Ver logs de build completos
3. Me enviar o erro

### Problema 2: Container para logo após iniciar

**Logs mostram "Killed" ou container reinicia**

**Solução**:
- EasyPanel → Settings → Resources → Aumentar RAM para 4GB

### Problema 3: "Service is not reachable" ainda

**Mesmo após redeploy**

**Solução**:
1. Verificar se Status está "Running" (verde)
2. Copiar logs completos (últimas 50 linhas)
3. Me enviar para análise

---

## 🎯 Próximo Passo

**Depois que a API estiver funcionando**:

Vamos integrar com o Next.js! Vou criar:
- `/lib/markitdown/vps-client.ts` (cliente HTTP)
- Modificar `/api/convert/route.ts` (usar VPS)
- Testar end-to-end

**Me avise quando terminar o deploy e a API estiver respondendo!** 🚀

---

**Tempo estimado total**: 10-15 minutos
**Dificuldade**: Fácil (só copiar arquivos e clicar em redeploy)
