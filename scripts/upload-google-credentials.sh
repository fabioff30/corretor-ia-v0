#!/bin/bash

###############################################################################
# Script para fazer upload das credenciais do Google Cloud usando Vercel CLI
#
# Uso: ./scripts/upload-google-credentials.sh
#
# Pré-requisitos:
# 1. Vercel CLI instalada: npm i -g vercel
# 2. Login na Vercel: vercel login
# 3. Projeto vinculado: vercel link
###############################################################################

set -e  # Exit on error

echo "🔄 Upload de Credenciais do Google Cloud para Vercel Blob"
echo "=========================================================="
echo ""

# Verificar se a Vercel CLI está instalada
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI não encontrada!"
    echo ""
    echo "Por favor, instale a Vercel CLI:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

# Arquivo de credenciais
CREDENTIALS_FILE="utils/corretor-de-texto-454602-fc315fd1360a.json"

# Verificar se o arquivo existe
if [ ! -f "$CREDENTIALS_FILE" ]; then
    echo "❌ Arquivo de credenciais não encontrado:"
    echo "   $CREDENTIALS_FILE"
    echo ""
    exit 1
fi

echo "📁 Arquivo encontrado: $CREDENTIALS_FILE"
echo ""

# Fazer upload usando Vercel CLI
echo "📤 Fazendo upload para Vercel Blob..."
echo ""

BLOB_URL=$(vercel blob upload "$CREDENTIALS_FILE" --token "$(vercel env pull --yes > /dev/null 2>&1 && cat .vercel/.env.local | grep BLOB_READ_WRITE_TOKEN | cut -d '=' -f2)" 2>&1 | grep -oP 'https://[^\s]+')

if [ -z "$BLOB_URL" ]; then
    # Tentar upload sem token (modo interativo)
    echo "⚠️  Fazendo upload no modo interativo..."
    vercel blob upload "$CREDENTIALS_FILE"

    echo ""
    echo "✅ Upload concluído!"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Copie a URL retornada acima"
    echo "2. Adicione ao .env.local:"
    echo "   GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=<URL_COPIADA>"
    echo ""
    echo "3. Configure no Vercel (produção):"
    echo "   vercel env add GOOGLE_CLOUD_CREDENTIALS_BLOB_URL"
else
    echo "✅ Upload concluído com sucesso!"
    echo ""
    echo "📍 URL do Blob:"
    echo "   $BLOB_URL"
    echo ""
    echo "📝 Próximos passos:"
    echo "1. Adicione ao .env.local:"
    echo "   GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=$BLOB_URL"
    echo ""
    echo "2. Configure no Vercel (produção):"
    echo "   vercel env add GOOGLE_CLOUD_CREDENTIALS_BLOB_URL"
    echo "   Valor: $BLOB_URL"
    echo ""
fi

echo "🎉 Processo concluído!"
