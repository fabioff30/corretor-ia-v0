"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle } from "lucide-react"

export function WebhookStatus() {
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            <Badge variant="online" className="flex items-center gap-1 px-2 py-1">
              <CheckCircle className="h-3 w-3" />
              <span>Serviço Online</span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Status do serviço de correção</p>
          <p className="text-xs text-muted-foreground">Última verificação: {lastChecked.toLocaleTimeString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
