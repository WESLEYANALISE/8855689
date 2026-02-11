

## Tela de Escolha de Plano pos-Cadastro

### Fluxo Atual vs Novo Fluxo

```text
ATUAL:  Cadastro (Auth) --> Onboarding (perfil) --> Home (tutorial carousel)

NOVO:   Cadastro (Auth) --> Escolha de Plano --> Onboarding (perfil) --> Home (tutorial/animacao)
```

### O que sera criado

Uma nova etapa intermediaria entre o cadastro e o onboarding, onde o usuario escolhe entre **Plano Gratuito** e **Plano Vitalicio (R$89,90)**. A tela apresenta dois cards lado a lado com todas as funcionalidades listadas, um bonus da Evelyn com video demonstrativo, e integracao com o fluxo de pagamento PIX existente.

---

### Estrutura da Tela de Planos

**Dois cards lado a lado (em mobile, empilhados):**

| Plano Gratuito (R$0) | Plano Vitalicio (R$89,90) |
|---|---|
| Chat Juridico (limitado) | Chat Juridico (ilimitado) |
| Flashcards (3 por dia) | Flashcards ilimitados |
| Dicionario Juridico | Dicionario Juridico |
| Constituicao Federal | Vade Mecum completo (+50 leis) |
| Codigo Civil e Penal | Todos os codigos e estatutos |
| Noticias Juridicas | Noticias + Analise IA |
| Videoaulas (2 gratis) | Todas as videoaulas |
| - | +30.000 questoes OAB |
| - | Mapas mentais |
| - | Resumos com IA |
| - | Simulados OAB |
| - | Peticoes e contratos |
| - | Audioaulas |
| - | Sumulas vinculantes |
| - | Trilhas OAB completas |
| - | Biblioteca completa |
| - | Sem anuncios |
| - | Suporte prioritario |
| Botao: "Comecar Gratis" | Botao: "Assinar Vitalicio" |

**Bonus da Evelyn:**
- Abaixo dos cards, uma secao com fundo degradê destacado
- Texto: "Bonus exclusivo: Evelyn, sua assistente juridica no WhatsApp"
- Botao "Ver bonus" que abre um modal/expansao com o video do YouTube (embed: HlE9u1c_MPQ) ja existente no app
- Valor: "Incluso no plano Vitalicio - R$89,90"

---

### Comportamento

1. **Apos o cadastro** (signup com sucesso no Auth.tsx), ao inves de redirecionar para `/onboarding`, redireciona para `/escolher-plano`
2. **Escolha "Comecar Gratis"**: redireciona para `/onboarding` (fluxo normal de escolha de perfil)
3. **Escolha "Assinar Vitalicio"**: abre o fluxo de pagamento PIX (reutiliza o hook `useMercadoPagoPix` existente). Apos pagamento aprovado, redireciona para `/onboarding` com uma flag de "premium"
4. **No Onboarding/Home**: se o usuario acabou de assinar, exibe uma animacao de parabens antes do tutorial carousel (confetti + texto "Voce agora e Premium!")
5. **Controle de acesso**: a rota `/escolher-plano` so aparece para usuarios novos (sem perfil completo). Usuarios existentes que ja passaram por ela nao veem novamente (controlado pelo mesmo fluxo de onboarding)

---

### Detalhes Tecnicos

**Novo arquivo: `src/pages/EscolherPlano.tsx`**
- Pagina fullscreen com fundo escuro elegante (mesmo estilo da pagina de Assinatura)
- Dois cards com scroll vertical para listar funcionalidades
- Icones de check (verde) para funcionalidades incluidas, X (cinza) para nao incluidas
- Card Vitalicio com borda dourada/primary e badge "RECOMENDADO"
- Secao de bonus Evelyn com botao que expande/abre modal com iframe do YouTube
- Integra com `useMercadoPagoPix` para pagamento
- Reutiliza `PixPaymentScreen` quando PIX for gerado

**Novo arquivo: `src/components/onboarding/PremiumCelebration.tsx`**
- Overlay animado com confetti (canvas-confetti ja instalado) e texto de parabens
- Exibido por 3-4 segundos antes de mostrar o intro carousel
- Controlado via query param ou localStorage flag `just_subscribed_{userId}`

**Arquivo modificado: `src/pages/Onboarding.tsx`**
- Atualizar `handleFinish` para verificar se veio da escolha de plano
- Manter o fluxo de escolha de perfil (universitario, concurseiro, etc.)

**Arquivo modificado: `src/hooks/useOnboardingStatus.tsx`**
- Adicionar verificacao: se o usuario nao escolheu plano ainda, considerar onboarding incompleto
- Nova chave localStorage: `plan_chosen_{userId}`

**Arquivo modificado: `src/components/auth/ProtectedRoute.tsx`**
- Adicionar redirecionamento para `/escolher-plano` se o usuario nao tiver escolhido plano
- Ordem: sem plano escolhido -> `/escolher-plano` -> sem perfil -> `/onboarding` -> app normal

**Arquivo modificado: `src/pages/Index.tsx`**
- Verificar flag `just_subscribed` para exibir `PremiumCelebration` antes do `IntroCarousel`

**Rota nova em `App.tsx`:**
- `/escolher-plano` como rota protegida com `skipOnboardingCheck`

---

### Design Visual

- Fundo: gradiente escuro (zinc-950 para black) com efeitos de glow sutis
- Cards: fundo card/95 com backdrop-blur, borda arredondada
- Card Vitalicio: borda dourada/amber, badge "RECOMENDADO" no topo
- Card Gratuito: borda neutra, visual mais simples
- Funcionalidades: lista com icones Check (verde) e X (vermelho/cinza)
- Bonus Evelyn: secao com gradiente verde/emerald sutil, icone WhatsApp
- Botoes: "Comecar Gratis" outline, "Assinar Vitalicio" primary com animacao pulsante
- Animacao de entrada: cards surgem com stagger do framer-motion
- Responsivo: cards lado a lado em telas maiores, empilhados em mobile

