import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function ToolComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="py-4 px-4 text-left font-medium text-foreground">Recurso</th>
            <th className="py-4 px-4 text-center font-medium text-foreground">CorretorPT</th>
            <th className="py-4 px-4 text-center font-medium text-foreground">Ferramenta B</th>
            <th className="py-4 px-4 text-center font-medium text-foreground">Ferramenta C</th>
            <th className="py-4 px-4 text-center font-medium text-foreground">Ferramenta D</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Correção ortográfica</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Correção gramatical</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Correção de pontuação</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Sugestões de estilo</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Análise contextual</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Comparação visual</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Português brasileiro</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Português europeu</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">100% gratuito</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
          </tr>
          <tr className="border-b border-white/10">
            <td className="py-3 px-4 text-foreground/80">Sem limite de caracteres</td>
            <td className="py-3 px-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
            <td className="py-3 px-4 text-center">
              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 text-sm text-foreground/60">
        <div className="flex items-center gap-4 justify-end">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
            <span>Suporte completo</span>
          </div>
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
            <span>Suporte parcial</span>
          </div>
          <div className="flex items-center">
            <XCircle className="h-4 w-4 text-red-500 mr-1" />
            <span>Não suportado</span>
          </div>
        </div>
      </div>
    </div>
  )
}
