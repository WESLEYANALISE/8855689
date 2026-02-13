

# Plano: Tornar Cadastro, Onboarding e Tutorial Responsivos para Desktop

## Resumo

O app atualmente funciona bem no mobile, mas no desktop as telas de onboarding ("Qual e o seu objetivo?") e o tutorial (IntroCarousel) ficam com layout mobile esticado. Este plano ajusta essas telas e aplica melhorias gerais de responsividade.

---

## 1. Onboarding - Tela "Qual e o seu objetivo?" (Desktop)

**Problema**: O card com os 4 perfis fica estreito (`max-w-lg`) mesmo em tela grande, como mostra a imagem enviada.

**Solucao**:
- No desktop (`lg:`), expandir o container central para `max-w-2xl` ou `max-w-3xl`
- Aumentar os cards do grid 2x2 para ficarem maiores e mais espaçados
- O card de conteudo (`bg-card/95`) fica mais largo no desktop com padding maior
- Os cards de perfil ganham aspect-ratio mais retangular no desktop em vez de quadrado
- Botoes "Voltar" e "Finalizar" ficam maiores no desktop

**Arquivo**: `src/pages/Onboarding.tsx`

---

## 2. IntroCarousel - Tutorial (Desktop)

**Problema**: O conteudo fica alinhado a esquerda com `max-w-2xl`, funciona bem mas pode melhorar no desktop.

**Solucao**:
- No desktop, centralizar melhor o conteudo verticalmente
- Aumentar tamanhos de fonte do titulo (`lg:text-5xl`)
- Feature pills maiores no desktop
- Dots e botao "Proximo" com mais espaco e tamanho no desktop
- Manter o layout atual que ja esta razoavel, apenas refinando proporcoes

**Arquivo**: `src/components/onboarding/IntroCarousel.tsx`

---

## 3. Pagina de Auth/Cadastro (Desktop)

**Problema**: A pagina Auth ja tem layout desktop com 3 colunas (Themis esquerda + formulario + Themis close-up direita). Ja esta responsiva.

**Acao**: Pequenos ajustes de refinamento se necessario, mas a estrutura principal ja existe.

**Arquivo**: `src/pages/Auth.tsx`

---

## 4. Componente ResponsiveContainer

**Criar** um componente reutilizavel `ResponsiveContainer` que centraliza conteudo e aplica largura maxima automaticamente conforme o breakpoint.

**Arquivo novo**: `src/components/layout/ResponsiveContainer.tsx`

---

## 5. Hook useMediaQuery

**Criar** um hook utilitario simples para queries de media, complementando o `useDeviceType` existente.

**Arquivo novo**: `src/hooks/useMediaQuery.ts`

---

## Detalhes Tecnicos

### Onboarding.tsx - Mudancas principais:

```text
Container principal:
- De: "w-full max-w-lg"
- Para: "w-full max-w-lg lg:max-w-2xl xl:max-w-3xl"

Card wrapper:
- De: "p-6 sm:p-8"  
- Para: "p-6 sm:p-8 lg:p-10 xl:p-12"

Grid dos perfis:
- De: "grid grid-cols-2 gap-3"
- Para: "grid grid-cols-2 gap-3 lg:gap-5"

Cards individuais:
- No desktop: aspect-ratio mais retangular, textos maiores

Titulo "Qual e o seu objetivo?":
- De: "text-2xl"
- Para: "text-2xl lg:text-3xl"
```

### IntroCarousel.tsx - Mudancas principais:

```text
Conteudo:
- De: "max-w-2xl mx-auto"
- Para: "max-w-2xl lg:max-w-4xl mx-auto"

Titulo:
- De: "text-3xl md:text-4xl"
- Para: "text-3xl md:text-4xl lg:text-5xl xl:text-6xl"

Descricao:
- De: "text-base md:text-lg"
- Para: "text-base md:text-lg lg:text-xl"

Feature pills:
- Desktop: padding e fonte maiores

Bottom controls:
- Desktop: mais espaco, botoes maiores
```

### ResponsiveContainer.tsx:

```text
Componente simples que aplica:
- mx-auto px-4 sm:px-6 lg:px-8
- max-w configuravel (sm/md/lg/xl/2xl/full)
- Reutilizavel em todas as paginas
```

---

## Ordem de Implementacao

1. Criar `ResponsiveContainer` e `useMediaQuery`
2. Ajustar `Onboarding.tsx` para desktop
3. Ajustar `IntroCarousel.tsx` para desktop
4. Testar em resolucoes 1920x1080, 1366x768 e 1280x720

