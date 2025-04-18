import { type NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// Secret token para autorização
const REVALIDATION_TOKEN = process.env.REVALIDATION_TOKEN || "default-secure-token-change-this"

export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição é legítima com verificação de token
    const token = request.headers.get("x-revalidate-token")

    // Verificar o token apenas se não for uma requisição do WordPress
    // (WordPress enviará seu próprio token de segurança)
    const isWordPressWebhook = request.headers.get("x-wp-webhook") === "true"

    // Adicione esta verificação na função POST
    const webhookSecret = process.env.WEBHOOK_SECRET || "seu-segredo-compartilhado"
    const receivedSecret = request.headers.get("x-webhook-secret")

    if (isWordPressWebhook && receivedSecret !== webhookSecret) {
      console.warn("Tentativa de webhook com segredo inválido")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (!isWordPressWebhook && token !== REVALIDATION_TOKEN) {
      console.warn("Tentativa de revalidação não autorizada com token incorreto")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Requisição de webhook recebida:", body)

    // Processar webhook do WordPress
    if (isWordPressWebhook) {
      // Extrair informações do post do WordPress
      const postId = body.post_id
      const postSlug = body.post_slug || body.post_name
      const action = body.action || body.trigger // "publish", "update", "delete", etc.

      console.log(`Webhook do WordPress recebido: Ação ${action} para post ${postId} (${postSlug})`)

      if (postSlug) {
        // Revalidar a página específica do post
        revalidatePath(`/blog/${postSlug}`)
        // Também revalidar o índice do blog para atualizar as listagens
        revalidatePath("/blog")

        console.log(`Revalidado post: ${postSlug}`)
        return NextResponse.json({
          revalidated: true,
          message: `Post ${postSlug} revalidado com sucesso`,
        })
      } else {
        // Se não tiver slug, revalidar todo o blog
        revalidatePath("/blog")
        console.log("Revalidado índice do blog")
        return NextResponse.json({
          revalidated: true,
          message: "Índice do blog revalidado com sucesso",
        })
      }
    }

    // Processar solicitações de revalidação manuais
    if (body.action === "refresh_all") {
      // Revalidar todo o conteúdo do blog
      revalidatePath("/blog")
      console.log("Revalidado todo o conteúdo do blog")
      return NextResponse.json({ revalidated: true, path: "/blog" })
    } else if (body.slug) {
      // Revalidar post específico
      revalidatePath(`/blog/${body.slug}`)
      // Também revalidar índice do blog para atualizar listagens
      revalidatePath("/blog")

      console.log(`Revalidado post: ${body.slug}`)
      return NextResponse.json({ revalidated: true, slug: body.slug })
    } else {
      // Caso padrão - revalidar índice do blog
      revalidatePath("/blog")
      console.log("Revalidado índice do blog")
      return NextResponse.json({ revalidated: true, path: "/blog" })
    }
  } catch (error) {
    console.error("Erro de revalidação:", error)
    return NextResponse.json(
      {
        error: "Erro ao revalidar",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

// Também suporta requisições GET para testes mais fáceis
export async function GET(request: NextRequest) {
  try {
    // Verificar token na query string para requisições GET
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const path = searchParams.get("path") || "/blog"

    if (token !== REVALIDATION_TOKEN) {
      console.warn("Tentativa de revalidação não autorizada com token incorreto")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Revalidar o caminho especificado
    revalidatePath(path)
    console.log(`Caminho revalidado: ${path}`)

    return NextResponse.json({ revalidated: true, path })
  } catch (error) {
    console.error("Erro de revalidação:", error)
    return NextResponse.json(
      {
        error: "Erro ao revalidar",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
