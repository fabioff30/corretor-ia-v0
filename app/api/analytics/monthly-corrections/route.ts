/**
 * API Route para buscar contagem de correções do mês atual
 *
 * GET /api/analytics/monthly-corrections
 *
 * Retorna o número total de eventos "text_corrected" registrados
 * no Google Analytics 4 no mês atual.
 */

import { NextResponse } from 'next/server';
import { getMonthlyCorrectionsCount } from '@/lib/google-analytics/analytics-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache por 1 hora

/**
 * GET /api/analytics/monthly-corrections
 *
 * Retorna a contagem de correções do mês
 */
export async function GET() {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json(
        {
          error: 'GA4_PROPERTY_ID não configurado',
          message: 'Configure a variável de ambiente GA4_PROPERTY_ID com o ID da propriedade do Google Analytics',
        },
        { status: 500 }
      );
    }

    // Buscar contagem de correções
    const count = await getMonthlyCorrectionsCount(propertyId);

    return NextResponse.json(
      {
        count,
        period: 'current_month',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Erro ao buscar contagem de correções:', error);

    // Retornar erro genérico sem expor detalhes internos
    return NextResponse.json(
      {
        error: 'Erro ao buscar dados do Google Analytics',
        message: 'Não foi possível obter a contagem de correções. Tente novamente mais tarde.',
      },
      { status: 500 }
    );
  }
}
