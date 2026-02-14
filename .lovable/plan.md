

## Plano: Corrigir fundo fixo e remover margens cinzas na aba Jornada

### Problemas atuais
1. A imagem de fundo se move junto com o conteudo (sticky nao funciona bem neste contexto)
2. Bordas/fundo cinza (`bg-muted`) aparecem ao redor do conteudo da Jornada, quando deveria ser todo escuro

### Mudancas

**1. `src/pages/Index.tsx` (linha 331)**
- Usar `bg-transparent` quando a aba ativa for `jornada`, mantendo `bg-muted` para as demais abas
- Isso remove o fundo cinza que aparece nas laterais e bordas

**2. `src/components/home/JornadaHomeSection.tsx`**
- Remover o wrapper sticky/h-0 que nao funciona corretamente
- Usar o `InstantBackground` com `fixed={false}` dentro de um container com `position: absolute`, `inset-0` e `rounded-t-[32px]` + `overflow-hidden`
- A diferenca e que o container do background tera `position: fixed` simulada via CSS: usar `position: sticky; top: 0; height: 100vh` dentro de um wrapper absoluto, OU simplesmente usar `fixed={true}` no InstantBackground mas clipar com `clip-path` no container pai
- Abordagem mais simples: usar CSS `background-attachment: fixed` via estilo inline na imagem, mas o InstantBackground usa `<img>`, entao a melhor solucao e:
  - Manter `fixed={false}` (absolute)
  - O container da imagem tera altura fixa (`h-screen`) e `top-0` fixo
  - O container pai tera `overflow: hidden` apenas nas bordas superiores via `clip-path: inset(0 round 32px 32px 0 0)`

**Solucao final simplificada:**

- No `Index.tsx`: mudar para `bg-[#0d0d14]` (fundo escuro) quando `mainTab === 'jornada'`, em vez de `bg-muted`
- No `JornadaHomeSection.tsx`:
  - Container principal: `relative min-h-[60vh]` (sem rounded/overflow - deixar o pai do Index cuidar)
  - Background: usar `fixed={true}` no InstantBackground (volta a ser fixo na tela) 
  - No `Index.tsx`, adicionar `overflow-hidden` ao container principal para que o `rounded-t-[32px]` corte a imagem fixa

### Detalhes tecnicos

```text
Index.tsx container:
  - jornada: bg-[#0d0d14] rounded-t-[32px] overflow-hidden
  - outras abas: bg-muted rounded-t-[32px]

JornadaHomeSection.tsx:
  - InstantBackground fixed={true} (imagem fixa na viewport)
  - O overflow-hidden + rounded-t-[32px] do container pai corta a imagem
  - Gradient overlay de-black/50 via-black/60 to-[#0d0d14]
  - Conteudo com z-10 relativo por cima
```

O `overflow: hidden` combinado com `border-radius` no container pai cria um "clip" natural que restringe a imagem fixa ao formato arredondado. A imagem fica parada enquanto o conteudo (niveis serpentina) rola por cima.
