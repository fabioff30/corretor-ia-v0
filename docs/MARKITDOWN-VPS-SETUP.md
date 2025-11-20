# Guia: Instalação MarkItDown na VPS com EasyPanel

**Data**: 2025-11-14
**Objetivo**: Configurar MarkItDown como serviço HTTP na VPS para processar documentos
**Plataforma**: EasyPanel (Docker-based)

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Pré-requisitos](#pré-requisitos)
3. [Fase 1: Criar a Aplicação MarkItDown](#fase-1-criar-a-aplicação-markitdown)
4. [Fase 2: Configurar no EasyPanel](#fase-2-configurar-no-easypanel)
5. [Fase 3: Segurança e Autenticação](#fase-3-segurança-e-autenticação)
6. [Fase 4: Testar a API](#fase-4-testar-a-api)
7. [Fase 5: Integrar com Next.js](#fase-5-integrar-com-nextjs)
8. [Monitoramento e Manutenção](#monitoramento-e-manutenção)
9. [Troubleshooting](#troubleshooting)

---

## Visão Geral da Arquitetura

### Antes (Arquitetura Original)
```
Next.js API Routes
    ↓ subprocess
MarkItDown (local Python)
    ↓
Conversão no servidor Vercel
```

### Depois (Nova Arquitetura com VPS)
```
Next.js API Routes
    ↓ HTTP POST
MarkItDown API (VPS)
    ↓ Docker Container
    ↓ Python + FastAPI
Conversão na VPS
    ↓ HTTP Response
Next.js recebe resultado
```

### Benefícios da VPS

| Aspecto | Benefício |
|---------|-----------|
| **Performance** | Servidor dedicado, sem cold starts |
| **Recursos** | Controle total de CPU/RAM |
| **Custo** | Sem custos variáveis de serverless |
| **Escalabilidade** | Fácil upgrade de recursos |
| **Flexibilidade** | Controle total do ambiente |

---

## Pré-requisitos

### 1. Acesso à VPS

- ✅ VPS com EasyPanel instalado e funcionando
- ✅ Acesso SSH à VPS (para troubleshooting)
- ✅ Domínio ou subdomínio configurado (ex: `markitdown.seudominio.com`)

### 2. Recursos Mínimos Recomendados

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| **RAM** | 2 GB | 4 GB |
| **CPU** | 1 vCore | 2 vCores |
| **Disco** | 10 GB | 20 GB |
| **Rede** | 100 Mbps | 1 Gbps |

### 3. Conhecimentos Necessários

- Básico de Docker
- Noções de REST APIs
- Uso do EasyPanel (interface web)

---

## Fase 1: Criar a Aplicação MarkItDown

### 1.1 Estrutura de Arquivos

Vamos criar uma aplicação FastAPI que expõe o MarkItDown via HTTP.

**Estrutura do projeto**:
```
markitdown-api/
├── Dockerfile
├── docker-compose.yml (opcional, EasyPanel gerencia)
├── requirements.txt
├── app.py
├── .env.example
└── README.md
```

### 1.2 Criar `app.py` (FastAPI)

```python
#!/usr/bin/env python3
"""
MarkItDown HTTP API
Converte documentos para Markdown via HTTP
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import tempfile
import hashlib
import time
from typing import Optional
from markitdown import MarkItDown
import uvicorn

# Configuração
API_TOKEN = os.getenv("API_TOKEN", "change-me-in-production")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 52428800))  # 50MB default
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

# Inicializar FastAPI
app = FastAPI(
    title="MarkItDown API",
    description="HTTP API for document to Markdown conversion",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# MarkItDown instance
md_converter = MarkItDown()

# Models
class ConversionResponse(BaseModel):
    success: bool
    markdown: Optional[str] = None
    plain_text: Optional[str] = None
    metadata: dict
    processing_time_ms: int
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: int


# Globals
start_time = time.time()


# Middleware de autenticação
def verify_token(authorization: str = Header(None)):
    """Verifica token de autenticação"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.replace("Bearer ", "")

    if token != API_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid API token")

    return token


# Routes
@app.get("/", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "uptime_seconds": int(time.time() - start_time)
    }


@app.get("/health", response_model=HealthResponse)
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "uptime_seconds": int(time.time() - start_time)
    }


@app.post("/convert", response_model=ConversionResponse)
async def convert_document(
    file: UploadFile = File(...),
    keep_data_uris: bool = False,
    token: str = Header(None, alias="Authorization")
):
    """
    Converte documento para Markdown

    Args:
        file: Arquivo para conversão (PDF, DOCX, XLSX, etc.)
        keep_data_uris: Manter data URIs para imagens (default: False)
        token: Bearer token para autenticação

    Returns:
        JSON com markdown, texto plano e metadados
    """
    start = time.time()
    temp_path = None

    try:
        # Autenticação
        verify_token(token)

        # Validar tamanho
        content = await file.read()
        file_size = len(content)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {MAX_FILE_SIZE / 1024 / 1024:.1f}MB"
            )

        if file_size == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        # Salvar em arquivo temporário
        suffix = os.path.splitext(file.filename)[1] if file.filename else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            temp_path = tmp.name

        # Converter
        result = md_converter.convert(temp_path)

        if not result or not result.text_content:
            raise HTTPException(
                status_code=500,
                detail="Conversion failed: empty result"
            )

        # Processar resultado
        markdown = result.text_content

        # Plain text (remove markdown syntax)
        plain_text = markdown_to_plain_text(markdown)

        # Metadados
        metadata = {
            "file_name": file.filename,
            "file_size_bytes": file_size,
            "file_type": file.content_type,
            "characters": len(markdown),
            "words": len(markdown.split()),
            "estimated_pages": estimate_pages(plain_text),
            "detected_format": detect_format(markdown)
        }

        processing_time = int((time.time() - start) * 1000)

        return {
            "success": True,
            "markdown": markdown,
            "plain_text": plain_text,
            "metadata": metadata,
            "processing_time_ms": processing_time
        }

    except HTTPException:
        raise

    except Exception as e:
        processing_time = int((time.time() - start) * 1000)

        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "markdown": None,
                "plain_text": None,
                "metadata": {},
                "processing_time_ms": processing_time,
                "error": str(e)
            }
        )

    finally:
        # Cleanup
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass


# Utility functions
def markdown_to_plain_text(markdown: str) -> str:
    """Remove markdown syntax"""
    import re

    text = markdown

    # Remove headers
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)

    # Remove bold/italic
    text = re.sub(r'[*_]{1,2}([^*_]+)[*_]{1,2}', r'\1', text)

    # Remove links [text](url) -> text
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)

    # Remove images
    text = re.sub(r'!\[([^\]]*)\]\([^)]+\)', '', text)

    # Remove code blocks
    text = re.sub(r'```[^`]*```', '', text, flags=re.DOTALL)

    # Remove inline code
    text = re.sub(r'`([^`]+)`', r'\1', text)

    # Normalize whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()


def estimate_pages(text: str) -> int:
    """Estimate number of pages (2000 chars per page)"""
    CHARS_PER_PAGE = 2000
    return max(1, len(text) // CHARS_PER_PAGE)


def detect_format(markdown: str) -> str:
    """Detect original format from markdown patterns"""
    if '|' in markdown and markdown.count('|') > 10:
        return "spreadsheet"
    elif '---' in markdown:
        return "presentation"
    elif '[' in markdown and '](' in markdown:
        return "html"
    else:
        return "document"


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### 1.3 Criar `requirements.txt`

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6
markitdown[all]==0.1.0
python-dotenv==1.0.0
```

### 1.4 Criar `Dockerfile`

```dockerfile
FROM python:3.11-slim

# Metadados
LABEL maintainer="CorretorIA <contato@corretordetextoonline.com.br>"
LABEL description="MarkItDown HTTP API for document conversion"

# Argumentos de build
ARG PORT=8000

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV PORT=${PORT}
ENV DEBIAN_FRONTEND=noninteractive

# Instalar dependências do sistema para MarkItDown
RUN apt-get update && apt-get install -y \
    # Para PDFs
    poppler-utils \
    # Para imagens
    tesseract-ocr \
    tesseract-ocr-por \
    # Para áudio (opcional)
    ffmpeg \
    # Utilitários
    curl \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar requirements primeiro (cache de layers)
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY app.py .

# Criar usuário não-root
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expor porta
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Comando de inicialização
CMD ["python", "app.py"]
```

### 1.5 Criar `.env.example`

```bash
# API Configuration
PORT=8000
API_TOKEN=your-secure-token-here-min-32-chars

# Limits
MAX_FILE_SIZE=52428800  # 50MB in bytes

# CORS
ALLOWED_ORIGINS=https://corretordetextoonline.com.br,https://www.corretordetextoonline.com.br

# Optional: Azure Document Intelligence (para PDFs complexos)
# AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com
# AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key
```

### 1.6 Criar `README.md`

```markdown
# MarkItDown HTTP API

HTTP API for converting documents to Markdown using Microsoft's MarkItDown.

## Features

- Convert PDF, DOCX, XLSX, PPTX, HTML to Markdown
- REST API with FastAPI
- Token-based authentication
- Docker containerized
- Health checks
- CORS support

## Supported Formats

- PDF (.pdf)
- Word (.docx, .doc)
- Excel (.xlsx, .xls)
- PowerPoint (.pptx, .ppt)
- HTML (.html, .htm)
- Plain text (.txt)
- Images (.jpg, .png) - with OCR
- And more...

## API Endpoints

### GET /
Health check

### POST /convert
Convert document to Markdown

**Headers:**
```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: multipart/form-data
```

**Body:**
- `file`: Document file (required)
- `keep_data_uris`: Boolean (optional, default: false)

**Response:**
```json
{
  "success": true,
  "markdown": "# Document content...",
  "plain_text": "Document content...",
  "metadata": {
    "file_name": "document.pdf",
    "file_size_bytes": 123456,
    "characters": 5000,
    "words": 800,
    "estimated_pages": 3
  },
  "processing_time_ms": 1234
}
```

## Environment Variables

- `PORT`: Server port (default: 8000)
- `API_TOKEN`: Authentication token (required)
- `MAX_FILE_SIZE`: Max file size in bytes (default: 50MB)
- `ALLOWED_ORIGINS`: CORS allowed origins (comma-separated)

## Docker Build

```bash
docker build -t markitdown-api:latest .
```

## Docker Run

```bash
docker run -d \
  -p 8000:8000 \
  -e API_TOKEN="your-secure-token" \
  -e ALLOWED_ORIGINS="https://yourdomain.com" \
  --name markitdown-api \
  markitdown-api:latest
```

## Test

```bash
curl -X POST http://localhost:8000/convert \
  -H "Authorization: Bearer your-token" \
  -F "file=@document.pdf"
```
```

---

## Fase 2: Configurar no EasyPanel

### 2.1 Preparar Repositório Git (Opção A - Recomendado)

1. **Criar repositório no GitHub/GitLab**:
   ```bash
   # No seu computador local
   mkdir markitdown-api
   cd markitdown-api

   # Copiar arquivos criados acima
   # (app.py, Dockerfile, requirements.txt, etc.)

   # Inicializar git
   git init
   git add .
   git commit -m "Initial commit: MarkItDown API"

   # Adicionar remote (GitHub ou GitLab)
   git remote add origin https://github.com/seu-usuario/markitdown-api.git
   git push -u origin main
   ```

2. **Vantagens do Git**:
   - ✅ CI/CD automático
   - ✅ Versionamento
   - ✅ Rollback fácil
   - ✅ EasyPanel atualiza automaticamente

### 2.2 Deploy via GitHub/GitLab no EasyPanel

1. **Acessar EasyPanel**:
   - Abra o painel: `https://seu-easypanel-domain.com`
   - Faça login

2. **Criar Nova Aplicação**:
   - Clique em "**Create**" → "**App**"
   - Nome: `markitdown-api`
   - Tipo: **Git** (recomendado) ou **Docker Image**

3. **Conectar ao Repositório Git**:
   - **Source**: GitHub/GitLab
   - **Repository**: `seu-usuario/markitdown-api`
   - **Branch**: `main`
   - **Build Method**: Dockerfile
   - **Dockerfile Path**: `./Dockerfile`

4. **Configurar Variáveis de Ambiente**:

   Clique em "**Environment**" e adicione:

   | Key | Value | Tipo |
   |-----|-------|------|
   | `PORT` | `8000` | Text |
   | `API_TOKEN` | `[gerar token seguro]` | Secret |
   | `MAX_FILE_SIZE` | `52428800` | Text |
   | `ALLOWED_ORIGINS` | `https://corretordetextoonline.com.br` | Text |

   **Gerar token seguro**:
   ```bash
   # No seu terminal
   openssl rand -base64 32
   # Ou
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

5. **Configurar Domínio**:
   - Clique em "**Domains**"
   - Adicionar domínio: `markitdown.seudominio.com`
   - **SSL**: Ativar (Let's Encrypt automático)

6. **Configurar Recursos**:
   - **CPU**: 1 vCore (mínimo), 2 vCores (recomendado)
   - **RAM**: 2 GB (mínimo), 4 GB (recomendado)
   - **Disk**: 10 GB

7. **Deploy**:
   - Clique em "**Deploy**"
   - Aguarde o build (pode levar 5-10 minutos na primeira vez)
   - Verifique logs em "**Logs**"

### 2.3 Deploy via Docker Image (Opção B - Alternativa)

Se preferir não usar Git:

1. **Build local**:
   ```bash
   docker build -t seu-usuario/markitdown-api:latest .
   docker push seu-usuario/markitdown-api:latest
   ```

2. **No EasyPanel**:
   - Criar App → **Docker Image**
   - Image: `seu-usuario/markitdown-api:latest`
   - Configurar env vars e domínio (mesmo do passo 2.2)

---

## Fase 3: Segurança e Autenticação

### 3.1 Gerar e Armazenar Tokens

**Gerar token forte**:
```bash
# Opção 1: OpenSSL
openssl rand -hex 32

# Opção 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Opção 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemplo de token**:
```
7f3a8d9c2b1e4f6a8d9c2b1e4f6a8d9c2b1e4f6a8d9c2b1e4f6a8d9c2b1e
```

**Armazenar no EasyPanel**:
- Environment Variables → `API_TOKEN` → **Secret** ✅
- ⚠️ NUNCA commitar no Git!

### 3.2 Configurar CORS Corretamente

No `.env` do EasyPanel:
```bash
ALLOWED_ORIGINS=https://corretordetextoonline.com.br,https://www.corretordetextoonline.com.br
```

Para desenvolvimento local, adicionar temporariamente:
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://corretordetextoonline.com.br
```

### 3.3 Rate Limiting (Opcional mas Recomendado)

Adicionar ao `app.py`:

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Após criar o app FastAPI
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Modificar rota /convert
@app.post("/convert", response_model=ConversionResponse)
@limiter.limit("10/minute")  # 10 requisições por minuto por IP
async def convert_document(...):
    # ... código existente
```

Adicionar ao `requirements.txt`:
```txt
slowapi==0.1.9
```

### 3.4 Firewall (EasyPanel)

Se EasyPanel tiver firewall configurável:
- Permitir apenas porta `443` (HTTPS)
- Bloquear acesso direto à porta `8000`
- Usar proxy reverso do EasyPanel (automático)

---

## Fase 4: Testar a API

### 4.1 Teste de Health Check

```bash
# Teste básico
curl https://markitdown.seudominio.com/health

# Resposta esperada:
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 123
}
```

### 4.2 Teste de Conversão (PDF)

```bash
# Baixar um PDF de teste
curl -o test.pdf https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf

# Enviar para conversão
curl -X POST https://markitdown.seudominio.com/convert \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@test.pdf" \
  | jq .

# Resposta esperada:
{
  "success": true,
  "markdown": "# Dummy PDF file\n\nThis is a test PDF...",
  "plain_text": "Dummy PDF file\nThis is a test PDF...",
  "metadata": {
    "file_name": "test.pdf",
    "file_size_bytes": 13264,
    "characters": 234,
    "words": 45,
    "estimated_pages": 1
  },
  "processing_time_ms": 1234
}
```

### 4.3 Teste de Conversão (DOCX)

```bash
# Com um arquivo .docx local
curl -X POST https://markitdown.seudominio.com/convert \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -F "file=@documento.docx" \
  -o resultado.json

# Ver resultado
cat resultado.json | jq .markdown
```

### 4.4 Testes de Erro

**Token inválido**:
```bash
curl -X POST https://markitdown.seudominio.com/convert \
  -H "Authorization: Bearer token-errado" \
  -F "file=@test.pdf"

# Resposta esperada: 403 Forbidden
```

**Arquivo muito grande**:
```bash
# Criar arquivo de 100MB
dd if=/dev/zero of=huge.pdf bs=1M count=100

curl -X POST https://markitdown.seudominio.com/convert \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "file=@huge.pdf"

# Resposta esperada: 413 Payload Too Large
```

### 4.5 Script de Teste Completo

```bash
#!/bin/bash
# test-markitdown-api.sh

API_URL="https://markitdown.seudominio.com"
API_TOKEN="seu-token-aqui"

echo "=== Testing MarkItDown API ==="

# 1. Health check
echo -e "\n1. Health Check..."
curl -s "$API_URL/health" | jq .

# 2. Convert PDF
echo -e "\n2. Converting PDF..."
curl -X POST "$API_URL/convert" \
  -H "Authorization: Bearer $API_TOKEN" \
  -F "file=@test.pdf" \
  -s | jq '.success, .metadata'

# 3. Test auth
echo -e "\n3. Testing authentication..."
curl -X POST "$API_URL/convert" \
  -H "Authorization: Bearer invalid-token" \
  -F "file=@test.pdf" \
  -s -w "\nHTTP Status: %{http_code}\n"

echo -e "\n=== Tests Complete ==="
```

---

## Fase 5: Integrar com Next.js

### 5.1 Criar Cliente API

**Arquivo**: `/lib/markitdown/vps-client.ts`

```typescript
/**
 * Cliente para MarkItDown API na VPS
 */

interface ConversionOptions {
  fileBuffer: Buffer
  fileName?: string
  keepDataUris?: boolean
  requestId?: string
}

interface ConversionResult {
  success: boolean
  markdown: string
  plainText: string
  metadata: {
    fileName: string
    fileSize: number
    characters: number
    words: number
    estimatedPages: number
    detectedFormat: string
  }
  processingTime: number
  error?: string
}

const MARKITDOWN_API_URL = process.env.MARKITDOWN_API_URL || "https://markitdown.seudominio.com"
const MARKITDOWN_API_TOKEN = process.env.MARKITDOWN_API_TOKEN || ""

/**
 * Converte documento usando API na VPS
 */
export async function convertDocumentViaVPS(
  options: ConversionOptions
): Promise<ConversionResult> {
  const { fileBuffer, fileName = "document", keepDataUris = false, requestId = "unknown" } = options

  try {
    console.log(`[VPS] Converting document: ${fileName} (${fileBuffer.length} bytes)`, requestId)

    // Preparar FormData
    const formData = new FormData()
    const blob = new Blob([fileBuffer])
    formData.append("file", blob, fileName)

    if (keepDataUris) {
      formData.append("keep_data_uris", "true")
    }

    // Fazer requisição
    const response = await fetch(`${MARKITDOWN_API_URL}/convert`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MARKITDOWN_API_TOKEN}`
      },
      body: formData
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(`VPS API error (${response.status}): ${error.error || error.detail}`)
    }

    const data = await response.json()

    console.log(`[VPS] Conversion successful: ${data.processing_time_ms}ms`, requestId)

    return {
      success: data.success,
      markdown: data.markdown || "",
      plainText: data.plain_text || "",
      metadata: {
        fileName: data.metadata.file_name || fileName,
        fileSize: data.metadata.file_size_bytes || fileBuffer.length,
        characters: data.metadata.characters || 0,
        words: data.metadata.words || 0,
        estimatedPages: data.metadata.estimated_pages || 1,
        detectedFormat: data.metadata.detected_format || "unknown"
      },
      processingTime: data.processing_time_ms || 0,
      error: data.error
    }

  } catch (error) {
    console.error(`[VPS] Conversion failed:`, error, requestId)

    throw new Error(
      `Failed to convert document via VPS: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Verifica saúde da API
 */
export async function checkVPSHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MARKITDOWN_API_URL}/health`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MARKITDOWN_API_TOKEN}`
      }
    })

    return response.ok
  } catch {
    return false
  }
}
```

### 5.2 Atualizar `.env.local`

```bash
# MarkItDown VPS API
MARKITDOWN_API_URL=https://markitdown.seudominio.com
MARKITDOWN_API_TOKEN=seu-token-gerado-aqui
```

### 5.3 Modificar `/api/convert/route.ts`

```typescript
import { convertDocumentViaVPS } from "@/lib/markitdown/vps-client"

// Na função POST, substituir:
// const conversionResult = await convertDocumentToMarkdown(...)

// Por:
const conversionResult = await convertDocumentViaVPS({
  fileBuffer: Buffer.from(fileBuffer),
  fileName: blobUrl.split("/").pop() || "document",
  requestId
})
```

### 5.4 Fallback Strategy

```typescript
// lib/markitdown/client.ts (modificado)

export async function convertDocument(
  fileBuffer: Buffer,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  // Tentar VPS primeiro
  try {
    return await convertDocumentViaVPS({ fileBuffer, ...options })
  } catch (vpsError) {
    console.warn("VPS conversion failed, falling back to local:", vpsError)

    // Fallback para conversão local (se configurado)
    if (process.env.ENABLE_LOCAL_FALLBACK === "true") {
      return await convertDocumentToMarkdown(fileBuffer, options)
    }

    throw vpsError
  }
}
```

---

## Monitoramento e Manutenção

### 6.1 Logs no EasyPanel

**Acessar logs em tempo real**:
1. EasyPanel → `markitdown-api` → **Logs**
2. Filtrar por tipo: `stdout`, `stderr`
3. Buscar por erros: palavras-chave como `ERROR`, `Exception`, `Failed`

**Comandos úteis** (se tiver acesso SSH):
```bash
# Ver logs do container
docker logs -f markitdown-api

# Ver últimas 100 linhas
docker logs --tail 100 markitdown-api

# Filtrar erros
docker logs markitdown-api 2>&1 | grep ERROR
```

### 6.2 Métricas Importantes

| Métrica | Comando/Local | Target |
|---------|---------------|--------|
| **Uptime** | `/health` endpoint | > 99.9% |
| **Response Time** | `processing_time_ms` | < 5000ms (5s) |
| **RAM Usage** | EasyPanel → Metrics | < 80% |
| **CPU Usage** | EasyPanel → Metrics | < 70% |
| **Disk Usage** | EasyPanel → Metrics | < 80% |

### 6.3 Alertas

**Configurar no EasyPanel** (se disponível):
- **CPU > 80%** por 5 minutos → Email/Slack
- **RAM > 90%** → Email/Slack
- **App down** → Email/Slack

### 6.4 Backups

**Backup automático da configuração**:
```bash
# Exportar variáveis de ambiente
echo "API_TOKEN=$API_TOKEN" > .env.backup
echo "ALLOWED_ORIGINS=$ALLOWED_ORIGINS" >> .env.backup

# Commit no Git (sem secrets)
git add .
git commit -m "Update configuration"
git push
```

### 6.5 Atualizações

**Atualizar MarkItDown**:
1. Modificar `requirements.txt`:
   ```txt
   markitdown[all]==0.2.0  # Nova versão
   ```

2. Commit e push:
   ```bash
   git add requirements.txt
   git commit -m "Update MarkItDown to v0.2.0"
   git push
   ```

3. EasyPanel detecta mudança e faz redeploy automático

---

## Troubleshooting

### Problema 1: Build Falha

**Sintoma**: Deploy falha com erro de build

**Solução**:
```bash
# Verificar Dockerfile
docker build -t test . --no-cache

# Ver logs de build no EasyPanel
# Logs → Build Logs

# Verificar requirements.txt
pip install -r requirements.txt
```

### Problema 2: API Retorna 502/504

**Sintoma**: API não responde ou timeout

**Causas comuns**:
- App não iniciou corretamente
- Porta errada
- RAM insuficiente

**Solução**:
```bash
# Verificar se app está rodando
curl -v https://markitdown.seudominio.com/health

# Ver logs
# EasyPanel → Logs

# Aumentar recursos
# EasyPanel → Settings → Resources → Aumentar RAM/CPU
```

### Problema 3: Conversão Muito Lenta

**Sintoma**: `processing_time_ms` > 30000 (30s)

**Soluções**:
1. **Aumentar CPU/RAM** no EasyPanel
2. **Otimizar Dockerfile**:
   ```dockerfile
   # Adicionar antes do CMD
   ENV OMP_NUM_THREADS=2
   ENV OPENBLAS_NUM_THREADS=2
   ```
3. **Limitar tamanho de arquivo**:
   ```bash
   MAX_FILE_SIZE=20971520  # 20MB ao invés de 50MB
   ```

### Problema 4: "Out of Memory"

**Sintoma**: Container reinicia, logs mostram OOM

**Solução**:
1. Aumentar RAM no EasyPanel (mínimo 4GB)
2. Adicionar swap:
   ```bash
   # SSH na VPS
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### Problema 5: SSL Certificate Error

**Sintoma**: HTTPS não funciona

**Solução**:
1. EasyPanel → Domains → Verificar SSL
2. Regenerar certificado Let's Encrypt
3. Aguardar 5 minutos
4. Testar novamente

---

## Próximos Passos

Após concluir a instalação:

1. ✅ **Testar todos os formatos**: PDF, DOCX, XLSX, PPTX
2. ✅ **Medir performance**: Tempo de conversão médio
3. ✅ **Configurar alertas**: Email quando API cair
4. ✅ **Documentar token**: Guardar em 1Password/gerenciador
5. ✅ **Atualizar Next.js**: Integrar cliente VPS
6. ✅ **Testar em produção**: Com tráfego real

---

## Checklist de Instalação

- [ ] VPS com EasyPanel configurada
- [ ] Repositório Git criado
- [ ] Arquivos criados (app.py, Dockerfile, etc.)
- [ ] App criada no EasyPanel
- [ ] Repositório conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Token seguro gerado e armazenado
- [ ] Domínio configurado (markitdown.seudominio.com)
- [ ] SSL ativado (Let's Encrypt)
- [ ] Recursos alocados (2GB RAM, 1 vCore mínimo)
- [ ] Deploy executado com sucesso
- [ ] Health check funcionando (`/health`)
- [ ] Teste de conversão PDF OK
- [ ] Teste de conversão DOCX OK
- [ ] Autenticação validada (Bearer token)
- [ ] CORS configurado corretamente
- [ ] Cliente VPS criado no Next.js
- [ ] `.env.local` atualizado
- [ ] Teste end-to-end Next.js → VPS → Next.js
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

---

**Gerado em**: 2025-11-14
**Versão**: 1.0
**Próxima revisão**: Após primeiro deploy

**Precisa de ajuda?** Abra issue no repositório ou entre em contato.
