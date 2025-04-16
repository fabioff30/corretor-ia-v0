// This file ensures that the typography plugin is properly loaded
// and applies the correct styles to WordPress content

export function ensureTypographyStyles() {
  // Check if we're in the browser
  if (typeof window !== "undefined") {
    // Check if the typography styles are loaded
    const typographyLoaded = document
      .querySelector(".prose h1, .prose h2, .prose p")
      ?.computedStyleMap?.()
      ?.get("color")

    // If not loaded properly, force a refresh of the styles
    if (!typographyLoaded) {
      const style = document.createElement("style")
      style.textContent = `
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: hsl(var(--foreground));
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .prose p {
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .prose a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .prose ul, .prose ol {
          margin-top: 1em;
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        .prose li {
          margin-top: 0.25em;
          margin-bottom: 0.25em;
        }
      `
      document.head.appendChild(style)
    }
  }

  return null
}
