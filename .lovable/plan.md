
# Plano: Corrigir Problemas de Conteúdo OAB Trilhas

## Problemas Identificados

Analisando o código e as imagens enviadas, identifiquei **4 problemas distintos**:

### Problema 1: Saudações repetidas em slides subsequentes
- **Causa**: O conteúdo gerado mostra "E aí, galera!" no slide 6/36 (não é introdução)
- **Arquivo afetado**: `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`
- **Status do prompt atual**: O prompt JÁ instrui para NÃO usar saudações fora da introdução, mas a IA ignora
- **Solução**: Reforçar drasticamente as instruções no prompt com exemplos negativos explícitos e validação posterior

### Problema 2: Termos não estão sendo grifados
- **Causa**: O `EnrichedMarkdownRenderer` possui a lógica de grifo (termos latinos, juristas, termos jurídicos), mas pode não estar processando o conteúdo corretamente quando recebido via slides
- **Arquivo afetado**: `src/components/conceitos/slides/ConceitoSlideCard.tsx`
- **Status atual**: O componente usa `EnrichedMarkdownRenderer`, que já tem os arrays de termos automáticos
- **Solução**: Verificar se `disableTermos` está sendo passado corretamente e garantir que o renderer está ativo

### Problema 3: Artigos clicáveis não abrem o popover
- **Causa**: O `ArtigoPopover` existe e tem a lógica de busca no Vade Mecum, mas algo pode estar impedindo a abertura
- **Arquivo afetado**: `src/components/conceitos/ArtigoPopover.tsx`
- **Verificação**: A imagem mostra que "Art. 2° do CPP" está destacado em laranja/amarelo, indicando que o componente está sendo renderizado
- **Possível problema**: A query no Supabase pode estar falhando ou a tabela "CPP - Código de Processo Penal" pode não existir/ter nome diferente
- **Solução**: Melhorar o mapeamento de tabelas e adicionar logs de debug

### Problema 4: Último slide não é Síntese Final
- **Causa**: O código em `gerar-conteudo-oab-trilhas` JÁ gera a síntese final (linhas 639-695)
- **Status**: A síntese é adicionada como última seção com `tipo: "resumo"`
- **Possível problema**: O conteúdo atual no banco foi gerado ANTES dessa implementação ser adicionada
- **Solução**: Verificar se o conteúdo precisa ser regenerado; adicionar validação para garantir que a síntese aparece

---

## Alteracoes Tecnicas Detalhadas

### Arquivo 1: `supabase/functions/gerar-conteudo-oab-trilhas/index.ts`

**Mudancas no promptBase (linha 325-359):**

```typescript
// Adicionar regras MUITO mais enfáticas sobre saudações
const promptBase = `Você é um professor de Direito didático e acolhedor, preparando FUTUROS ADVOGADOS...

## ⛔⛔⛔ PROIBIDO - REGRAS DE SAUDAÇÃO ⛔⛔⛔
VOCÊ SERÁ PENALIZADO SE USAR QUALQUER SAUDAÇÃO FORA DO SLIDE "introducao" DA SEÇÃO 1.

❌ EXEMPLOS DE TEXTO PROIBIDO (NÃO USE!):
- "E aí, galera!"
- "Vamos lá!"  
- "Olha só!"
- "Bora entender..."
- "E aí, futuro colega!"
- "Vamos mergulhar..."
- "Tá preparado?"

✅ COMO COMEÇAR SLIDES QUE NÃO SÃO INTRODUÇÃO:
- "O conceito de tipicidade..."
- "A doutrina majoritária entende que..."
- "Quando analisamos o artigo..."
- "É fundamental compreender..."

APENAS o slide tipo "introducao" da PRIMEIRA seção pode ter saudação.
`;
```

**Adicionar validação pós-geração para remover saudações (após linha 512):**

```typescript
// Após gerar cada seção, limpar saudações indevidas
const saudacoesProibidas = [
  /^E aí,?\s*(galera|futuro|colega|pessoal)?[!,.\s]/gi,
  /^Olha só[!,.\s]/gi,
  /^Vamos lá[!,.\s]/gi,
  /^Bora\s/gi,
  /^Tá preparado/gi,
  /^Vamos mergulhar/gi,
];

// Limpar saudações de slides que não são introdução
for (const slide of secaoCompleta.slides) {
  if (slide.tipo !== 'introducao' && slide.conteudo) {
    for (const regex of saudacoesProibidas) {
      slide.conteudo = slide.conteudo.replace(regex, '');
    }
    // Remover espaços iniciais após limpeza
    slide.conteudo = slide.conteudo.trim();
  }
}
```

---

### Arquivo 2: `src/components/conceitos/ArtigoPopover.tsx`

**Melhorar mapeamento de tabelas (linha 45-57):**

```typescript
const mapearTabelaParaBanco = (codigo: string): string => {
  const mapeamento: Record<string, string> = {
    "codigo-civil": "CC - Código Civil",
    "codigo-penal": "CP - Código Penal",
    "constituicao-federal": "CF - Constituição Federal",
    "clt": "CLT - Consolidação das Leis do Trabalho",
    "cpc": "CPC - Código de Processo Civil",
    "cpp": "CPP - Código de Processo Penal",  // <- ESSE É O QUE PRECISA FUNCIONAR
    "cdc": "CDC - Código de Defesa do Consumidor",
    "eca": "ECA - Estatuto da Criança e do Adolescente",
    "ctn": "CTN - Código Tributário Nacional",
    "lep": "LEP - Lei de Execução Penal",
    "lei-maria-penha": "Lei Maria da Penha",
  };
  return mapeamento[codigo] || "CC - Código Civil";
};
```

**Melhorar detecção de tabela pelo contexto (linha 31-42):**

```typescript
const detectarTabela = (artigo: string, contexto?: string): string => {
  const textoLower = `${artigo} ${contexto || ''}`.toLowerCase();
  
  // Detecção mais específica
  if (textoLower.includes('cpp') || textoLower.includes('processo penal') || textoLower.includes('código de processo penal')) {
    return "cpp";
  }
  if (textoLower.includes('cp') && !textoLower.includes('cpp') && !textoLower.includes('cpc')) {
    return "codigo-penal";
  }
  // ... resto da lógica
};
```

**Melhorar a query de busca (linhas 89-111) para CPP:**

```typescript
// Busca mais robusta com múltiplas variações
const { data: artigoVadeMecum, error: vmError } = await supabase
  .from(tabelaMapeada as any)
  .select('Artigo, "Número do Artigo"')
  .or(`"Número do Artigo".eq.Art. ${numeroArtigo},` +
      `"Número do Artigo".eq.Art. ${numeroArtigo}º,` +
      `"Número do Artigo".eq.Art. ${numeroArtigo}°,` +
      `"Número do Artigo".ilike.Art.%${numeroArtigo}%`)
  .limit(1)
  .maybeSingle();  // Usar maybeSingle para evitar erro quando não encontra
```

---

### Arquivo 3: `supabase/functions/gerar-conteudo-resumo-oab/index.ts`

**Mesmo tratamento de saudações (adicionar após linha 342):**

```typescript
// Limpar saudações indevidas dos slides gerados
const limparSaudacoes = (texto: string, tipoSlide: string): string => {
  if (tipoSlide === 'introducao') return texto; // Introdução pode ter saudação
  
  const saudacoes = [
    /^E aí,?\s*(galera|futuro|colega|pessoal)?[!,.\s]/gi,
    /^Olha só[!,.\s]/gi,
    /^Vamos lá[!,.\s]/gi,
    /^Bora\s/gi,
  ];
  
  let resultado = texto;
  for (const regex of saudacoes) {
    resultado = resultado.replace(regex, '');
  }
  return resultado.trim();
};
```

---

### Arquivo 4: `supabase/functions/gerar-slides-artigo/index.ts`

**Mesmo tratamento (verificar e adicionar se necessário)**

---

## Resumo das Mudancas

| Arquivo | Mudanca | Impacto |
|---------|---------|---------|
| `gerar-conteudo-oab-trilhas/index.ts` | Prompt mais enfático + validação pós-geração | Elimina saudações |
| `gerar-conteudo-resumo-oab/index.ts` | Mesmo tratamento de saudações | Consistência |
| `ArtigoPopover.tsx` | Melhorar mapeamento CPP + usar maybeSingle | Artigos clicáveis funcionam |
| `ConceitoSlideCard.tsx` | Verificar prop disableTermos | Termos grifados |

---

## Observacoes Importantes

1. **Conteúdo existente**: O conteúdo que você está visualizando foi gerado ANTES das correções. Para ver as mudanças, será necessário **regenerar o conteúdo** do tópico.

2. **Síntese Final**: O código JÁ adiciona a síntese final. Se não está aparecendo, é porque o conteúdo foi gerado antes dessa feature ser implementada.

3. **Build Error**: O erro de build mencionado está truncado no log. Vou investigar os arquivos mais prováveis para corrigir erros de TypeScript.

4. **Artigos do CPP**: A busca no Vade Mecum para o CPP pode estar falhando se a tabela "CPP - Código de Processo Penal" não existir ou tiver nome diferente no banco.

---

## Sequencia de Implementacao

1. Corrigir o prompt e adicionar sanitização pós-geração
2. Melhorar o ArtigoPopover para busca mais robusta
3. Verificar e corrigir o erro de build
4. Deploy das edge functions
5. Regenerar um tópico para testar

