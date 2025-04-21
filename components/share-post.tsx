"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Facebook, Twitter, Linkedin, Copy, Share2, Check } from "lucide-react"
import { sendGTMEvent } from "@/utils/gtm-helper"

interface SharePostProps {
  title: string
  slug: string
  className?: string
}

export function SharePost({ title, slug, className = "" }: SharePostProps) {
  const [copied, setCopied] = useState(false)
  const url = `https://corretordetextoonline.com.br/blog/${slug}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)

    sendGTMEvent("share", {
      method: "copy_link",
      content_type: "blog_post",
      item_id: slug,
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: string) => {
    let shareUrl = ""

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
        break
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        break
      default:
        return
    }

    sendGTMEvent("share", {
      method: platform,
      content_type: "blog_post",
      item_id: slug,
    })

    window.open(shareUrl, "_blank", "width=600,height=400")
  }

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <p className="text-sm font-medium">Compartilhe este artigo:</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => handleShare("facebook")}>
          <Facebook className="h-4 w-4" />
          <span className="hidden sm:inline">Facebook</span>
        </Button>

        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => handleShare("twitter")}>
          <Twitter className="h-4 w-4" />
          <span className="hidden sm:inline">Twitter</span>
        </Button>

        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => handleShare("linkedin")}>
          <Linkedin className="h-4 w-4" />
          <span className="hidden sm:inline">LinkedIn</span>
        </Button>

        <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleCopy}>
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              <span className="hidden sm:inline">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copiar link</span>
            </>
          )}
        </Button>

        {navigator.share && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              navigator
                .share({
                  title: title,
                  url: url,
                })
                .then(() => {
                  sendGTMEvent("share", {
                    method: "native_share",
                    content_type: "blog_post",
                    item_id: slug,
                  })
                })
                .catch(console.error)
            }}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
        )}
      </div>
    </div>
  )
}
