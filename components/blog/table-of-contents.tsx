"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>("")

  // Extrair a lógica do useEffectEvent para um useCallback normal
  const checkActiveHeading = useCallback(() => {
    const headingElements = tocItems.map((item) => document.getElementById(item.id))

    // Find the heading that's currently in view
    const currentHeading = headingElements.find((element, index) => {
      if (!element) return false

      const rect = element.getBoundingClientRect()
      const nextElement = headingElements[index + 1]

      if (nextElement) {
        const nextRect = nextElement.getBoundingClientRect()
        return rect.top <= 100 && nextRect.top > 100
      }

      return rect.top <= 100
    })

    if (currentHeading) {
      setActiveId(currentHeading.id)
    }
  }, [tocItems])

  useEffect(() => {
    // Parse headings from content
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, "text/html")
    const headings = Array.from(doc.querySelectorAll("h2, h3, h4"))

    const items: TOCItem[] = headings.map((heading, index) => {
      const level = Number.parseInt(heading.tagName.substring(1))
      const text = heading.textContent || ""
      const id = heading.id || `heading-${index}`

      // If heading doesn't have an ID, we'll need to add it to the actual DOM
      if (!heading.id) {
        const contentHeadings = document.querySelectorAll(".prose h2, .prose h3, .prose h4")
        if (contentHeadings[index]) {
          contentHeadings[index].id = id
        }
      }

      return { id, text, level }
    })

    setTocItems(items)
  }, [content])

  useEffect(() => {
    const handleScroll = () => {
      checkActiveHeading()
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [checkActiveHeading])

  if (tocItems.length < 2) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Índice</CardTitle>
      </CardHeader>
      <CardContent>
        <nav>
          <ul className="space-y-1 text-sm">
            {tocItems.map((item) => (
              <li key={item.id} className={`${item.level === 3 ? "ml-4" : ""} ${item.level === 4 ? "ml-8" : ""}`}>
                <a
                  href={`#${item.id}`}
                  className={`block py-1 hover:text-primary transition-colors ${
                    activeId === item.id ? "text-primary font-medium" : "text-foreground/70"
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </CardContent>
    </Card>
  )
}
