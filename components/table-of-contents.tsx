"use client"

import { useState, useEffect } from "react"

interface TableOfContentsProps {
  headings: {
    id: string
    text: string
    level: number
  }[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "0px 0px -80% 0px" },
    )

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      headings.forEach((heading) => {
        const element = document.getElementById(heading.id)
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [headings])

  return (
    <nav className="space-y-2 text-sm">
      <p className="font-medium text-foreground mb-3">Neste artigo:</p>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={`block py-1 transition-colors ${
            activeId === heading.id ? "text-primary font-medium" : "text-foreground/70 hover:text-foreground"
          } ${heading.level === 3 ? "pl-0" : "pl-4"}`}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  )
}
