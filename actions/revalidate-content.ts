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
      // Revalidar post específico com força total (revalidate: 0)
      revalidatePath(`/blog/${slug}`, "page")
      // Também revalidar índice do blog para atualizar listagens
      revalidatePath("/blog", "page")
      // Revalidar o sitemap para incluir o novo post
      revalidatePath("/sitemap.xml", "page")

      console.log(`Revalidated post: ${slug} and updated sitemap`)
      return {
        success: true,
        message: `O post ${slug} foi atualizado e o sitemap foi regenerado com sucesso.`,
      }
    } else {
      // Revalidar todo o conteúdo do blog com força total
      revalidatePath("/blog", "page")
      // Revalidar o sitemap
      revalidatePath("/sitemap.xml", "page")

      console.log("Revalidated all blog content and sitemap")
      return {
        success: true,
        message: "Todo o conteúdo do blog e o sitemap foram atualizados com sucesso.",
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
