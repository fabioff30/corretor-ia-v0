/**
 * Módulo para gerenciar as credenciais do Google Cloud armazenadas no Vercel Blob
 */

interface GoogleCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

/**
 * Cache das credenciais para evitar múltiplas requisições
 */
let credentialsCache: GoogleCredentials | null = null;

/**
 * Busca as credenciais do Google Cloud do Vercel Blob
 * @returns Credenciais do Google Cloud
 */
export async function getGoogleCredentials(): Promise<GoogleCredentials> {
  // Retornar do cache se já foi carregado
  if (credentialsCache) {
    return credentialsCache;
  }

  const blobUrl = process.env.GOOGLE_CLOUD_CREDENTIALS_BLOB_URL;

  if (!blobUrl) {
    throw new Error('GOOGLE_CLOUD_CREDENTIALS_BLOB_URL não está configurada no ambiente');
  }

  try {
    const response = await fetch(blobUrl);

    if (!response.ok) {
      throw new Error(`Falha ao buscar credenciais: ${response.status} ${response.statusText}`);
    }

    const credentials = await response.json() as GoogleCredentials;

    // Validar estrutura básica das credenciais
    if (!credentials.project_id || !credentials.private_key || !credentials.client_email) {
      throw new Error('Credenciais do Google Cloud inválidas ou incompletas');
    }

    // Armazenar no cache
    credentialsCache = credentials;

    return credentials;
  } catch (error) {
    console.error('Erro ao buscar credenciais do Google Cloud:', error);
    throw error;
  }
}

/**
 * Limpa o cache de credenciais (útil para testes)
 */
export function clearCredentialsCache(): void {
  credentialsCache = null;
}
