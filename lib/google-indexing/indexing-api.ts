/**
 * Google Indexing API Client
 *
 * Permite submeter URLs para indexação no Google de forma programática.
 * Limite: 200 URLs/dia (pode solicitar aumento de quota)
 *
 * Documentação: https://developers.google.com/search/apis/indexing-api/v3/using-api
 */

import { getGoogleCredentials } from "@/lib/google-analytics/credentials"
import { SignJWT, importPKCS8 } from "jose"

const INDEXING_API_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish"
const BATCH_ENDPOINT = "https://indexing.googleapis.com/batch"
const SCOPES = ["https://www.googleapis.com/auth/indexing"]

export type IndexingAction = "URL_UPDATED" | "URL_DELETED"

export interface IndexingResult {
  url: string
  success: boolean
  error?: string
  latestUpdate?: {
    url: string
    type: string
    notifyTime: string
  }
}

export interface BatchIndexingResult {
  total: number
  successful: number
  failed: number
  results: IndexingResult[]
}

/**
 * Gera um access token JWT para autenticar com a API
 */
async function getAccessToken(): Promise<string> {
  const credentials = await getGoogleCredentials()

  const now = Math.floor(Date.now() / 1000)
  const privateKey = await importPKCS8(credentials.private_key, "RS256")

  const jwt = await new SignJWT({
    scope: SCOPES.join(" "),
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(credentials.client_email)
    .setSubject(credentials.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey)

  // Trocar JWT por access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

/**
 * Submete uma única URL para indexação
 */
export async function submitUrlForIndexing(
  url: string,
  action: IndexingAction = "URL_UPDATED"
): Promise<IndexingResult> {
  try {
    const accessToken = await getAccessToken()

    const response = await fetch(INDEXING_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url,
        type: action,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        url,
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      url,
      success: true,
      latestUpdate: data.urlNotificationMetadata?.latestUpdate,
    }
  } catch (error) {
    return {
      url,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Submete múltiplas URLs em batch (até 100 por requisição)
 * Usa o endpoint de batch do Google para eficiência
 */
export async function submitUrlsInBatch(
  urls: string[],
  action: IndexingAction = "URL_UPDATED"
): Promise<BatchIndexingResult> {
  const results: IndexingResult[] = []
  const accessToken = await getAccessToken()

  // Dividir em chunks de 100 (limite do batch)
  const chunks = chunkArray(urls, 100)

  for (const chunk of chunks) {
    const batchResults = await processBatch(chunk, action, accessToken)
    results.push(...batchResults)
  }

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return {
    total: urls.length,
    successful,
    failed,
    results,
  }
}

/**
 * Processa um batch de até 100 URLs
 */
async function processBatch(
  urls: string[],
  action: IndexingAction,
  accessToken: string
): Promise<IndexingResult[]> {
  const boundary = `batch_${Date.now()}`

  // Construir o corpo multipart
  const parts = urls.map((url, index) => {
    return [
      `--${boundary}`,
      "Content-Type: application/http",
      `Content-ID: <item${index}>`,
      "",
      "POST /v3/urlNotifications:publish HTTP/1.1",
      "Content-Type: application/json",
      "",
      JSON.stringify({ url, type: action }),
    ].join("\r\n")
  })

  const body = parts.join("\r\n") + `\r\n--${boundary}--`

  try {
    const response = await fetch(BATCH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/mixed; boundary=${boundary}`,
        Authorization: `Bearer ${accessToken}`,
      },
      body,
    })

    if (!response.ok) {
      // Se batch falhar, tentar individualmente
      console.warn("Batch request failed, falling back to individual requests")
      return Promise.all(
        urls.map(url => submitUrlForIndexing(url, action))
      )
    }

    // Parse batch response
    const responseText = await response.text()
    return parseBatchResponse(responseText, urls)
  } catch (error) {
    // Fallback para requisições individuais
    console.error("Batch error:", error)
    return Promise.all(
      urls.map(url => submitUrlForIndexing(url, action))
    )
  }
}

/**
 * Parse da resposta multipart do batch
 */
function parseBatchResponse(responseText: string, urls: string[]): IndexingResult[] {
  const results: IndexingResult[] = []

  // Regex simples para extrair status de cada parte
  const parts = responseText.split(/--batch_/)

  urls.forEach((url, index) => {
    const part = parts[index + 1] // +1 porque a primeira parte é vazia

    if (part && part.includes("200 OK")) {
      results.push({
        url,
        success: true,
      })
    } else if (part) {
      const errorMatch = part.match(/"message"\s*:\s*"([^"]+)"/)
      results.push({
        url,
        success: false,
        error: errorMatch?.[1] || "Unknown error in batch response",
      })
    } else {
      results.push({
        url,
        success: false,
        error: "No response for URL in batch",
      })
    }
  })

  return results
}

/**
 * Divide array em chunks de tamanho específico
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Busca todas as URLs do blog para indexação
 */
export async function getBlogUrlsForIndexing(): Promise<string[]> {
  const { getPosts } = await import("@/utils/wordpress-api")
  const baseUrl = "https://www.corretordetextoonline.com.br"

  try {
    const { posts } = await getPosts(1, 100)
    return posts.map(post => `${baseUrl}/blog/${post.slug}`)
  } catch (error) {
    console.error("Error fetching blog URLs:", error)
    return []
  }
}

/**
 * Verifica o status de indexação de uma URL
 */
export async function getUrlIndexingStatus(url: string): Promise<{
  url: string
  lastUpdate?: string
  error?: string
}> {
  try {
    const accessToken = await getAccessToken()

    const response = await fetch(
      `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(url)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return {
        url,
        error: error.error?.message || `HTTP ${response.status}`,
      }
    }

    const data = await response.json()
    return {
      url,
      lastUpdate: data.latestUpdate?.notifyTime,
    }
  } catch (error) {
    return {
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
