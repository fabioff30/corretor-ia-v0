"use server"

import { revalidatePath } from "next/cache"

/**
 * Server Action para revalidar conteúdo do blog
 * @param slug Slug do post a ser revalidado (opcional)
 * @returns Resultado da revalidação
 */
export async function revalidateContent(slug?: string): Promise<{ success: boolean; message: string }> {
  try {
    if (slug) {
      // Revalidar post específico
      revalidatePath(`/blog/${slug}`)
      // Também revalidar índice do blog para atualizar listagens
      revalidatePath("/blog")

      console.log(`Revalidated post: ${slug}`)
      return {
        success: true,
        message: `O post ${slug} foi atualizado com sucesso.`,
      }
    } else {
      // Revalidar todo o conteúdo do blog
      revalidatePath("/blog")

      console.log("Revalidated all blog content")
      return {
        success: true,
        message: "Todo o conteúdo do blog foi atualizado com sucesso.",
      }
    }
  } catch (error) {
    console.error("Revalidation error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido ao revalidar conteúdo",
    }
  }
}
