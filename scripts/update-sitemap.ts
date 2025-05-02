/**
 * Script to manually update the sitemap
 * This can be run with: npx ts-node -r tsconfig-paths/register scripts/update-sitemap.ts
 */

import fetch from "node-fetch"

async function updateSitemap() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.corretordetextoonline.com.br"
    const revalidationToken = process.env.REVALIDATION_TOKEN || "default-secure-token-change-this"

    console.log("Updating sitemap...")

    // Call the revalidation endpoint
    const response = await fetch(`${baseUrl}/api/revalidate?token=${revalidationToken}&path=/sitemap.xml`, {
      method: "GET",
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update sitemap: ${error}`)
    }

    const result = await response.json()
    console.log("Sitemap update result:", result)
    console.log("Sitemap updated successfully!")
  } catch (error) {
    console.error("Error updating sitemap:", error)
  }
}

// Run the function
updateSitemap()
