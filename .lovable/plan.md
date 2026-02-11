

# Corrigir Animacao Fluida entre Entrar e Cadastrar

## Problema

A animacao trava porque o `AnimatePresence mode="wait"` com `key={mode}` **desmonta e remonta todo o formulario** ao alternar. Isso causa:
- O formulario inteiro sai (exit animation), depois o novo entra (enter animation) -- dois passos sequenciais
- Campos compartilhados (Email, Senha) sao destruidos e recriados desnecessariamente
- A mudanca brusca de altura do card causa um "pulo" visual

## Solucao

Remover o `AnimatePresence mode="wait"` do formulario inteiro e animar apenas os campos que realmente mudam:

1. **Manter fixos** os campos de Email e Senha (existem em ambos os modos)
2. **Animar individualmente** apenas os campos que aparecem/desaparecem:
   - Campo "Nome" (so no cadastro) -- entra/sai com transicao suave de altura + opacidade
   - Campo "Confirmar Senha" (so no cadastro) -- mesma transicao
   - Link "Esqueceu a senha?" (so no login)
   - Logo e titulo (so no login)
3. Usar `transition: max-height` + `opacity` via CSS em vez de Framer Motion para evitar re-renders

## Detalhes Tecnicos

### Arquivo: `src/pages/Auth.tsx`

- Remover o bloco `<AnimatePresence mode="wait">` + `<motion.div key={mode}>` que envolve todo o formulario (linhas 428-600)
- Manter cada campo individual com sua propria animacao leve:

```text
// Campo Nome -- aparece suavemente so no signup
<div className={`grid transition-all duration-300 ease-out ${
  mode === 'signup' 
    ? 'grid-rows-[1fr] opacity-100' 
    : 'grid-rows-[0fr] opacity-0'
}`}>
  <div className="overflow-hidden">
    {/* conteudo do campo Nome */}
  </div>
</div>
```

- Mesma tecnica para o campo "Confirmar Senha"
- O campo Email e Senha ficam sempre renderizados (sem animacao de entrada/saida)
- A logo do login usa apenas `opacity` + `max-height` para aparecer/sumir suavemente

### Resultado

- Zero desmontagem de componentes ao alternar
- Campos compartilhados mantem foco e valor
- Transicao de altura suave e continua via CSS (acelerada por GPU)
- Sem dependencia do Framer Motion para esta parte (mais leve)

