
# Plano: Grifo Automático de Termos-Chave pela Gemini

## Contexto Atual

O sistema atual tem dois mecanismos de destaque de termos:

1. **`EnrichedMarkdownRenderer`** (frontend):
   - Destaca termos entre aspas simples `'termo'` ou duplas `"termo"`
   - Destaca automaticamente termos latinos (habeas corpus, ex tunc) e jurídicos
   - Transforma `Art. 5º` em popovers clicáveis

2. **`highlightKeyTerms.tsx`** (frontend):
   - Aplica regex para detectar idades, leis, valores, prazos
   - Converte em `<mark class="key-term">` para destaque visual
   - **Problema**: Não está sendo usado no `ConceitoSlideCard.tsx`

3. **Prompt da Gemini** (edge function):
   - Instrui tom conversacional
   - **Falta**: Instruir a marcar termos-chave com aspas simples

## Problema Identificado

A Gemini gera texto como:
```
"Pessoas a partir de 16 anos podem votar, conforme a Lei 9.504/97..."
```

Mas deveria gerar:
```
"Pessoas a partir de '16 anos' podem votar, conforme a 'Lei 9.504/97'..."
```

Assim o `EnrichedMarkdownRenderer` detectaria e destacaria automaticamente.

## Solução em 2 Partes

### Parte 1: Atualizar Prompt da Gemini

Adicionar instrução explícita no `promptBase` para marcar termos-chave:

```text
═══ GRIFO DE TERMOS-CHAVE ═══
Marque AUTOMATICAMENTE com aspas simples os seguintes tipos de informação importante:

• IDADES: '16 anos', '18 anos', '35 anos de idade'
• LEIS E ARTIGOS: 'Lei 9.504/97', 'Art. 5º da CF', 'LC 64/90'
• PRAZOS: '30 dias', '90 dias úteis', 'prazo de 15 dias'
• VALORES: 'R$ 5.000', '10 salários mínimos'
• PORCENTAGENS: '50%', '10,5%'
• DATAS: '15 de agosto', '1º de janeiro'
• MULTAS: 'multa de R$ 1.000 a R$ 5.000'

EXEMPLO DE APLICAÇÃO:
❌ ERRADO: "O voto é facultativo para maiores de 16 anos e obrigatório para maiores de 18 anos."
✅ CERTO: "O voto é facultativo para maiores de '16 anos' e obrigatório para maiores de '18 anos'."

❌ ERRADO: "Conforme o Art. 14 da Constituição Federal..."
✅ CERTO: "Conforme o 'Art. 14 da Constituição Federal'..."
```

### Parte 2: Aplicar highlightKeyTerms como Fallback

Para conteúdo já gerado (ou caso a Gemini esqueça), aplicar o `highlightKeyTerms` no `ConceitoSlideCard.tsx`:

- Importar a função `highlightKeyTerms`
- Aplicar nos renders de `termos`, `definicao`, e no conteúdo de texto antes de passar ao `EnrichedMarkdownRenderer`

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/gerar-conteudo-oab-trilhas/index.ts` | Adicionar seção "GRIFO DE TERMOS-CHAVE" no promptBase (duas ocorrências: modo tópico e modo resumo) |

## Impacto

- **Conteúdo novo**: Será gerado com aspas simples nos termos-chave, que serão destacados automaticamente pelo frontend
- **Conteúdo existente**: Precisa ser regenerado para aplicar o novo formato

## Exemplo Visual

Antes:
```
O voto é facultativo para maiores de 16 anos.
```

Depois:
```
O voto é facultativo para maiores de '16 anos'.
```

Resultado na tela: "O voto é facultativo para maiores de [**16 anos**]." (com destaque visual clicável)

## Correção do Erro de Build

O erro de build atual é causado pelo tamanho excessivo dos chunks. Isso será corrigido automaticamente na próxima compilação.
