# Plano de Integração: MarkItDown → CorretorIA

**Data**: 2025-11-14
**Objetivo**: Permitir que usuários enviem documentos (PDF, DOCX, XLSX, etc.) para correção, além de texto plano
**Versão**: 1.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura Proposta](#arquitetura-proposta)
3. [Fase 1: Backend - API de Conversão](#fase-1-backend---api-de-conversão)
4. [Fase 2: Integração com Endpoints Existentes](#fase-2-integração-com-endpoints-existentes)
5. [Fase 3: Frontend - Upload de Arquivos](#fase-3-frontend---upload-de-arquivos)
6. [Fase 4: Limites e Planos](#fase-4-limites-e-planos)
7. [Fase 5: Monitoramento e Otimização](#fase-5-monitoramento-e-otimização)
8. [Cronograma](#cronograma)
9. [Riscos e Mitigações](#riscos-e-mitigações)

---

## Visão Geral

### Problema Atual
- CorretorIA aceita apenas **texto plano** (input manual ou paste)
- Usuários com documentos precisam copiar/colar manualmente
- Perda de formatação e estrutura durante o processo
- Não suporta imagens, tabelas, gráficos

### Solução Proposta
Integrar **MarkItDown** para:
1. Converter documentos (PDF, DOCX, XLSX, PPTX) para Markdown
2. Preservar estrutura (headings, listas, tabelas, links)
3. Processar texto extraído pelos endpoints de correção/reescrita
4. Retornar resultado com estrutura original preservada

### Benefícios

| Stakeholder | Benefício |
|-------------|-----------|
| **Usuários Free** | Upload de 1 documento/dia (PDF, DOCX) até 5 páginas |
| **Usuários Premium** | Upload ilimitado, todos os formatos, até 100 páginas |
| **CorretorIA** | Diferencial competitivo, maior taxa de conversão para Premium |
| **SEO/UX** | Melhor experiência, menos fricção no uso |

### Stack Técnico

| Componente | Tecnologia | Função |
|------------|-----------|--------|
| **Conversão** | MarkItDown (Python) | PDF/DOCX/XLSX → Markdown |
| **API Backend** | Next.js API Routes | Upload + validação |
| **Worker** | Cloudflare Workers (futuro) | Processamento assíncrono |
| **Storage** | Vercel Blob Storage | Armazenamento temporário de uploads |
| **Frontend** | React + react-dropzone | UI de upload |
| **Database** | Supabase | Tracking de uploads por usuário |

---

## Arquitetura Proposta

### Fluxo Completo

```
1. Usuário faz upload do documento
   ↓
2. Frontend → POST /api/upload
   - Valida tipo de arquivo (MIME)
   - Valida tamanho
   - Checa limite diário (Supabase)
   ↓
3. Next.js API Route
   - Salva em Vercel Blob (temporário)
   - Extrai metadados (páginas, tamanho)
   - Retorna uploadId + metadata
   ↓
4. Frontend → POST /api/convert
   - uploadId
   - targetFormat: "markdown" | "text"
   ↓
5. Next.js API Route
   - Busca arquivo do Blob
   - Executa MarkItDown (subprocess ou API)
   - Retorna texto convertido
   ↓
6. Frontend → POST /api/correct
   - text: texto convertido
   - originalFormat: "pdf" | "docx" | etc.
   - preserveStructure: true
   ↓
7. Cloudflare Worker
   - Processa correção normalmente
   - Retorna correctedText em Markdown
   ↓
8. Frontend
   - Exibe correção com estrutura preservada
   - Opção de download em formato original
```

### Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────────────────┐     │
│  │ FileUploadZone  │  │ TextCorrectionForm       │     │
│  │ (react-dropzone)│  │ (text + document modes)  │     │
│  └────────┬────────┘  └──────────────────────────┘     │
│           │                                              │
└───────────┼──────────────────────────────────────────────┘
            │
            ↓ POST /api/upload (multipart/form-data)
┌───────────┴──────────────────────────────────────────────┐
│              NEXT.JS API ROUTES                          │
├──────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ /api/upload  │→ │ /api/convert │→ │ /api/correct  │  │
│  │ (file save)  │  │ (MarkItDown) │  │ (existing)    │  │
│  └──────┬───────┘  └──────┬──────┘  └───────┬───────┘  │
│         │                  │                  │          │
│         ↓                  ↓                  ↓          │
│  ┌─────────────────────────────────────────────────┐    │
│  │         SHARED MODULES                          │    │
│  │  - file-validator.ts (MIME, size, pages)        │    │
│  │  - markitdown-client.ts (Python subprocess)     │    │
│  │  - document-tracker.ts (Supabase usage)         │    │
│  └─────────────────────────────────────────────────┘    │
└───────────┬──────────────────────────────────────────────┘
            │
            ↓
┌───────────┴──────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                        │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Vercel Blob     │  │ MarkItDown   │  │ Supabase   │  │
│  │ (temp storage)  │  │ (Python CLI) │  │ (tracking) │  │
│  └─────────────────┘  └──────────────┘  └────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Fase 1: Backend - API de Conversão

### 1.1 Instalar MarkItDown

**Objetivo**: Ter MarkItDown disponível no ambiente de produção

#### Opção A: Como Dependência Python (Recomendado)

```bash
# No diretório do projeto
cd /Users/fabioff30/Documents/CorretorIA\ Stage

# Criar ambiente Python isolado
python3 -m venv .venv
source .venv/bin/activate

# Instalar MarkItDown com todas as dependências
pip install 'markitdown[all]'

# Congelar versões
pip freeze > requirements-markitdown.txt
```

**Vantagens**:
- ✅ Controle de versão
- ✅ Deploy simples (requirements.txt)
- ✅ Funciona em Vercel com Python runtime

**Desvantagens**:
- ⚠️ Aumenta tamanho do bundle
- ⚠️ Cold start mais lento

#### Opção B: Como Worker Separado (Escalável)

```bash
# Criar novo Cloudflare Worker para conversão
# workers-api/src/convert.ts

import { spawn } from 'child_process'

export async function convertDocument(file: ArrayBuffer, format: string) {
  // Executa MarkItDown em container Docker
  const result = await fetch('http://markitdown-service:3000/convert', {
    method: 'POST',
    body: file,
    headers: { 'Content-Type': 'application/octet-stream' }
  })

  return await result.text()
}
```

**Vantagens**:
- ✅ Isolamento de recursos
- ✅ Escalabilidade independente
- ✅ Não afeta Next.js bundle

**Desvantagens**:
- ⚠️ Mais complexo
- ⚠️ Requer infraestrutura adicional

**Decisão**: Começar com **Opção A** (dependência Python), migrar para **Opção B** se houver problemas de performance.

### 1.2 Criar API /api/upload

**Arquivo**: `/app/api/upload/route.ts`

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"
import { canUserUploadDocument, incrementDocumentUsage } from "@/utils/document-limits"
import { validateDocument } from "@/lib/api/document-validator"

export const maxDuration = 60
export const dynamic = "force-dynamic"

// Max file sizes
const FREE_MAX_FILE_SIZE = 5 * 1024 * 1024      // 5MB
const PREMIUM_MAX_FILE_SIZE = 50 * 1024 * 1024  // 50MB

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // 1. Autenticação
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user || !profile) {
      return NextResponse.json(
        {
          error: "Não autorizado",
          message: "Faça login para fazer upload de documentos"
        },
        { status: 401 }
      )
    }

    const isPremium = profile.plan_type === "pro" || profile.plan_type === "admin"

    // 2. Verificar limites diários
    if (!isPremium) {
      const limitCheck = await canUserUploadDocument(user.id)

      if (!limitCheck.allowed) {
        return NextResponse.json(
          {
            error: "Limite diário excedido",
            message: limitCheck.reason,
            details: [
              `Limite: ${limitCheck.limit} documentos por dia`,
              "Faça upgrade para Premium para uploads ilimitados"
            ]
          },
          { status: 429 }
        )
      }
    }

    // 3. Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }

    // 4. Validar arquivo
    const maxSize = isPremium ? PREMIUM_MAX_FILE_SIZE : FREE_MAX_FILE_SIZE
    const validation = await validateDocument(file, {
      maxSize,
      allowedFormats: isPremium
        ? ["pdf", "docx", "xlsx", "pptx", "txt", "html"]
        : ["pdf", "docx", "txt"],
      maxPages: isPremium ? 100 : 5
    })

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Arquivo inválido",
          message: validation.error,
          details: validation.details
        },
        { status: 400 }
      )
    }

    // 5. Upload para Vercel Blob (temporário)
    const blob = await put(`uploads/${user.id}/${requestId}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN
    })

    // 6. Incrementar usage (free users)
    if (!isPremium) {
      await incrementDocumentUsage(user.id)
    }

    // 7. Log sucesso
    console.log(`Upload successful: ${blob.url}`, requestId)

    // 8. Retornar metadata
    return NextResponse.json({
      uploadId: requestId,
      blobUrl: blob.url,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      estimatedPages: validation.metadata.pages,
      estimatedCharacters: validation.metadata.estimatedChars
    })

  } catch (error) {
    console.error("Upload error:", error, requestId)

    return NextResponse.json(
      {
        error: "Erro no upload",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}
```

### 1.3 Criar API /api/convert

**Arquivo**: `/app/api/convert/route.ts`

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { getCurrentUserWithProfile } from "@/utils/auth-helpers"
import { convertDocumentToMarkdown } from "@/lib/markitdown/client"

export const maxDuration = 120 // Conversão pode demorar

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    // 1. Autenticação
    const { user, profile } = await getCurrentUserWithProfile()

    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // 2. Parse request
    const { uploadId, blobUrl, targetFormat = "markdown" } = await request.json()

    if (!blobUrl) {
      return NextResponse.json(
        { error: "blobUrl é obrigatório" },
        { status: 400 }
      )
    }

    // 3. Download do Blob
    console.log(`Downloading file from blob: ${blobUrl}`, requestId)
    const fileResponse = await fetch(blobUrl)

    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`)
    }

    const fileBuffer = await fileResponse.arrayBuffer()

    // 4. Converter com MarkItDown
    console.log(`Converting document (${fileBuffer.byteLength} bytes)`, requestId)

    const conversionResult = await convertDocumentToMarkdown(
      Buffer.from(fileBuffer),
      {
        fileUrl: blobUrl,
        requestId
      }
    )

    // 5. Cleanup: Deletar blob temporário
    try {
      await del(blobUrl)
      console.log(`Deleted temporary blob: ${blobUrl}`, requestId)
    } catch (delError) {
      console.warn(`Failed to delete blob: ${delError}`, requestId)
      // Não falha a requisição por isso
    }

    // 6. Log sucesso
    const processingTime = Date.now() - startTime
    console.log(`Conversion completed in ${processingTime}ms`, requestId)

    // 7. Retornar resultado
    return NextResponse.json({
      markdown: conversionResult.markdown,
      plainText: conversionResult.plainText,
      metadata: {
        pages: conversionResult.pages,
        characters: conversionResult.markdown.length,
        words: conversionResult.markdown.split(/\s+/).length,
        format: conversionResult.detectedFormat
      },
      processingTime
    })

  } catch (error) {
    console.error("Conversion error:", error, requestId)

    return NextResponse.json(
      {
        error: "Erro na conversão",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        details: ["Tente novamente ou use outro formato"]
      },
      { status: 500 }
    )
  }
}
```

### 1.4 Criar MarkItDown Client

**Arquivo**: `/lib/markitdown/client.ts`

```typescript
import { spawn } from "child_process"
import { writeFile, unlink } from "fs/promises"
import path from "path"
import os from "os"

interface ConversionOptions {
  fileUrl?: string
  requestId?: string
  keepDataUris?: boolean
}

interface ConversionResult {
  markdown: string
  plainText: string
  pages: number
  detectedFormat: string
}

/**
 * Converte documento para Markdown usando MarkItDown CLI
 */
export async function convertDocumentToMarkdown(
  fileBuffer: Buffer,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const { requestId = "unknown", keepDataUris = false } = options

  // 1. Salvar buffer em arquivo temporário
  const tempDir = os.tmpdir()
  const tempFileName = `markitdown-${requestId}-${Date.now()}`
  const tempFilePath = path.join(tempDir, tempFileName)

  try {
    await writeFile(tempFilePath, fileBuffer)
    console.log(`Temp file created: ${tempFilePath}`, requestId)

    // 2. Executar MarkItDown CLI
    const args = [tempFilePath]
    if (keepDataUris) {
      args.push("--keep-data-uris")
    }

    const markdown = await executeMarkItDown(args, requestId)

    // 3. Gerar plain text (remove markdown syntax)
    const plainText = markdownToPlainText(markdown)

    // 4. Detectar formato e metadados
    const detectedFormat = detectFormatFromMarkdown(markdown)
    const pages = estimatePages(plainText)

    return {
      markdown,
      plainText,
      pages,
      detectedFormat
    }

  } finally {
    // 5. Cleanup: Deletar arquivo temporário
    try {
      await unlink(tempFilePath)
      console.log(`Temp file deleted: ${tempFilePath}`, requestId)
    } catch (err) {
      console.warn(`Failed to delete temp file: ${err}`, requestId)
    }
  }
}

/**
 * Executa MarkItDown CLI e retorna stdout
 */
function executeMarkItDown(args: string[], requestId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn("markitdown", args, {
      env: { ...process.env, PYTHONIOENCODING: "utf-8" }
    })

    let stdout = ""
    let stderr = ""

    process.stdout.on("data", (data) => {
      stdout += data.toString()
    })

    process.stderr.on("data", (data) => {
      stderr += data.toString()
    })

    process.on("close", (code) => {
      if (code === 0) {
        console.log(`MarkItDown completed successfully`, requestId)
        resolve(stdout)
      } else {
        console.error(`MarkItDown failed with code ${code}:`, stderr, requestId)
        reject(new Error(`MarkItDown conversion failed: ${stderr}`))
      }
    })

    process.on("error", (error) => {
      console.error(`MarkItDown spawn error:`, error, requestId)
      reject(new Error(`Failed to spawn markitdown: ${error.message}`))
    })

    // Timeout de 2 minutos
    setTimeout(() => {
      process.kill()
      reject(new Error("MarkItDown conversion timed out after 2 minutes"))
    }, 120000)
  })
}

/**
 * Converte Markdown para texto plano
 */
function markdownToPlainText(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    // Remove links [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove code blocks
    .replace(/```[^`]*```/g, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Normalize whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Detecta formato original do documento baseado em padrões no Markdown
 */
function detectFormatFromMarkdown(markdown: string): string {
  // Excel: tabelas com pipes
  if (markdown.includes("|") && markdown.match(/\|.*\|.*\|/)) {
    return "xlsx"
  }

  // PowerPoint: múltiplos slides/seções
  if (markdown.match(/^---$/m)) {
    return "pptx"
  }

  // HTML: links e estrutura web
  if (markdown.match(/\[.*\]\(http/)) {
    return "html"
  }

  // Word/PDF: texto estruturado padrão
  return "docx/pdf"
}

/**
 * Estima número de páginas baseado em caracteres
 * Assumindo ~2000 caracteres por página (padrão A4)
 */
function estimatePages(text: string): number {
  const CHARS_PER_PAGE = 2000
  return Math.ceil(text.length / CHARS_PER_PAGE)
}
```

### 1.5 Criar Validador de Documentos

**Arquivo**: `/lib/api/document-validator.ts`

```typescript
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

interface ValidationOptions {
  maxSize: number
  allowedFormats: string[]
  maxPages?: number
}

interface ValidationResult {
  valid: boolean
  error?: string
  details?: string[]
  metadata: {
    pages: number
    estimatedChars: number
  }
}

const MIME_TO_FORMAT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/html": "html",
  "application/msword": "doc",
  "application/vnd.ms-excel": "xls"
}

/**
 * Valida documento antes do upload
 */
export async function validateDocument(
  file: File,
  options: ValidationOptions
): Promise<ValidationResult> {
  const format = MIME_TO_FORMAT[file.type]

  // 1. Validar tipo de arquivo
  if (!format) {
    return {
      valid: false,
      error: "Formato de arquivo não suportado",
      details: [
        `Tipo MIME: ${file.type}`,
        `Formatos permitidos: ${options.allowedFormats.join(", ")}`
      ],
      metadata: { pages: 0, estimatedChars: 0 }
    }
  }

  if (!options.allowedFormats.includes(format)) {
    return {
      valid: false,
      error: `Formato .${format} não permitido para seu plano`,
      details: [
        `Formatos permitidos: ${options.allowedFormats.join(", ")}`,
        "Faça upgrade para Premium para mais formatos"
      ],
      metadata: { pages: 0, estimatedChars: 0 }
    }
  }

  // 2. Validar tamanho
  if (file.size > options.maxSize) {
    const maxMB = (options.maxSize / (1024 * 1024)).toFixed(1)
    const actualMB = (file.size / (1024 * 1024)).toFixed(1)

    return {
      valid: false,
      error: "Arquivo muito grande",
      details: [
        `Tamanho: ${actualMB} MB`,
        `Limite: ${maxMB} MB`,
        "Faça upgrade para Premium para arquivos maiores"
      ],
      metadata: { pages: 0, estimatedChars: 0 }
    }
  }

  // 3. Validar número de páginas (se aplicável)
  let pages = 0
  let estimatedChars = 0

  if (format === "pdf") {
    try {
      const buffer = await file.arrayBuffer()
      pages = await countPdfPages(Buffer.from(buffer))
      estimatedChars = pages * 2000 // Estimativa: 2000 chars/página
    } catch (error) {
      console.warn("Failed to count PDF pages:", error)
      // Não falha validação, apenas usa estimativa
      pages = Math.ceil(file.size / 50000) // ~50KB por página
      estimatedChars = pages * 2000
    }
  } else {
    // Estimativa genérica para outros formatos
    estimatedChars = Math.floor(file.size * 0.8) // 80% do tamanho é texto
    pages = Math.ceil(estimatedChars / 2000)
  }

  if (options.maxPages && pages > options.maxPages) {
    return {
      valid: false,
      error: "Documento muito longo",
      details: [
        `Páginas: ${pages}`,
        `Limite: ${options.maxPages} páginas`,
        "Faça upgrade para Premium para documentos maiores"
      ],
      metadata: { pages, estimatedChars }
    }
  }

  // 4. Validação passou
  return {
    valid: true,
    metadata: { pages, estimatedChars }
  }
}

/**
 * Conta páginas de um PDF usando pdfinfo (se disponível)
 */
async function countPdfPages(buffer: Buffer): Promise<number> {
  try {
    // Tenta usar pdfinfo (mais rápido)
    const { stdout } = await execAsync("pdfinfo -", {
      input: buffer,
      maxBuffer: 1024 * 1024 // 1MB
    })

    const match = stdout.match(/Pages:\s+(\d+)/)
    if (match) {
      return parseInt(match[1], 10)
    }
  } catch (error) {
    // Fallback: contar ocorrências de "/Type /Page" no PDF
    const pdfText = buffer.toString("binary")
    const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g)
    if (pageMatches) {
      return pageMatches.length
    }
  }

  // Última estimativa
  return Math.ceil(buffer.length / 50000)
}
```

### 1.6 Criar Tracking de Uploads (Supabase)

**Arquivo**: `/utils/document-limits.ts`

```typescript
import { createClient } from "@/utils/supabase/server"

interface LimitCheckResult {
  allowed: boolean
  remaining: number
  limit: number
  reason?: string
}

/**
 * Verifica se usuário pode fazer upload de documento
 */
export async function canUserUploadDocument(userId: string): Promise<LimitCheckResult> {
  const supabase = await createClient()

  // 1. Buscar limite configurado para o plano do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_type")
    .eq("id", userId)
    .single()

  if (!profile) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      reason: "Perfil não encontrado"
    }
  }

  // Premium/Admin: sem limites
  if (profile.plan_type === "pro" || profile.plan_type === "admin") {
    return {
      allowed: true,
      remaining: -1, // Ilimitado
      limit: -1
    }
  }

  // 2. Buscar limite para plano free
  const { data: limitConfig } = await supabase
    .from("plan_limits_config")
    .select("documents_per_day")
    .eq("plan_type", "free")
    .single()

  const dailyLimit = limitConfig?.documents_per_day ?? 1

  // 3. Contar uploads de hoje
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from("document_uploads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())

  if (error) {
    console.error("Error checking document limits:", error)
    return {
      allowed: false,
      remaining: 0,
      limit: dailyLimit,
      reason: "Erro ao verificar limites"
    }
  }

  const used = count ?? 0
  const remaining = Math.max(0, dailyLimit - used)

  return {
    allowed: remaining > 0,
    remaining,
    limit: dailyLimit,
    reason: remaining === 0 ? "Limite diário de uploads atingido" : undefined
  }
}

/**
 * Incrementa contador de uploads do usuário
 */
export async function incrementDocumentUsage(userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("document_uploads")
    .insert({
      user_id: userId,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error("Error incrementing document usage:", error)
    throw new Error("Failed to track document upload")
  }
}
```

**Migration Supabase**:

```sql
-- Criar tabela para tracking de uploads
CREATE TABLE IF NOT EXISTS document_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT,
  file_size BIGINT,
  file_format TEXT,
  pages INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para queries de limite diário
CREATE INDEX idx_document_uploads_user_date
  ON document_uploads(user_id, created_at DESC);

-- Adicionar coluna em plan_limits_config
ALTER TABLE plan_limits_config
  ADD COLUMN IF NOT EXISTS documents_per_day INTEGER DEFAULT 1;

-- Configurar limites
UPDATE plan_limits_config
  SET documents_per_day = 1
  WHERE plan_type = 'free';

UPDATE plan_limits_config
  SET documents_per_day = -1
  WHERE plan_type IN ('pro', 'admin');

-- RLS policies
ALTER TABLE document_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploads"
  ON document_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON document_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cleanup automático (uploads > 7 dias)
CREATE OR REPLACE FUNCTION cleanup_old_document_uploads()
RETURNS void AS $$
BEGIN
  DELETE FROM document_uploads
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Fase 2: Integração com Endpoints Existentes

### 2.1 Modificar /api/correct para Aceitar Documentos

**Arquivo**: `/app/api/correct/route.ts` (modificações)

```typescript
// Adicionar ao início do POST handler

const { body: requestBody, error: parseError } = await parseRequestBody(request, requestId)
if (parseError) return parseError

// NOVO: Suporte a documentos
let text = requestBody.text
let originalFormat = requestBody.originalFormat // "pdf", "docx", etc.
let preserveStructure = requestBody.preserveStructure ?? false

// Se veio de upload de documento
if (requestBody.uploadId && requestBody.blobUrl) {
  console.log(`Processing document upload: ${requestBody.uploadId}`, requestId)

  // Converter documento primeiro
  const conversionResponse = await fetch(
    `${request.url.replace('/correct', '/convert')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadId: requestBody.uploadId,
        blobUrl: requestBody.blobUrl,
        targetFormat: preserveStructure ? 'markdown' : 'text'
      })
    }
  )

  if (!conversionResponse.ok) {
    return NextResponse.json(
      {
        error: "Falha na conversão do documento",
        message: "Não foi possível converter o documento"
      },
      { status: 500 }
    )
  }

  const conversion = await conversionResponse.json()
  text = preserveStructure ? conversion.markdown : conversion.plainText
  originalFormat = conversion.metadata.format

  console.log(`Document converted: ${text.length} chars`, requestId)
}

// Continua com o fluxo normal de correção...
```

### 2.2 Modificar Response para Incluir Formato

```typescript
// No final do POST handler, modificar response

const apiResponse = NextResponse.json({
  correctedText: normalized.text,
  evaluation: processedEvaluation,
  correctionId,

  // NOVO: Metadata do documento
  documentMetadata: originalFormat ? {
    originalFormat,
    preservedStructure: preserveStructure,
    processingType: "document"
  } : undefined
})
```

### 2.3 Modificar /api/rewrite Similarmente

Mesma lógica de aceitar `uploadId`, `blobUrl`, `preserveStructure`.

---

## Fase 3: Frontend - Upload de Arquivos

### 3.1 Instalar Dependências

```bash
pnpm add react-dropzone
pnpm add @types/react-dropzone -D
```

### 3.2 Criar Componente FileUploadZone

**Arquivo**: `/components/text-correction/FileUploadZone.tsx`

```typescript
"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, File, X, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface FileUploadZoneProps {
  onFileConverted: (text: string, metadata: any) => void
  maxSize?: number
  allowedFormats?: string[]
  isPremium?: boolean
}

export function FileUploadZone({
  onFileConverted,
  maxSize = 5 * 1024 * 1024, // 5MB default
  allowedFormats = ["pdf", "docx", "txt"],
  isPremium = false
}: FileUploadZoneProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [converting, setConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setError(null)
    setUploadedFile(file)
    setUploading(true)
    setProgress(0)

    try {
      // 1. Upload
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData
      })

      setProgress(50)

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.message || "Upload falhou")
      }

      const uploadData = await uploadResponse.json()
      setUploading(false)
      setConverting(true)
      setProgress(60)

      // 2. Converter
      const convertResponse = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: uploadData.uploadId,
          blobUrl: uploadData.blobUrl,
          targetFormat: "markdown"
        })
      })

      setProgress(90)

      if (!convertResponse.ok) {
        const error = await convertResponse.json()
        throw new Error(error.message || "Conversão falhou")
      }

      const conversionData = await convertResponse.json()
      setProgress(100)

      // 3. Notificar parent component
      onFileConverted(conversionData.plainText, {
        fileName: file.name,
        originalFormat: conversionData.metadata.format,
        pages: conversionData.metadata.pages,
        uploadId: uploadData.uploadId
      })

      setConverting(false)

    } catch (err) {
      console.error("Upload/conversion error:", err)
      setError(err instanceof Error ? err.message : "Erro desconhecido")
      setUploading(false)
      setConverting(false)
      setUploadedFile(null)
    }
  }, [onFileConverted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      ...(isPremium && {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"]
      })
    },
    maxSize,
    multiple: false,
    disabled: uploading || converting
  })

  const removeFile = () => {
    setUploadedFile(null)
    setError(null)
    setProgress(0)
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8
            transition-colors cursor-pointer
            ${isDragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary/50"
            }
            ${(uploading || converting) && "opacity-50 cursor-not-allowed"}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Upload className="w-12 h-12 text-gray-400" />

            <div>
              <p className="text-lg font-medium">
                {isDragActive
                  ? "Solte o arquivo aqui"
                  : "Arraste um arquivo ou clique para selecionar"
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isPremium
                  ? `PDF, DOCX, XLSX, PPTX, TXT (até ${(maxSize / (1024 * 1024)).toFixed(0)}MB)`
                  : `PDF, DOCX, TXT (até ${(maxSize / (1024 * 1024)).toFixed(0)}MB)`
                }
              </p>
            </div>

            {!isPremium && (
              <p className="text-xs text-amber-600">
                📄 Limite: 1 documento/dia • Faça upgrade para mais
              </p>
            )}
          </div>
        </div>
      )}

      {/* Arquivo carregado */}
      {uploadedFile && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            {!uploading && !converting && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Progress */}
          {(uploading || converting) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-600">
                {uploading && "Fazendo upload..."}
                {converting && "Convertendo documento..."}
              </p>
            </div>
          )}

          {/* Sucesso */}
          {progress === 100 && !error && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                Documento convertido com sucesso!
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

### 3.3 Integrar com TextCorrectionForm

**Arquivo**: `/components/text-correction/text-correction-form.tsx` (modificações)

```typescript
// Adicionar import
import { FileUploadZone } from "./FileUploadZone"

// Adicionar estados
const [inputMode, setInputMode] = useState<"text" | "document">("text")
const [documentMetadata, setDocumentMetadata] = useState<any>(null)

// Adicionar handler
const handleFileConverted = (text: string, metadata: any) => {
  setText(text)
  setDocumentMetadata(metadata)

  // Scroll para o textarea
  textareaRef.current?.scrollIntoView({ behavior: "smooth" })
}

// Adicionar UI para toggle de modo
<div className="flex gap-2 mb-4">
  <Button
    variant={inputMode === "text" ? "default" : "outline"}
    onClick={() => setInputMode("text")}
  >
    ✏️ Texto
  </Button>
  <Button
    variant={inputMode === "document" ? "default" : "outline"}
    onClick={() => setInputMode("document")}
  >
    📄 Documento
  </Button>
</div>

{inputMode === "document" && (
  <FileUploadZone
    onFileConverted={handleFileConverted}
    maxSize={isPremium ? 50 * 1024 * 1024 : 5 * 1024 * 1024}
    isPremium={isPremium}
  />
)}

{inputMode === "text" && (
  <Textarea
    ref={textareaRef}
    value={text}
    onChange={(e) => setText(e.target.value)}
    // ... resto das props
  />
)}

{documentMetadata && (
  <div className="text-sm text-gray-600 mt-2">
    📄 {documentMetadata.fileName} • {documentMetadata.pages} páginas
  </div>
)}
```

---

## Fase 4: Limites e Planos

### 4.1 Definir Limites por Plano

| Feature | Free | Premium/Admin |
|---------|------|---------------|
| **Uploads/dia** | 1 | Ilimitado |
| **Tamanho máx** | 5 MB | 50 MB |
| **Páginas máx** | 5 | 100 |
| **Formatos** | PDF, DOCX, TXT | PDF, DOCX, XLSX, PPTX, TXT, HTML |
| **Preservar estrutura** | ❌ Não | ✅ Sim (Markdown) |
| **Histórico de uploads** | 7 dias | 30 dias |

### 4.2 Adicionar Paywall para Recursos Premium

**Componente**: `/components/premium/DocumentUpgradePrompt.tsx`

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Crown } from "lucide-react"
import Link from "next/link"

export function DocumentUpgradePrompt() {
  return (
    <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-start gap-4">
        <Crown className="w-8 h-8 text-amber-600 flex-shrink-0" />

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">
            Desbloqueie Upload Ilimitado de Documentos
          </h3>

          <ul className="space-y-1 text-sm text-gray-700 mb-4">
            <li>✅ Upload ilimitado de documentos por dia</li>
            <li>✅ Arquivos até 50MB (vs 5MB no plano gratuito)</li>
            <li>✅ Todos os formatos: PDF, DOCX, XLSX, PPTX, TXT, HTML</li>
            <li>✅ Até 100 páginas por documento (vs 5 páginas)</li>
            <li>✅ Preserva estrutura original (Markdown)</li>
            <li>✅ Histórico de uploads por 30 dias</li>
          </ul>

          <Link href="/premium">
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Crown className="w-4 h-4 mr-2" />
              Fazer Upgrade Agora
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
```

---

## Fase 5: Monitoramento e Otimização

### 5.1 Logging e Analytics

```typescript
// lib/analytics/document-tracking.ts

export async function trackDocumentConversion({
  userId,
  format,
  sizeBytes,
  pages,
  conversionTimeMs,
  success
}: {
  userId: string
  format: string
  sizeBytes: number
  pages: number
  conversionTimeMs: number
  success: boolean
}) {
  // Log no console (desenvolvimento)
  console.log("Document Conversion:", {
    userId,
    format,
    sizeMB: (sizeBytes / (1024 * 1024)).toFixed(2),
    pages,
    conversionTimeSec: (conversionTimeMs / 1000).toFixed(2),
    success
  })

  // Enviar para analytics (produção)
  if (process.env.NODE_ENV === "production") {
    // Google Analytics 4
    window.gtag?.("event", "document_conversion", {
      event_category: "document",
      event_label: format,
      value: pages,
      conversion_time: conversionTimeMs,
      success: success ? 1 : 0
    })

    // Supabase tracking
    const supabase = await createClient()
    await supabase.from("document_conversions_analytics").insert({
      user_id: userId,
      format,
      size_bytes: sizeBytes,
      pages,
      conversion_time_ms: conversionTimeMs,
      success,
      created_at: new Date().toISOString()
    })
  }
}
```

### 5.2 Otimizações de Performance

#### Opção A: Cache de Conversões

```typescript
// lib/cache/conversion-cache.ts

import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

/**
 * Cache de conversões (chave: hash do arquivo)
 */
export async function getCachedConversion(fileHash: string) {
  return await redis.get(`conversion:${fileHash}`)
}

export async function setCachedConversion(
  fileHash: string,
  result: any,
  ttl = 3600 // 1 hora
) {
  await redis.set(`conversion:${fileHash}`, result, { ex: ttl })
}
```

#### Opção B: Worker Assíncrono (Futuro)

```typescript
// Cloudflare Worker para conversão
// workers-api/src/convert-document.ts

export async function handleDocumentConversion(request: Request) {
  // 1. Recebe arquivo
  const file = await request.arrayBuffer()

  // 2. Enfileira job
  const jobId = crypto.randomUUID()
  await env.CONVERSION_QUEUE.send({
    jobId,
    file: Array.from(new Uint8Array(file)),
    format: request.headers.get("X-File-Format")
  })

  // 3. Retorna jobId imediatamente
  return new Response(JSON.stringify({ jobId }), {
    headers: { "Content-Type": "application/json" }
  })
}

// Frontend faz polling de /api/conversion-status/:jobId
```

### 5.3 Métricas para Monitorar

| Métrica | Target | Alerta |
|---------|--------|--------|
| **Taxa de sucesso de conversão** | > 95% | < 90% |
| **Tempo médio de conversão** | < 10s | > 30s |
| **Uploads/dia (total)** | - | Monitorar crescimento |
| **Uploads/dia (premium)** | - | Comparar com free |
| **Taxa de conversão Free → Premium** | > 2% | < 1% |
| **Formatos mais usados** | - | Priorizar otimizações |
| **Erros de validação** | < 5% | > 10% |

---

## Cronograma

### Sprint 1 (Semana 1-2): Backend Básico
- ✅ Instalar MarkItDown
- ✅ Criar /api/upload
- ✅ Criar /api/convert
- ✅ Implementar validação
- ✅ Criar migration Supabase
- ✅ Testes básicos

**Entregável**: API funcional para upload + conversão

### Sprint 2 (Semana 3-4): Frontend
- ✅ Criar FileUploadZone
- ✅ Integrar com TextCorrectionForm
- ✅ Adicionar toggle texto/documento
- ✅ Implementar feedback visual
- ✅ Testes de usabilidade

**Entregável**: UI completa para upload

### Sprint 3 (Semana 5): Integração e Limites
- ✅ Modificar /api/correct
- ✅ Modificar /api/rewrite
- ✅ Implementar limites por plano
- ✅ Adicionar paywall para premium
- ✅ Testes end-to-end

**Entregável**: Feature completa integrada

### Sprint 4 (Semana 6): Polimento e Launch
- ✅ Analytics e tracking
- ✅ Otimizações de performance
- ✅ Documentação de usuário
- ✅ Testes de carga
- ✅ Deploy para produção

**Entregável**: Feature em produção

---

## Riscos e Mitigações

### Risco 1: MarkItDown Lento em Produção

**Probabilidade**: Média
**Impacto**: Alto

**Mitigação**:
- Implementar timeout de 2 minutos
- Adicionar cache de conversões
- Considerar worker assíncrono para arquivos grandes
- Mostrar progresso para o usuário

### Risco 2: Vercel Blob Storage Caro

**Probabilidade**: Baixa
**Impacto**: Médio

**Mitigação**:
- Cleanup automático após conversão (delete imediato)
- Limite de 7 dias para uploads não processados
- Monitorar custos semanalmente
- Alternativa: Supabase Storage (mais barato)

### Risco 3: Dependência Python em Vercel

**Probabilidade**: Média
**Impacto**: Alto

**Mitigação**:
- Testar deploy cedo (Sprint 1)
- Documentar requirements.txt corretamente
- Plano B: Container Docker separado
- Plano C: Cloudflare Worker com WASM

### Risco 4: Qualidade de Conversão Variável

**Probabilidade**: Alta
**Impacto**: Médio

**Mitigação**:
- Testar com documentos reais antes do launch
- Adicionar opção de "modo simples" (apenas texto)
- Feedback form para reportar problemas de conversão
- Iterar baseado em feedback de usuários

### Risco 5: Usuários Abusarem de Limites Free

**Probabilidade**: Média
**Impacto**: Baixo

**Mitigação**:
- Rate limiting robusto (Redis)
- Captcha para uploads (futuro)
- Monitorar padrões de abuso
- Banir IPs/usuários abusivos

---

## Próximos Passos Imediatos

### 1. Validação Técnica (Esta Semana)

- [ ] Testar MarkItDown localmente com documentos reais
- [ ] Medir tempo de conversão (PDF, DOCX, XLSX)
- [ ] Validar deploy em Vercel com Python
- [ ] Confirmar limites de tamanho viáveis

### 2. Decisões de Arquitetura (Próxima Semana)

- [ ] Escolher: Subprocess Python vs Worker separado
- [ ] Escolher: Vercel Blob vs Supabase Storage
- [ ] Definir: Processamento síncrono vs assíncrono
- [ ] Validar: Custos de infraestrutura

### 3. Prototipação (Semana 3)

- [ ] Implementar MVP de /api/upload + /api/convert
- [ ] Criar componente FileUploadZone básico
- [ ] Testar com 5-10 usuários beta
- [ ] Coletar feedback e iterar

---

## Conclusão

Este plano transforma o CorretorIA de um **corretor de texto plano** em uma **ferramenta de processamento de documentos completa**, diferenciando-se da concorrência e aumentando o valor do plano Premium.

**Estimativa Total**: 6 semanas (com 1 desenvolvedor)

**ROI Esperado**:
- ↑ Conversão Free → Premium: +3-5%
- ↑ Retenção de usuários Premium: +10%
- ↑ Diferenciação competitiva: Alta

**Próximo Passo**: Aprovar plano e iniciar Sprint 1 (Backend Básico).

---

**Gerado em**: 2025-11-14
**Autor**: Claude Code
**Versão**: 1.0
