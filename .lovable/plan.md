
# Plano: Melhorar Aula Interativa de Artigos (Estilo OAB Trilhas)

## Problemas Identificados

1. **Prompt insuficiente**: O prompt atual do `gerar-slides-artigo` não tem o tom didático e acolhedor do chat da professora ou do OAB Trilhas
2. **Falta de introdução**: Não há slide de boas-vindas explicando o que o aluno vai aprender
3. **Formatação ruim**: Slides vindo mal formatados, sem a estrutura de explicação parte por parte
4. **Sem exercícios funcionais**: Flashcards e questões não estão aparecendo/funcionando corretamente
5. **Sem capa gerada**: Não está gerando capa por código (CP, CC, CF) como no OAB Trilhas

---

## Parte 1: Reescrever Prompt de Geração de Slides

### Problema
O prompt atual é genérico e não tem o estilo conversacional e didático do OAB Trilhas.

### Solução
Reescrever o prompt do `gerar-slides-artigo` baseado no prompt do `gerar-conteudo-oab-trilhas`:

```text
ESTILO DE ESCRITA (OBRIGATÓRIO):
- Escreva como CONVERSA, use expressões como "Olha só...", "Percebeu?", "Veja bem..."
- Perguntas retóricas para engajar: "E por que isso importa tanto?"
- Analogias com situações do dia a dia
- Explicar TODO termo técnico ou em latim
- Exemplos práticos imediatos
- NUNCA comece com gírias informais como "E aí galera"

ESTRUTURA OBRIGATÓRIA:
- Slide 1: Introdução acolhedora ("Olá! Vamos dominar este artigo juntos...")
- Slides de texto: Explicar PARTE POR PARTE do artigo, palavra por palavra
- Usar blockquotes para citações: > "Art. X..."
- Cards visuais: > ⚠️ ATENÇÃO, > 💡 DICA
- Mínimo 200-400 palavras por slide de texto
```

### Seções Obrigatórias

1. **Introdução** (5-7 slides)
   - Boas-vindas calorosas
   - O que você vai aprender
   - Por que este artigo é importante
   - Termos-chave que aparecerão

2. **Leitura do Artigo** (6-10 slides)
   - Texto literal da lei (blockquote)
   - Explicação PALAVRA POR PALAVRA
   - "Olha só, quando a lei diz X, ela quer dizer..."
   - Cada conceito em slide separado

3. **Aprofundamento** (8-12 slides)
   - Detalhamento de cada elemento
   - Doutrina e jurisprudência
   - Exceções e regras especiais

4. **Aplicação Prática** (8-10 slides)
   - 3-4 casos práticos com nomes (João, Maria)
   - "Imagine que você é advogado e..."
   - Situação -> Problema -> Solução

5. **Pegadinhas de Prova** (5-7 slides)
   - "Atenção! As bancas adoram..."
   - Regra vs Exceção em tabela
   - Como identificar a resposta certa

6. **Revisão Final** (8-10 slides)
   - Resumo em pontos
   - 4-5 QuickChecks interativos
   - "Lembra o que aprendemos?"
   - Técnica de memorização final

---

## Parte 2: Gerar Capa por Código

### Problema
Cada código (CP, CC, CF) deve ter UMA capa única que será usada para TODOS os artigos daquele código.

### Solução
Criar edge function `gerar-capa-codigo` que:
1. Verifica se já existe capa para o código na tabela `codigos_capas`
2. Se não existir, gera uma capa representativa do código
3. Usa a mesma API de geração de imagem do OAB Trilhas

### Prompt de Geração de Capa
```text
CINEMATIC 16:9 horizontal illustration, EDGE-TO-EDGE composition with NO white borders.
Dark rich background in deep navy and burgundy tones.
Brazilian legal theme representing "${codigoNome}" (${codigoTabela}).
Elements: scales of justice, law books, abstract geometric patterns.
Professional, sophisticated mood for legal education.
Modern minimal style with dramatic lighting.
NO TEXT, NO PEOPLE FACES, NO WORDS.
```

### Fluxo
```
Usuário abre Aula Interativa do Art. 1 do CP
           ↓
   Existe capa em codigos_capas para "CP"?
         /          \
       SIM          NÃO
        ↓            ↓
   Usar capa    Gerar capa via
   existente    gerar-capa-codigo
        ↓            ↓
   ← ← ← ← ← ← ← ← ↓
           ↓
   Salvar em codigos_capas
   (para reutilizar em outros artigos)
```

---

## Parte 3: Garantir Flashcards e Questões

### Problema
Os flashcards e questões estão sendo gerados mas não funcionam corretamente.

### Solução
1. Validar que o JSON retornado tem `flashcards` e `questoes` com dados
2. Garantir formato correto das questões:
   - `question` (string)
   - `options` (array de 4 strings)
   - `correctAnswer` (número 0-3)
   - `explicacao` (string)
3. Exigir no mínimo 10 flashcards e 8 questões

---

## Parte 4: Melhorar Tela de Introdução

### Problema
A tela de introdução não está seguindo o padrão do OAB Trilhas com os 3 módulos numerados.

### Solução
Ajustar o componente para usar o layout exato do `OABTrilhasTopicoIntro`:
- Módulo 1: Começar Leitura (vermelho/laranja)
- Módulo 2: Flashcards (roxo) - bloqueado até completar leitura
- Módulo 3: Praticar (verde) - bloqueado até completar flashcards

---

## Arquivos a Modificar

### Edge Functions
1. `supabase/functions/gerar-slides-artigo/index.ts` - Reescrever prompt completo
2. `supabase/functions/gerar-capa-codigo/index.ts` - Nova função para gerar capas

### Componentes
3. `src/components/AulaArtigoSlidesViewer.tsx` - Usar layout do OABTrilhasTopicoIntro

### Configuração
4. `supabase/config.toml` - Adicionar nova edge function

---

## Exemplo de Slide com Tom Correto

### ANTES (atual - ruim)
```
Título: "Conceito de Lei Penal no Tempo"
Conteúdo: "A lei penal no tempo é um princípio que..."
```

### DEPOIS (esperado - bom)
```
Título: "Vamos Entender o Art. 2 - Parte por Parte"
Conteúdo: "Olha só, vamos ler juntos o que diz o artigo:

> 'Ninguém pode ser punido por fato que lei posterior deixa de considerar crime...'

Percebeu? A lei está dizendo algo MUITO importante aqui. Vamos destrinchar:

1. **'Ninguém pode ser punido'** - Isso é uma proibição absoluta! O Estado não pode punir...

2. **'por fato que lei posterior'** - Aqui a lei fala de uma situação curiosa: e se você cometeu algo que ERA crime, mas depois uma nova lei disse que não é mais?

💡 **EXEMPLO PRÁTICO:** 
Imagine que João foi preso por um crime X em 2020. Em 2021, uma nova lei diz que X não é mais crime. O que acontece com João?

Pela **abolitio criminis**, João deve ser solto! A lei nova mais benéfica retroage para beneficiá-lo.

⚠️ **ATENÇÃO:** Isso é diferente da lei mais grave, que NUNCA retroage!"
```

---

## Detalhes Técnicos

### Estrutura do Prompt Atualizado

O novo prompt terá:
1. Tom conversacional igual ao OAB Trilhas
2. Exigência de explicar palavra por palavra
3. Uso obrigatório de exemplos com nomes (João, Maria)
4. Blockquotes para citações legais
5. Cards de atenção e dica
6. QuickChecks ao longo do conteúdo
7. Mínimo de 45 slides, 10 flashcards, 8 questões
