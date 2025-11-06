/**
 * Google Analytics Data API - Cliente para buscar eventos e métricas
 *
 * Este módulo fornece funções para consultar dados do Google Analytics 4
 * usando a Google Analytics Data API v1.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getGoogleCredentials } from './credentials';

/**
 * Tipo de resposta da contagem de eventos
 */
export interface EventCount {
  eventName: string;
  count: number;
  period: string;
}

/**
 * Cache do cliente para evitar múltiplas inicializações
 */
let analyticsClient: BetaAnalyticsDataClient | null = null;

/**
 * Inicializa o cliente do Google Analytics Data API
 */
async function getAnalyticsClient(): Promise<BetaAnalyticsDataClient> {
  if (analyticsClient) {
    return analyticsClient;
  }

  try {
    const credentials = await getGoogleCredentials();

    // Criar cliente com credenciais
    analyticsClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      projectId: credentials.project_id,
    });

    return analyticsClient;
  } catch (error) {
    console.error('Erro ao inicializar cliente do Google Analytics:', error);
    throw error;
  }
}

/**
 * Busca a contagem de um evento específico no período atual
 *
 * @param eventName - Nome do evento (ex: "text_corrected")
 * @param propertyId - ID da propriedade do GA4 (ex: "123456789")
 * @param startDate - Data de início (formato: YYYY-MM-DD ou "30daysAgo")
 * @param endDate - Data de fim (formato: YYYY-MM-DD ou "today")
 * @returns Contagem do evento
 */
export async function getEventCount(
  eventName: string,
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<EventCount> {
  try {
    const client = await getAnalyticsClient();

    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate,
          endDate,
        },
      ],
      dimensions: [
        {
          name: 'eventName',
        },
      ],
      metrics: [
        {
          name: 'eventCount',
        },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: eventName,
          },
        },
      },
    });

    // Extrair contagem
    const count = response.rows?.[0]?.metricValues?.[0]?.value || '0';

    return {
      eventName,
      count: parseInt(count, 10),
      period: `${startDate} to ${endDate}`,
    };
  } catch (error) {
    console.error(`Erro ao buscar contagem do evento ${eventName}:`, error);
    throw error;
  }
}

/**
 * Busca a contagem de correções no mês atual
 *
 * @param propertyId - ID da propriedade do GA4
 * @returns Contagem de correções no mês
 */
export async function getMonthlyCorrectionsCount(propertyId: string): Promise<number> {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startDate = firstDayOfMonth.toISOString().split('T')[0];
  const endDate = 'today';

  const result = await getEventCount('text_corrected', propertyId, startDate, endDate);

  return result.count;
}

/**
 * Limpa o cache do cliente (útil para testes)
 */
export function clearAnalyticsClient(): void {
  analyticsClient = null;
}
