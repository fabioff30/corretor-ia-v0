import { Redis } from "@upstash/redis"

// Chaves para armazenar as estatísticas no Redis
const TOTAL_RATINGS_KEY = "correction:total_ratings"
const SUM_RATINGS_KEY = "correction:sum_ratings"
const RATINGS_COUNT_KEY = "correction:ratings_count"

// Inicializar o cliente Redis
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

/**
 * Adiciona uma nova avaliação e atualiza as estatísticas
 */
export async function addRating(rating: number): Promise<boolean> {
  if (!redis) {
    console.warn("Redis não configurado. Não foi possível salvar a avaliação.")
    return false
  }

  try {
    // Validar a avaliação
    if (rating < 1 || rating > 5) {
      throw new Error("Avaliação inválida. Deve ser entre 1 e 5.")
    }

    // Atualizar as estatísticas em uma transação
    await redis
      .pipeline()
      .incr(TOTAL_RATINGS_KEY)
      .incrby(SUM_RATINGS_KEY, rating)
      .hincrby(RATINGS_COUNT_KEY, rating.toString(), 1)
      .exec()

    return true
  } catch (error) {
    console.error("Erro ao adicionar avaliação:", error)
    return false
  }
}

/**
 * Obtém as estatísticas de avaliação
 */
export async function getRatingStats(): Promise<{
  averageRating: number
  totalRatings: number
  ratingCounts: Record<string, number>
}> {
  if (!redis) {
    console.warn("Redis não configurado. Retornando estatísticas vazias.")
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingCounts: {},
    }
  }

  try {
    // Buscar as estatísticas em paralelo
    const [totalRatings, sumRatings, ratingCounts] = await Promise.all([
      redis.get<number>(TOTAL_RATINGS_KEY) || 0,
      redis.get<number>(SUM_RATINGS_KEY) || 0,
      redis.hgetall<Record<string, number>>(RATINGS_COUNT_KEY) || {},
    ])

    // Calcular a média
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0

    return {
      averageRating: Number.parseFloat(averageRating.toFixed(1)),
      totalRatings,
      ratingCounts,
    }
  } catch (error) {
    console.error("Erro ao obter estatísticas de avaliação:", error)
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingCounts: {},
    }
  }
}
