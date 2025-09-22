"use client"

import { createContext, useContext, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type BillingCycle = "annual" | "monthly"

export interface PlanPricing {
  headline: string
  subheadline: string
}

export interface Plan {
  name: string
  description: string
  pricing: {
    annual: PlanPricing
    monthly: PlanPricing
  }
  features: string[]
  cta: { label: string; href: string }
  featured?: boolean
}

interface PricingContextValue {
  billingCycle: BillingCycle
  setBillingCycle: (cycle: BillingCycle) => void
}

const PricingContext = createContext<PricingContextValue | null>(null)

function usePricingContext() {
  const ctx = useContext(PricingContext)
  if (!ctx) {
    throw new Error("Pricing components must be used inside <PricingSelector>")
  }
  return ctx
}

interface PricingSelectorProps {
  plans: Plan[]
}

function PricingSelector({ plans }: PricingSelectorProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual")
  const value = useMemo(() => ({ billingCycle, setBillingCycle }), [billingCycle])

  return (
    <PricingContext.Provider value={value}>
      <div className="flex justify-center mb-10">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1 text-sm">
          <Button
            type="button"
            variant={billingCycle === "annual" ? "default" : "ghost"}
            className={`rounded-full px-4 ${billingCycle === "annual" ? "shadow-sm" : "text-muted-foreground"}`}
            onClick={() => setBillingCycle("annual")}
          >
            Cobrança anual
            <Badge variant="secondary" className="ml-2 hidden sm:inline-flex">
              Economize até 17%
            </Badge>
          </Button>
          <Button
            type="button"
            variant={billingCycle === "monthly" ? "default" : "ghost"}
            className={`rounded-full px-4 ${billingCycle === "monthly" ? "shadow-sm" : "text-muted-foreground"}`}
            onClick={() => setBillingCycle("monthly")}
          >
            Cobrança mensal
          </Button>
        </div>
      </div>
    </PricingContext.Provider>
  )
}

function PricingPrice({ plan }: { plan: Plan }) {
  const { billingCycle } = usePricingContext()
  const current = plan.pricing[billingCycle]

  return (
    <div>
      <div className="text-3xl font-bold">{current.headline}</div>
      <div className="text-sm text-muted-foreground">{current.subheadline}</div>
    </div>
  )
}

PricingSelector.Price = PricingPrice

export default PricingSelector as typeof PricingSelector & { Price: typeof PricingPrice }
