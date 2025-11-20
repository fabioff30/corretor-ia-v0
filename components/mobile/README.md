# Mobile Components - CorretorIA

Redesign experimental da interface mobile para proporcionar experiência similar a um aplicativo nativo.

## 📱 Componentes Criados

### Core Components

#### `MobileHero`
Hero section otimizado para mobile com layout full-screen.

**Features:**
- Layout `min-h-[100dvh]` para aproveitar toda a viewport dinâmica
- Safe area padding para notches/Dynamic Island
- Badge de premium animado
- Integração com `MobileCorrectionInput` e `MobileQuickStats`
- Animações suaves com Framer Motion

**Props:**
```typescript
{
  onSubmit?: (text: string) => void
  onFileUpload?: () => void
  isLoading?: boolean
}
```

#### `MobileCorrectionInput`
Input de texto simplificado e otimizado para touch.

**Features:**
- Auto-focus ao montar
- Haptic feedback na primeira letra digitada
- Textarea de altura mínima 60vh (full-screen)
- Character counter com backdrop blur
- Upload button flutuante
- Validação de limite de caracteres
- Estado de loading com spinner
- Tamanho de fonte otimizado (text-lg)

**Props:**
```typescript
{
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
  characterLimit?: number | null
  onFileUpload?: () => void
  placeholder?: string
}
```

#### `MobileQuickStats`
Estatísticas compactas inline (rating + uso diário).

**Features:**
- Rating com estrela preenchida
- Contador de usos para plano free
- Badge "Ilimitado" para premium
- Layout horizontal compacto

**Props:**
```typescript
{
  rating?: number
  reviewCount?: number
  usageCount?: number
  usageLimit?: number
  isPremium?: boolean
}
```

#### `MobileBottomDrawer`
Drawer inferior com swipe para fechar e opções avançadas.

**Features:**
- Drag to dismiss (threshold de 50px)
- Backdrop com blur
- Toggle de IA Avançada (GPT-4 vs GPT-3.5)
- Seletor de tom (formal, casual, profissional, amigável)
- Upload de arquivo
- Haptic feedback em todas as interações
- Safe area support

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  onAIToggle?: (enabled: boolean) => void
  onToneSelect?: (tone: string) => void
  onFileUpload?: () => void
  aiEnabled?: boolean
  children?: React.ReactNode
}
```

#### `MobileFAB`
Floating Action Button com speed dial.

**Features:**
- Botão flutuante fixo (bottom-right)
- Speed dial com 5 ações:
  - ⚙️ Opções (abre bottom drawer)
  - 📤 Upload de arquivo
  - ✨ IA Avançada (toggle)
  - 🕐 Histórico
  - ❓ Ajuda
- Animação de rotação ao abrir (45°)
- Backdrop blur quando aberto
- Labels com animação staggered
- Haptic feedback
- Ripple effect ao clicar

**Props:**
```typescript
{
  onSettingsClick?: () => void
  onFileUpload?: () => void
  onHistoryClick?: () => void
  onHelpClick?: () => void
  onAIToggle?: () => void
  className?: string
}
```

#### `MobileCorrectionWrapper`
Wrapper que orquestra todos os componentes mobile.

**Features:**
- Gerencia estado do drawer
- Gerencia estado do AI toggle
- Coordena interações entre FAB, Hero, e Drawer
- Layout full-screen

**Props:**
```typescript
{
  onCorrect?: (text: string) => void
  onFileUpload?: () => void
  isLoading?: boolean
}
```

### Hooks

#### `useIsMobile()`
Detecta se o dispositivo está em viewport mobile (≤768px).

**Returns:** `boolean`

**Features:**
- Media query responsiva
- Event listener para rotação/resize
- Cleanup automático

#### `useOrientation()`
Detecta orientação do dispositivo.

**Returns:** `'portrait' | 'landscape'`

#### `useSafeArea()`
Retorna valores de safe area insets (iOS notch/Dynamic Island).

**Returns:**
```typescript
{
  top: number
  bottom: number
  left: number
  right: number
}
```

#### `useHaptic()`
Hook base para haptic feedback.

**Returns:**
```typescript
{
  vibrate: (pattern: HapticPattern) => void
  cancel: () => void
  light: () => void
  medium: () => void
  heavy: () => void
  success: () => void
  error: () => void
  warning: () => void
}
```

#### `useCorrectionHaptic()`
Hook pré-configurado para correção de texto.

**Returns:**
```typescript
{
  onTextStart: () => void    // Light haptic
  onButtonPress: () => void  // Medium haptic
  onSuccess: () => void      // Success pattern
  onError: () => void        // Error pattern
}
```

## 🎨 CSS Utilities Adicionadas

### Safe Area Padding
```css
.pt-safe  /* padding-top com safe-area-inset-top */
.pb-safe  /* padding-bottom com safe-area-inset-bottom */
.pl-safe  /* padding-left com safe-area-inset-left */
.pr-safe  /* padding-right com safe-area-inset-right */
```

### Dynamic Viewport
```css
.min-h-dvh  /* min-height: 100dvh - melhor que vh em mobile */
.h-dvh      /* height: 100dvh */
```

### Touch Utilities
```css
.tap-target      /* min-width/height: 44px - iOS guidelines */
.smooth-scroll   /* -webkit-overflow-scrolling: touch */
.no-select       /* user-select: none */
.touch-ripple    /* Ripple effect ao tocar */
```

### Mobile Animations
```css
.animate-bounce-subtle  /* Bounce sutil infinito */
.animate-pulse-ring     /* Pulse com anel expandindo */
```

## 🔧 Integração

### No HeroSection
```tsx
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileCorrectionWrapper } from "@/components/mobile"

export function HeroSection() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileCorrectionWrapper />
  }

  // Desktop layout...
}
```

## 📐 Design Decisions

### Layout
- **Full-screen first**: `min-h-[100dvh]` para maximizar espaço útil
- **Minimalista**: Apenas corretor de texto acima da fold
- **Safe areas**: Suporte para notches e Dynamic Island (iOS)

### Interações
- **Haptic feedback**: Vibração em todas as interações importantes
- **Swipe gestures**: Drawer deslizável para fechar
- **Touch targets**: Mínimo 44px (Apple HIG)
- **Auto-focus**: Input recebe foco automaticamente

### Animações
- **Framer Motion**: Animações fluidas e performáticas
- **Spring physics**: Animações naturais com bounce
- **Staggered**: Labels aparecem em sequência no FAB
- **Micro-interactions**: Feedback visual em cada ação

### Performance
- **Lazy loading**: Drawer só renderiza quando aberto
- **AnimatePresence**: Desmonta componentes ao fechar
- **Backdrop blur**: CSS backdrop-filter nativo
- **GPU acceleration**: Transform e opacity para animações

## 🎯 UX Patterns

### Progressive Disclosure
1. **Input principal** sempre visível (hero)
2. **FAB** para ações rápidas
3. **Drawer** para opções avançadas

### Feedback Loops
1. **Visual**: Animações e transições
2. **Háptico**: Vibrações em ações
3. **Sonoro**: Pode ser adicionado futuramente

### Error Prevention
- Character counter sempre visível
- Botão submit desabilitado se over limit
- Loading states claros

## 📱 Device Support

### Tested Breakpoints
- **Mobile**: ≤768px
- **Desktop**: >768px

### Recommended Test Devices
- iPhone SE (small screen)
- iPhone 14 Pro (notch)
- iPhone 14 Pro Max (large + notch)
- iPad Mini (tablet)

## 🚀 Future Improvements

- [ ] Conectar com API de correção real
- [ ] Implementar histórico de correções
- [ ] Adicionar página de ajuda/tutorial
- [ ] Gesture de swipe entre correção/reescrita
- [ ] Pull-to-refresh
- [ ] Modo offline com cache
- [ ] PWA manifest para "Add to Home Screen"
- [ ] Dark mode otimizado para OLED

## 📝 Notes

**Status**: Experimental - Não commitado
**Tempo estimado**: 6-8 horas de desenvolvimento
**Componentes criados**: 7 componentes + 5 hooks + CSS utilities
