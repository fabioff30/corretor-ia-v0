import { Github, Linkedin, Globe, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

export function AboutAuthorSection() {
  return (
    <section id="sobre" className="py-16 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Conheça o criador
          </span>
          <h2 className="text-3xl font-bold tracking-tight mb-4 gradient-text">Sobre o Autor</h2>
          <p className="text-foreground/80 max-w-[700px] mx-auto">
            Conheça a pessoa por trás do CorretorIA e sua missão de melhorar a comunicação escrita em português
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="bg-primary/5 p-6 flex flex-col items-center justify-center text-center">
                  <Avatar className="h-32 w-32 border-4 border-primary/20 mb-4">
                    <AvatarImage src="/images/fabio-perfil-colorido.png" alt="Fábio Farias" />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">FF</AvatarFallback>
                  </Avatar>
                  <h3 className="text-xl font-bold mb-1">Fábio Farias</h3>
                  <p className="text-sm text-foreground/70 mb-4">Desenvolvedor & Empreendedor</p>
                  <div className="flex space-x-3 mb-4">
                    <a
                      href="https://github.com/fabioff30"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
                      aria-label="GitHub"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                    <a
                      href="https://linkedin.com/in/fabiofariasf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                    <a
                      href="https://fabiofariasf.com.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full bg-background flex items-center justify-center hover:bg-primary/10 transition-colors"
                      aria-label="Website"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/contato">
                      <Mail className="h-4 w-4 mr-2" />
                      Contato
                    </Link>
                  </Button>
                </div>
                <div className="col-span-2 p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-4">Olá, eu sou o Fábio!</h3>
                  <div className="space-y-4 text-foreground/80">
                    <p>
                      Sou Fábio, jornalista de formação, desenvolvedor de sites, consultor de marketing e entusiasta de
                      inteligência artificial. Criei o CorretorIA para ajudar quem, assim como eu já vi tantas vezes,
                      tem boas ideias mas trava na hora de colocar no papel. A escrita pode ser uma ponte — e também uma
                      barreira. Meu objetivo é derrubar essa barreira com tecnologia acessível e fácil de usar.
                    </p>
                    <p>
                      Depois de anos trabalhando com conteúdo, SEO, automações e ferramentas de IA, percebi que muita
                      gente incrível deixa de se expressar por insegurança com gramática, ortografia ou estilo. O
                      CorretorIA nasceu para mudar isso: uma ferramenta gratuita, simples e pensada para apoiar quem
                      quer se comunicar melhor em português.
                    </p>
                    <p>
                      Além desse projeto, também desenvolvo soluções personalizadas com IA e automação para pequenos
                      negócios, crio sites em WordPress e ensino como a inteligência artificial pode facilitar o dia a
                      dia de quem empreende.
                    </p>
                    <p>
                      Se o CorretorIA te ajudou de alguma forma, considere apoiar o projeto com uma doação. Isso me
                      permite manter a ferramenta gratuita e sempre melhorando.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
