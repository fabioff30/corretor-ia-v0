import Link from "next/link"
import { Github, Linkedin, Sparkles, BookOpen, Globe } from "lucide-react"
import { EasterEggSecret } from "@/components/easter-egg-secret"

export function Footer() {
  return (
    <footer className="w-full py-12 border-t bg-background">
      <div className="max-w-[1366px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="w-full flex justify-center items-center mb-8 pb-6 border-b">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Projeto orgulhosamente criado no Nordeste Brasileiro, em Natal/RN ❤️
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center">
              <Sparkles className="h-5 w-5 text-primary mr-1.5" />
              <span className="text-xl font-bold gradient-text">CorretorIA</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Corrija erros gramaticais, ortográficos e de estilo em seus textos em português com nossa ferramenta
              inteligente.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Recursos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#recursos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Benefícios
                </Link>
              </li>
              <li>
                <Link href="#como-usar" className="text-muted-foreground hover:text-foreground transition-colors">
                  Como Usar
                </Link>
              </li>
              <li>
                <Link href="#casos-de-uso" className="text-muted-foreground hover:text-foreground transition-colors">
                  Casos de Uso
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Contato</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contato@corretordetextoonline.com.br"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  contato@corretordetextoonline.com.br
                </a>
              </li>
              <li className="flex space-x-4 mt-3">
                <a
                  href="https://github.com/fabioff30"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-5 w-5" />
                  <span className="sr-only">GitHub</span>
                </a>
                <a
                  href="https://linkedin.com/in/fabiofariasf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a
                  href="https://fabiofariasf.substack.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  <span className="sr-only">Substack</span>
                </a>
                <a
                  href="https://fabiofariasf.com.br/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">Blog</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CorretorIA. Todos os direitos reservados.
          </p>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm text-muted-foreground mt-4 md:mt-0">
              Desenvolvido com ❤️ pela{" "}
              <a
                href="https://www.ffmedia.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                FFMedia
              </a>{" "}
              para falantes de português
              <EasterEggSecret />
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
