import { getRedisClient, testRedisConnection } from "./redis-client"

// Chave para armazenar as avaliações detalhadas no Redis
const RATINGS_DETAILED_KEY = "correction:ratings_detailed"

/**
 * Interface para os dados de avaliação
 */
export interface RatingData {
  id: string
  rating: number
  feedback?: string
  correctionId?: string
  textLength?: number
  timestamp: string
  ip?: string
  userAgent?: string
}

/**
 * Armazena uma avaliação detalhada no banco de dados
 */
export async function storeRatingDetails(data: Omit<RatingData, "id">): Promise<string | null> {
  const redis = getRedisClient()
  
  if (!redis) {
    console.warn("Redis não configurado. Não foi possível armazenar a avaliação.")
    return null
  }

  try {
    // Gerar um ID único para a avaliação
    const ratingId = `rating_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Criar o objeto completo da avaliação
    const ratingData: RatingData = {
      id: ratingId,
      ...data,
    }

    // Armazenar a avaliação no Redis
    // Usamos LPUSH para adicionar ao início da lista (mais recente primeiro)
    await redis.lpush(RATINGS_DETAILED_KEY, JSON.stringify(ratingData))

    // Opcional: limitar o tamanho da lista para não crescer indefinidamente
    // Manter apenas as últimas 1000 avaliações, por exemplo
    await redis.ltrim(RATINGS_DETAILED_KEY, 0, 999)

    return ratingId
  } catch (error) {
    console.error("Erro ao armazenar avaliação detalhada:", error)
    return null
  }
}

/**
 * Obtém as avaliações detalhadas do banco de dados
 * @param limit Número máximo de avaliações a retornar
 * @param offset Índice a partir do qual começar a retornar avaliações
 */
export async function getRatingDetails(limit = 50, offset = 0): Promise<RatingData[]> {
  const redis = getRedisClient()
  
  if (!redis) {
    console.warn("Redis não configurado. Não foi possível obter as avaliações.")
    return []
  }

  try {
    // Obter as avaliações da lista no Redis
    // LRANGE retorna elementos da lista em um intervalo específico
    const ratings = await redis.lrange(RATINGS_DETAILED_KEY, offset, offset + limit - 1)

    // Converter as strings JSON em objetos
    return ratings.map((rating) => JSON.parse(rating) as RatingData)
  } catch (error) {
    console.error("Erro ao obter avaliações detalhadas:", error)
    return []
  }
}

/**
 * Obtém uma avaliação específica pelo ID
 */
export async function getRatingById(id: string): Promise<RatingData | null> {
  const redis = getRedisClient()
  
  if (!redis) {
    console.warn("Redis não configurado. Não foi possível obter a avaliação.")
    return null
  }

  try {
    // Obter todas as avaliações (isso pode ser ineficiente para listas grandes)
    // Em um sistema de produção, você pode querer usar um índice secundário
    const allRatings = await redis.lrange(RATINGS_DETAILED_KEY, 0, -1)

    // Encontrar a avaliação com o ID correspondente
    const ratingJson = allRatings.find((rating) => {
      try {
        const parsed = JSON.parse(rating)
        return parsed.id === id
      } catch {
        return false
      }
    })

    if (!ratingJson) {
      return null
    }

    return JSON.parse(ratingJson) as RatingData
  } catch (error) {
    console.error("Erro ao obter avaliação por ID:", error)
    return null
  }
}
