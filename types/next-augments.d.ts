// Global Next.js type augmentations for runtime data attached by hosting layers
import type { NextRequest } from "next/server"
import type { ZodError, ZodIssue } from "zod"

declare module "next/server" {
  interface NextRequest {
    ip?: string | null
    geo?: {
      country?: string
      city?: string
      region?: string
    } | null
  }
}

declare module "next/dist/server/web/spec-extension/cookies" {
  interface RequestCookie {
    domain?: string
  }
}

declare module "zod" {
  interface ZodError<T = unknown> {
    errors: ZodIssue[]
  }
}
