# Scripts do Projeto CorretorIA

Este diretório contém scripts utilitários para o projeto CorretorIA.

## 📄 upload-google-credentials.ts

Script para fazer upload das credenciais do Google Cloud para o Vercel Blob Storage.

### Pré-requisitos

1. Arquivo de credenciais do Google Cloud Service Account em `utils/corretor-de-texto-454602-fc315fd1360a.json`
2. Token do Vercel Blob configurado em `.env.local`:
   ```bash
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXX
   ```

### Como Usar

**Método 1 - Vercel CLI (Recomendado):**

```bash
./scripts/upload-google-credentials.sh
```

**Método 2 - Script TypeScript:**

```bash
pnpm tsx scripts/upload-google-credentials.ts
```

### O que o script faz:

1. ✅ Lê o arquivo de credenciais do Google Cloud
2. ✅ Faz upload para o Vercel Blob com acesso privado
3. ✅ Retorna a URL do blob
4. ✅ Instrui você a adicionar a URL ao `.env.local`

### Após executar:

Copie a URL retornada e adicione ao `.env.local`:

```bash
GOOGLE_CLOUD_CREDENTIALS_BLOB_URL=https://blob.vercel-storage.com/google-credentials.json
```

### Segurança

- ✅ O arquivo é armazenado com acesso **privado**
- ✅ Apenas requisições autenticadas podem acessá-lo
- ✅ O arquivo local é ignorado pelo Git (`.gitignore`)

### Troubleshooting

**Erro: "BLOB_READ_WRITE_TOKEN não está configurado"**
- Verifique se você adicionou o token ao `.env.local`
- Certifique-se de ter criado um Blob Storage no Vercel Dashboard

**Erro: "Arquivo de credenciais não encontrado"**
- Verifique se o arquivo está em `utils/corretor-de-texto-454602-fc315fd1360a.json`
- Certifique-se de que o caminho está correto

Para mais informações, consulte `GOOGLE_ANALYTICS_SETUP.md`.
