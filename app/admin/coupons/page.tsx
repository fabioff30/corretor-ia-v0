// @ts-nocheck
"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type PromotionCode = {
  id: string
  code: string | null
  active: boolean
  created: number
  expiresAt: number | null
  maxRedemptions: number | null
  timesRedeemed: number
  coupon: {
    id: string
    name: string | null
    duration: string
    durationInMonths: number | null
    percentOff: number | null
  } | null
}

interface FormState {
  code: string
  percentOff: string
  duration: "once" | "repeating" | "forever"
  durationInMonths: string
  maxRedemptions: string
  expiresAt: string
  name: string
}

const initialFormState: FormState = {
  code: "",
  percentOff: "",
  duration: "once",
  durationInMonths: "",
  maxRedemptions: "",
  expiresAt: "",
  name: "",
}

export default function AdminCouponsPage() {
  const { toast } = useToast()
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promotionCodes, setPromotionCodes] = useState<PromotionCode[]>([])

  const formattedPromotionCodes = useMemo(() => {
    return promotionCodes
      .slice()
      .sort((a, b) => b.created - a.created)
      .map((promotion) => {
        const created = format(new Date(promotion.created * 1000), "dd/MM/yyyy HH:mm", {
          locale: ptBR,
        })
        const expires =
          promotion.expiresAt != null
            ? format(new Date(promotion.expiresAt * 1000), "dd/MM/yyyy HH:mm", { locale: ptBR })
            : "—"

        return {
          ...promotion,
          createdLabel: created,
          expiresLabel: expires,
        }
      })
  }, [promotionCodes])

  const fetchPromotionCodes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/coupons", {
        credentials: "include",
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Não foi possível carregar os cupons.")
      }
      const data = await response.json()
      setPromotionCodes(data.promotionCodes || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado ao carregar cupons."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotionCodes()
  }, [])

  const handleInputChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleSelectChange = (value: FormState["duration"]) => {
    setFormState((prev) => ({
      ...prev,
      duration: value,
      durationInMonths: value === "repeating" ? prev.durationInMonths : "",
    }))
  }

  const handleCreateCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const payload = {
        code: formState.code.trim().toUpperCase(),
        percentOff: Number(formState.percentOff),
        duration: formState.duration,
        durationInMonths:
          formState.duration === "repeating" && formState.durationInMonths
            ? Number(formState.durationInMonths)
            : undefined,
        maxRedemptions: formState.maxRedemptions ? Number(formState.maxRedemptions) : undefined,
        expiresAt: formState.expiresAt || undefined,
        name: formState.name || undefined,
      }

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result?.error || "Não foi possível criar o cupom.")
      }

      toast({
        title: "Cupom criado com sucesso!",
        description: `Código ${result?.promotionCode?.code ?? payload.code} está ativo.`,
      })

      setFormState(initialFormState)
      await fetchPromotionCodes()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar o cupom."
      setError(message)
      toast({
        title: "Erro ao criar cupom",
        description: message,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
        <p className="text-muted-foreground">
          Gere códigos promocionais no Stripe para aplicar descontos nas assinaturas Premium.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Criar novo cupom</CardTitle>
            <CardDescription>
              Defina o código, percentual de desconto e parâmetros opcionais para o cupom.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={fetchPromotionCodes}
            disabled={loading || creating}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar lista
          </Button>
        </CardHeader>
        <Separator />
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleCreateCoupon}>
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Código do cupom</Label>
              <Input
                id="coupon-code"
                value={formState.code}
                onChange={handleInputChange("code")}
                placeholder="EXEMPLO50"
                required
                className="uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-name">Nome interno (opcional)</Label>
              <Input
                id="coupon-name"
                value={formState.name}
                onChange={handleInputChange("name")}
                placeholder="Campanha Black Friday"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percent-off">Percentual de desconto (%)</Label>
              <Input
                id="percent-off"
                type="number"
                min={1}
                max={100}
                value={formState.percentOff}
                onChange={handleInputChange("percentOff")}
                placeholder="Ex: 50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Duração do desconto</Label>
              <Select value={formState.duration} onValueChange={handleSelectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Uma vez (primeira fatura)</SelectItem>
                  <SelectItem value="repeating">Recorrente (por X meses)</SelectItem>
                  <SelectItem value="forever">Para sempre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formState.duration === "repeating" && (
              <div className="space-y-2">
                <Label htmlFor="duration-months">Meses de recorrência</Label>
                <Input
                  id="duration-months"
                  type="number"
                  min={1}
                  max={24}
                  value={formState.durationInMonths}
                  onChange={handleInputChange("durationInMonths")}
                  placeholder="Ex: 3"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="max-redemptions">Limite de utilizações (opcional)</Label>
              <Input
                id="max-redemptions"
                type="number"
                min={1}
                value={formState.maxRedemptions}
                onChange={handleInputChange("maxRedemptions")}
                placeholder="Ex: 100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-at">Expira em (opcional)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={formState.expiresAt}
                onChange={handleInputChange("expiresAt")}
              />
            </div>

            <div className="lg:col-span-2 flex items-center justify-end gap-2">
              {error && (
                <Alert variant="destructive" className="lg:max-w-lg">
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={creating}>
                {creating ? "Gerando cupom..." : "Gerar cupom"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cupons recentes</CardTitle>
          <CardDescription>
            Lista dos últimos cupons gerados. Dados sincronizados diretamente do Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando cupons...</p>
          ) : formattedPromotionCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cupom criado até o momento.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Código</TableHead>
                    <TableHead className="min-w-[160px]">Desconto</TableHead>
                    <TableHead className="min-w-[160px]">Duração</TableHead>
                    <TableHead className="min-w-[160px]">Criado em</TableHead>
                    <TableHead className="min-w-[160px]">Expira em</TableHead>
                    <TableHead className="min-w-[140px]">Resgates</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formattedPromotionCodes.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-semibold">{promotion.code}</TableCell>
                      <TableCell>
                        {promotion.coupon?.percentOff
                          ? `${promotion.coupon.percentOff}%`
                          : promotion.coupon?.amountOff
                          ? `R$ ${(promotion.coupon.amountOff / 100).toFixed(2)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {promotion.coupon
                          ? promotion.coupon.duration === "repeating"
                            ? `Recorrente (${promotion.coupon.durationInMonths ?? 0} meses)`
                            : promotion.coupon.duration === "forever"
                              ? "Para sempre"
                              : "Uma vez"
                          : "—"}
                      </TableCell>
                      <TableCell>{promotion.createdLabel}</TableCell>
                      <TableCell>{promotion.expiresLabel}</TableCell>
                      <TableCell>
                        {promotion.timesRedeemed}/{promotion.maxRedemptions ?? "∞"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={promotion.active ? "default" : "secondary"}>
                          {promotion.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
// @ts-nocheck
