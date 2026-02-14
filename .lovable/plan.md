

## Plano: Ajustar fundo da aba Jornada para ficar dentro do container cinza arredondado

### Problema atual
A imagem de fundo na aba Jornada usa posicionamento `fixed`, fazendo ela cobrir a tela inteira (incluindo o hero). Alem disso, o container principal fica `bg-transparent` quando na Jornada, removendo o fundo cinza arredondado que existe nas outras abas.

### Mudancas

**1. `src/pages/Index.tsx` (linha 331)**
- Restaurar `bg-muted` para todas as abas (remover a condicional `bg-transparent` para jornada)
- O container cinza arredondado (`rounded-t-[32px] bg-muted`) sera consistente em todas as abas

**2. `src/components/home/JornadaHomeSection.tsx`**
- Alterar o `InstantBackground` para usar `fixed={false}` (posicionamento `absolute` em vez de `fixed`), fazendo a imagem ficar contida dentro do container da secao
- Manter o `rounded-t-[32px]` e `overflow-hidden` no container para preservar as bordas arredondadas
- Adicionar padding top (`pt-6`) para manter espacamento consistente com a aba Estudos

### Detalhes tecnicos

```text
Antes:
  Index.tsx container -> bg-transparent (jornada)
  InstantBackground -> fixed (cobre tela inteira)

Depois:
  Index.tsx container -> bg-muted (sempre)
  InstantBackground -> absolute (contido no container arredondado)
```

A chave e passar `fixed={false}` no `InstantBackground`, que faz o componente usar `position: absolute` em vez de `position: fixed`. Combinado com `overflow-hidden` e `rounded-t-[32px]` no container pai, a imagem ficara restrita ao area cinza arredondada, exatamente como o usuario deseja.

