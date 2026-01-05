#!/usr/bin/env node
// @ts-nocheck
/**
 * Script para fazer upload das credenciais do Google Cloud para o Vercel Blob
 *
 * Como usar (Opção 1 - Vercel CLI - Recomendado):
 * 1. Certifique-se de ter a Vercel CLI instalada: npm i -g vercel
 * 2. Faça login: vercel login
 * 3. Execute: ./scripts/upload-google-credentials.sh
 *
 * Como usar (Opção 2 - Programático):
 * 1. Certifique-se de ter o BLOB_READ_WRITE_TOKEN configurado no .env.local
 * 2. Execute: pnpm tsx scripts/upload-google-credentials.ts
 */

import { put } from '@vercel/blob';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function uploadCredentials() {
  try {
    console.log('🔄 Iniciando upload das credenciais do Google Cloud...');

    // Caminho do arquivo de credenciais
    const credentialsPath = join(process.cwd(), 'utils', 'corretor-de-texto-454602-fc315fd1360a.json');

    // Verificar se o arquivo existe
    if (!existsSync(credentialsPath)) {
      throw new Error(`Arquivo de credenciais não encontrado em: ${credentialsPath}`);
    }

    // Verificar se o token está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN não está configurado.\n' +
        'Por favor, adicione o token ao .env.local ou use a Vercel CLI (veja ./scripts/upload-google-credentials.sh)'
      );
    }

    // Ler o arquivo
    const credentials = readFileSync(credentialsPath, 'utf-8');

    // Validar JSON
    try {
      JSON.parse(credentials);
    } catch {
      throw new Error('Arquivo de credenciais não é um JSON válido');
    }

    console.log('📤 Fazendo upload para Vercel Blob...');

    // Fazer upload para o Vercel Blob
    const blob = await put('google-credentials.json', credentials, {
      access: 'private', // Importante: manter privado
      contentType: 'application/json',
    });

    console.log('\n✅ Upload concluído com sucesso!');
    console.log('📍 URL do Blob:', blob.url);
    console.log('\n📝 Próximos passos:');
    console.log('1. Adicione esta URL ao seu .env.local:');
    console.log(`   GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=${blob.url}`);
    console.log('\n2. Configure no Vercel (produção):');
    console.log('   vercel env add GOOGLE_CLOUD_CREDENTIALS_BLOB_URL');
    console.log(`   Valor: ${blob.url}`);

    return blob.url;
  } catch (error) {
    console.error('\n❌ Erro ao fazer upload:', error);
    throw error;
  }
}

// Executar o script
uploadCredentials()
  .then(() => {
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
// @ts-nocheck
