"use client"

import { useEffect } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { BackgroundGradient } from "@/components/background-gradient"
import { CalendarIcon, Clock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SharePost } from "@/components/share-post"
import Script from "next/script"

// Define the blog post content
const blogPosts = {
  "mensagens-de-aniversario": {
    title: "+100 ideias de mensagem de aniversário para emocionar quem você ama",
    date: "2025-04-15",
    readTime: "10 min",
    coverImage:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20250415_1826_Birthday%20Celebration%20Fun_simple_compose_01jrxngq4af9p8smw185v9kdvj-CleuSJnFtCXXifMf469miSPSFzAIiT.webp",
    content: `
      <div class="bg-primary/10 p-4 rounded-lg border border-primary/20 mb-6">
        <p class="font-medium text-lg mb-2">Precisa de ajuda para escrever a mensagem perfeita?</p>
        <p class="mb-3">Use o <strong>CorretorIA</strong> para garantir que sua mensagem de aniversário esteja impecável, sem erros gramaticais ou de ortografia!</p>
        <a href="/" class="inline-block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Corrigir minha mensagem agora</a>
      </div>
      
      <p>Já ficou sem palavras na hora de desejar feliz aniversário a alguém especial? Sabemos como é difícil encontrar as palavras certas para expressar todo o carinho e admiração que sentimos por aquela pessoa querida. Por isso, preparamos este guia completo com mais de 100 mensagens de aniversário para todas as ocasiões e relacionamentos.</p>
      
      <p>Seja para um amigo de longa data, para o amor da sua vida, para seus familiares ou até mesmo para aquele colega de trabalho, você encontrará a mensagem perfeita para emocionar e fazer o dia de alguém ainda mais especial. Preparamos opções que vão desde as mais românticas até as mais divertidas, passando por mensagens religiosas e curtas para quem prefere a objetividade.</p>
      
      <h3 id="indice">Índice</h3>
      <ul>
        <li><a href="#mensagens-amigos" class="text-primary hover:underline">Mensagem de Aniversário para Amigos</a></li>
        <li><a href="#mensagens-romanticas" class="text-primary hover:underline">Mensagem de Aniversário Romântica</a></li>
        <li><a href="#mensagens-familia" class="text-primary hover:underline">Mensagem de Aniversário para Família</a></li>
        <li><a href="#mensagens-engracadas" class="text-primary hover:underline">Mensagem de Aniversário Engraçada</a></li>
        <li><a href="#mensagens-colegas" class="text-primary hover:underline">Mensagem de Aniversário para Colegas e Chefes</a></li>
        <li><a href="#mensagens-curtas" class="text-primary hover:underline">Mensagens Curtas para WhatsApp e Cartões</a></li>
        <li><a href="#mensagens-religiosas" class="text-primary hover:underline">Mensagens Religiosas e Espirituais</a></li>
        <li><a href="#dicas-personalizadas" class="text-primary hover:underline">Dicas de Como Escrever uma Mensagem de Aniversário Personalizada</a></li>
      </ul>
      
      <h3 id="mensagens-amigos">1. Mensagem de Aniversário para Amigos</h3>
      <p>A amizade é um dos tesouros mais valiosos que carregamos pela vida. Um amigo verdadeiro merece palavras que expressem gratidão, carinho e a certeza de que estamos juntos em todos os momentos. Confira estas mensagens especiais para celebrar o aniversário daqueles que fazem nossa jornada mais leve:</p>
      
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário! Que a vida continue sorrindo e te presenteando com as melhores graças." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário! Que a vida continue sorrindo e te presenteando com as melhores graças."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Você merece tudo de melhor hoje e sempre. Amizade como a sua é presente raro." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Você merece tudo de melhor hoje e sempre. Amizade como a sua é presente raro."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Hoje celebramos não só o seu nascimento, mas também a sorte que tenho de ter você na minha vida. Feliz aniversário!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Hoje celebramos não só o seu nascimento, mas também a sorte que tenho de ter você na minha vida. Feliz aniversário!"
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Que seu dia seja tão especial quanto você é para mim. Conte sempre comigo para o que precisar!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Que seu dia seja tão especial quanto você é para mim. Conte sempre comigo para o que precisar!"
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Parabéns, amigo(a)! Obrigado(a) por todos os momentos de alegria que você proporciona. Que venham muitos anos de amizade pela frente!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Parabéns, amigo(a)! Obrigado(a) por todos os momentos de alegria que você proporciona. Que venham muitos anos de amizade pela frente!"
          </li>
        </ul>
      </div>
      
      <p>Veja mais mensagens para amigos:</p>
      
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário para quem sabe o verdadeiro significado de amizade. Você é insubstituível!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário para quem sabe o verdadeiro significado de amizade. Você é insubstituível!"
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Agradeço por cada conselho, cada risada e cada momento compartilhado. Feliz aniversário, amigo(a) do coração!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Agradeço por cada conselho, cada risada e cada momento compartilhado. Feliz aniversário, amigo(a) do coração!"
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Não importa a distância, a amizade verdadeira permanece. Desejo um aniversário cheio de alegrias!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Não importa a distância, a amizade verdadeira permanece. Desejo um aniversário cheio de alegrias!"
          </li>
        </ul>
      </div>
      
      <div class="bg-muted/30 p-4 rounded-lg border my-6">
        <p class="font-medium mb-2">Dica do CorretorIA:</p>
        <p>Antes de enviar sua mensagem de aniversário, verifique se não há erros gramaticais ou de ortografia. Uma mensagem bem escrita demonstra ainda mais carinho e atenção! <a href="/" class="text-primary hover:underline">Corrija seu texto gratuitamente aqui</a>.</p>
      </div>
      
      <h3 id="mensagens-romanticas">2. Mensagem de Aniversário Romântica</h3>
      <p>O amor nos inspira a expressar os sentimentos mais profundos e sinceros. Seja para namorados, noivos ou cônjuges, estas mensagens românticas certamente tocarão o coração daquela pessoa especial:</p>
      
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Hoje é o dia de celebrar o seu nascimento... e de agradecer por você existir na minha vida." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Hoje é o dia de celebrar o seu nascimento... e de agradecer por você existir na minha vida."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Parabéns, amor da minha vida! Cada ano com você é um presente." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Parabéns, amor da minha vida! Cada ano com você é um presente."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário para quem faz meu coração bater mais forte todos os dias. Te amo infinitamente!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário para quem faz meu coração bater mais forte todos os dias. Te amo infinitamente!"
          </li>
        </ul>
      </div>
      
      <h3 id="mensagens-familia">3. Mensagem de Aniversário para Família</h3>
      
      <h4>3.1. Para Mãe</h4>
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Mãe, feliz aniversário! Que a sua sabedoria continue sendo luz na minha vida." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Mãe, feliz aniversário! Que a sua sabedoria continue sendo luz na minha vida."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Hoje celebramos a mulher extraordinária que você é. Feliz aniversário, mãezinha!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Hoje celebramos a mulher extraordinária que você é. Feliz aniversário, mãezinha!"
          </li>
        </ul>
      </div>
      
      <h4>3.2. Para Pai</h4>
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Parabéns, pai! Exemplo de força, caráter e amor." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Parabéns, pai! Exemplo de força, caráter e amor."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário para o homem que me ensinou o valor do trabalho e da honestidade." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário para o homem que me ensinou o valor do trabalho e da honestidade."
          </li>
        </ul>
      </div>
      
      <h3 id="mensagens-engracadas">4. Mensagem de Aniversário Engraçada</h3>
      <p>Uma boa dose de humor pode deixar qualquer aniversário mais divertido. Confira estas mensagens bem-humoradas para arrancar sorrisos e gargalhadas do aniversariante:</p>
      
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Você está ficando mais velho, mas pelo menos ainda lembra o seu nome!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Você está ficando mais velho, mas pelo menos ainda lembra o seu nome!"
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário! Que seus boletos não cheguem hoje!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário! Que seus boletos não cheguem hoje!"
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Parabéns por mais um ano sobrevivendo neste planeta maluco!" aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Parabéns por mais um ano sobrevivendo neste planeta maluco!"
          </li>
        </ul>
      </div>
      
      <h3 id="mensagens-colegas">5. Mensagem de Aniversário para Colegas e Chefes</h3>
      <p>No ambiente profissional, é importante manter um tom respeitoso, mas caloroso. Estas mensagens são perfeitas para colegas de trabalho e superiores:</p>
      
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Desejo a você muito sucesso, saúde e conquistas neste novo ciclo." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Desejo a você muito sucesso, saúde e conquistas neste novo ciclo."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário! Que o trabalho continue sendo fonte de inspiração e crescimento." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário! Que o trabalho continue sendo fonte de inspiração e crescimento."
          </li>
        </ul>
      </div>
      
      <h3 id="mensagens-curtas">6. Mensagens Curtas para WhatsApp e Cartões</h3>
      <p>Quando a objetividade é necessária, estas mensagens curtas e impactantes são perfeitas para WhatsApp, cartões ou stories:</p>
      
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário! Viva intensamente cada momento." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário! Viva intensamente cada momento."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Parabéns! Que a felicidade seja sua companheira constante." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Parabéns! Que a felicidade seja sua companheira constante."
          </li>
        </ul>
      </div>
      
      <h3 id="mensagens-religiosas">7. Mensagens Religiosas e Espirituais</h3>
      <p>Para quem valoriza a fé e a espiritualidade, estas mensagens trazem bênçãos e reflexões sobre o significado da vida:</p>
      
      <div class="bg-muted/20 p-4 rounded-lg border my-4">
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Que Deus abençoe sua vida com paz, saúde e realizações." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Que Deus abençoe sua vida com paz, saúde e realizações."
          </li>
          <li class="flex items-center gap-2">
            <button class="copy-button flex-shrink-0" data-text="Feliz aniversário! Que sua fé te guie em cada passo." aria-label="Copiar mensagem">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
            "Feliz aniversário! Que sua fé te guie em cada passo."
          </li>
        </ul>
      </div>
      
      <h3 id="dicas-personalizadas">8. Dicas de Como Escrever uma Mensagem de Aniversário Personalizada</h3>
      <p>Quer criar sua própria mensagem personalizada? Confira estas dicas para tornar seu texto único e memorável:</p>
      
      <ol class="space-y-4 pl-5 list-decimal">
        <li>
          <strong>Resgate memórias:</strong> Mencione momentos especiais que viveram juntos. "Lembra daquela viagem onde quase perdemos o avião? Que possamos criar mais memórias assim!"
        </li>
        <li>
          <strong>Use apelidos carinhosos:</strong> O uso de apelidos exclusivos demonstra intimidade e carinho. "Feliz aniversário, Luluzinha! Você ilumina meus dias."
        </li>
        <li>
          <strong>Mencione qualidades admiráveis:</strong> Destaque características que você admira na pessoa. "Sua determinação sempre me inspirou. Parabéns pelo seu dia!"
        </li>
        <li>
          <strong>Faça referências a gostos pessoais:</strong> Inclua elementos que a pessoa ama. "Que seu aniversário seja doce como chocolate amargo – seu favorito!"
        </li>
        <li>
          <strong>Compartilhe desejos específicos:</strong> Em vez de desejos genéricos, pense no que realmente importa para a pessoa. "Que este ano traga aquela promoção que você tanto merece!"
        </li>
      </ol>
      
      <div class="bg-primary/10 p-4 rounded-lg border border-primary/20 my-6">
        <h3 class="font-medium text-lg mb-2">Corrija sua mensagem antes de enviar!</h3>
        <p class="mb-3">Nada estraga mais uma bela mensagem de aniversário do que erros de português. Use o CorretorIA para garantir que sua mensagem esteja perfeita antes de enviar!</p>
        <a href="/" class="inline-block bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Corrigir minha mensagem agora</a>
      </div>
      
      <h3>Conclusão</h3>
      <p>Esperamos que estas mais de 100 mensagens de aniversário possam ajudá-lo a expressar todo o carinho e admiração que sente por pessoas especiais. Lembre-se que, independentemente das palavras escolhidas, o mais importante é a sinceridade e o amor com que são transmitidas.</p>
      
      <p>Que tal salvar suas frases favoritas para usar no momento certo? E se você já utilizou alguma destas mensagens ou tem sugestões de outras, compartilhe nos comentários!</p>
      
      <p>Gostou? Compartilhe com quem também vive travando na hora de escrever uma mensagem de aniversário!</p>
    `,
  },
}

export function BlogPostPageClient({ slug }: { slug: string }) {
  const post = blogPosts[slug]

  useEffect(() => {
    // No need to dynamically load the script, we'll use Next.js Script component
  }, [])

  if (!post) {
    notFound()
  }

  const formattedDate = new Date(post.date).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <>
      <BackgroundGradient />
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" asChild className="mb-4 pl-0">
            <Link href="/blog" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o blog
            </Link>
          </Button>

          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">{post.title}</h1>
            <div className="flex items-center text-foreground/60 space-x-4 text-sm">
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{post.readTime} de leitura</span>
              </div>
            </div>
          </header>

          <div className="aspect-video w-full bg-muted/50 relative overflow-hidden rounded-lg mb-8">
            <img
              src={post.coverImage || "/placeholder.svg"}
              alt="Amigos sorridentes com chapéus de festa celebrando aniversário com dois bolos e velas acesas"
              className="object-cover w-full h-full"
            />
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          <div className="mt-8 pt-6 border-t">
            <SharePost title={post.title} slug={slug} />
          </div>
        </div>
      </div>

      {/* Use Next.js Script component to properly load the script */}
      <Script src="/js/copy-message.js" strategy="afterInteractive" />
    </>
  )
}
