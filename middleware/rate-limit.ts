import { type NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

// Configuração do Redis (usando Upstash Redis, que é compatível com Edge Runtime)
// Nota: Você precisará criar uma conta no Upstash e adicionar as credenciais como variáveis de ambiente
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch (error) {
  console.error("Erro ao conectar ao Redis:", error)
}

// Configurações de rate limiting
const RATE_LIMIT_REQUESTS = 10 // Número máximo de requisições
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // Janela de tempo (1 minuto)

export async function rateLimiter(req: NextRequest) {
  // Se o Redis não estiver configurado, pular o rate limiting
  if (!redis) {
    console.warn("Redis não configurado. Rate limiting desativado.")
    return null
  }

  // Obter o IP do cliente
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"

  // Criar uma chave única para o IP
  const key = `rate-limit:${ip}`

  // Obter o número atual de requisições
  let currentRequests = (await redis.get(key)) as number | null

  // Se não houver registro, inicializar com 0
  if (currentRequests === null) {
    currentRequests = 0
  }

  // Verificar se o limite foi excedido
  if (currentRequests >= RATE_LIMIT_REQUESTS) {
    return NextResponse.json(
      {
        error: "Limite de requisições excedido",
        message:
          "Você fez muitas requisições em um curto período. Por favor, aguarde um momento antes de tentar novamente.",
      },
      { status: 429 },
    )
  }

  // Incrementar o contador
  await redis.set(key, currentRequests + 1, { ex: Math.floor(RATE_LIMIT_WINDOW_MS / 1000) })

  return null
}
