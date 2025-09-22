import { getRedisClient } from "./redis-client"

/**
 * Utilitário para limpar dados corrompidos do Redis
 */

const RATINGS_DETAILED_KEY = "correction:ratings_detailed"

export async function cleanupRedisRatings() {
  const redis = getRedisClient()
  
  if (!redis) {
    console.log("Redis não configurado")
    return false
  }

  try {
    // Deletar a lista corrompida
    await redis.del(RATINGS_DETAILED_KEY)
    console.log("Dados de avaliação limpos com sucesso")
    return true
  } catch (error) {
    console.error("Erro ao limpar Redis:", error)
    return false
  }
}

export async function addSampleRatings() {
  const redis = getRedisClient()
  
  if (!redis) {
    console.log("Redis não configurado")
    return false
  }

  const sampleRatings = [
    {
      id: `rating_${Date.now()}_sample1`,
      rating: 5,
      feedback: "Excelente corretor! Muito preciso e rápido.",
      correctionId: "correction_123",
      textLength: 250,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0..."
    },
    {
      id: `rating_${Date.now()}_sample2`,
      rating: 4,
      feedback: "Muito bom, mas poderia ter mais sugestões de estilo.",
      correctionId: "correction_124",
      textLength: 180,
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
      ip: "192.168.1.2",
      userAgent: "Mozilla/5.0..."
    },
    {
      id: `rating_${Date.now()}_sample3`,
      rating: 5,
      feedback: "Perfeito! Encontrou erros que eu não tinha visto.",
      correctionId: "correction_125",
      textLength: 320,
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
      ip: "192.168.1.3",
      userAgent: "Mozilla/5.0..."
    },
    {
      id: `rating_${Date.now()}_sample4`,
      rating: 3,
      feedback: "Bom, mas às vezes sugere mudanças desnecessárias.",
      correctionId: "correction_126",
      textLength: 150,
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
      ip: "192.168.1.4",
      userAgent: "Mozilla/5.0..."
    },
    {
      id: `rating_${Date.now()}_sample5`,
      rating: 5,
      feedback: "Incrível! Salvou meu trabalho acadêmico.",
      correctionId: "correction_127",
      textLength: 1200,
      timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
      ip: "192.168.1.5",
      userAgent: "Mozilla/5.0..."
    }
  ]

  try {
    for (const rating of sampleRatings) {
      await redis.lpush(RATINGS_DETAILED_KEY, JSON.stringify(rating))
    }
    console.log(`${sampleRatings.length} avaliações de exemplo adicionadas com sucesso`)
    return true
  } catch (error) {
    console.error("Erro ao adicionar avaliações de exemplo:", error)
    return false
  }
}