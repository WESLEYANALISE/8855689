

## Redesign da Pagina Escolher Plano

### Mudancas

**Arquivo: `src/pages/EscolherPlano.tsx`**

1. **Remover secao "Bonus exclusivo"** (o card verde com Evelyn) -- linhas 347-393 inteiras removidas

2. **Imagem de fundo Themis**: Adicionar a imagem `themis-face-closeup` como background da pagina inteira (similar ao Auth), com overlay escuro para legibilidade

3. **Titulo melhorado**: Trocar a fonte do "Como voce quer comecar?" para `font-serif` (Playfair Display, mesmo estilo do Auth) e centralizar melhor os cards com `max-w-md` e `items-center justify-center`

4. **Botao unico "Escolher esse"**: Remover os botoes "Comecar Gratis"/"Assinar" e "Ver mais" de cada card. Substituir por um unico botao "Escolher esse" em cada card

5. **Fluxo de detalhes em duas etapas**:
   - Ao clicar "Escolher esse", abre o Dialog de detalhes (ja existente) com:
     - Capa estendida preenchendo o topo
     - Lista COMPLETA de features
     - Botao "Confirmar escolha" no final
   - Ao clicar "Confirmar escolha", executa a acao (navegar para onboarding no gratuito, ou gerar Pix no vitalicio)

6. **Centralizar cards**: Usar `min-h-screen flex flex-col items-center justify-center` para posicionar os cards no centro vertical da tela

### Detalhes Tecnicos

```text
Arquivo: src/pages/EscolherPlano.tsx

REMOVER:
- Secao Bonus Evelyn (linhas 347-393) e Dialog do video bonus (linhas 380-393)
- Estado showBonusVideo
- Botoes "Ver mais" e "Comecar Gratis"/"Assinar" separados
- Import de Gift, MessageCircle, Play, Eye

ADICIONAR:
- Background image com overlay (themis-face-closeup + bg-gradient)
- font-serif no titulo principal
- Botao unico "Escolher esse" em cada card
- No Dialog: botao "Confirmar escolha" que executa handleFree ou handleLifetime
- min-h-screen com centralizacao vertical

FLUXO:
Card compacto (4 features + preco + "Escolher esse")
  → Click → Dialog com capa estendida + todas features
    → "Confirmar escolha" → executa acao (onboarding ou pix)
```

