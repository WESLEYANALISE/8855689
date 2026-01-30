

# Plano: Alinhar gerar-conteudo-conceitos 100% com gerar-conteudo-oab-trilhas

## Diagnóstico Definitivo

Analisei os logs e encontrei a causa raiz do erro 500:

```
finishReason: MAX_TOKENS
SyntaxError: Bad escaped character in JSON at position 21453
```

O JSON do Gemini está sendo **truncado** porque atinge o limite de tokens, e a função Conceitos **não tem lógica de continuação** como a OAB.

## Diferenças Críticas Identificadas

| Aspecto | OAB Trilhas (funciona) | Conceitos (falha) |
|---------|------------------------|-------------------|
| Biblioteca | `@google/generative-ai` SDK | `fetch` direto |
| responseMimeType | Nao usa | Usa `"application/json"` |
| Continuacao | `gerarComContinuacao()` - 3 tentativas | Nenhuma |
| Tratamento MAX_TOKENS | Detecta e pede continuacao | Falha no parse |
| Escolha de chave | Aleatoria entre as 3 | Sequencial com fallback |

## Solucao: Copiar a Logica Exata da OAB

Vou reescrever a funcao `gerar-conteudo-conceitos` para usar **exatamente** a mesma abordagem da OAB:

1. Usar o SDK `@google/generative-ai` em vez de fetch direto
2. Implementar `gerarComContinuacao()` identica a da OAB
3. Remover `responseMimeType: "application/json"` (causa problemas com truncamento)
4. Usar a mesma logica de parse/correcao de JSON
5. Manter fallback de chaves, mas com a mesma estrutura

## Mudancas Tecnicas

### Arquivo: `supabase/functions/gerar-conteudo-conceitos/index.ts`

1. **Adicionar import do SDK**:
```typescript
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
```

2. **Remover a funcao `generateContentWithFallback` atual** e substituir por:
   - Escolha aleatoria de chave (como OAB)
   - Inicializacao do SDK

3. **Copiar a funcao `gerarComContinuacao` da OAB** que:
   - Faz ate 3 tentativas
   - Detecta truncamento (`finishReason`, texto termina em `,`, `"`, `[`, `{`)
   - Pede continuacao com contexto das ultimas linhas

4. **Ajustar o parse de JSON** para usar a mesma logica:
   - Remover `normalizarJsonIA` complexo
   - Usar sanitizacao simples como OAB
   - Corrigir fechamentos faltantes

## Codigo Principal a Ser Alterado

```typescript
// ANTES (Conceitos - falha)
const response = await fetch(
  `https://generativelanguage.googleapis.com/...?key=${apiKey}`,
  {
    body: JSON.stringify({
      generationConfig: {
        responseMimeType: "application/json", // PROBLEMA!
      },
    }),
  }
);

// DEPOIS (igual OAB - funciona)
const genAI = new GoogleGenerativeAI(geminiKey!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function gerarComContinuacao(promptInicial: string, maxTentativas = 3) {
  let textoCompleto = "";
  let tentativas = 0;
  let promptAtual = promptInicial;
  
  while (tentativas < maxTentativas) {
    tentativas++;
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: promptAtual }] }],
      generationConfig: {
        maxOutputTokens: 65000,
        temperature: 0.6, // mesmo da OAB
      },
    });
    
    const responseText = result.response.text();
    textoCompleto += responseText;
    
    // Verificar se precisa continuar
    const temFechamento = textoCompleto.includes('"questoes"') && 
                          textoCompleto.trim().endsWith("}");
    const pareceTruncado = !temFechamento && (
      responseText.trim().endsWith(",") ||
      responseText.trim().endsWith('"') ||
      !responseText.includes("questoes")
    );
    
    if (!pareceTruncado) break;
    
    // Preparar continuacao
    const ultimasLinhas = responseText.slice(-500);
    promptAtual = `CONTINUE exatamente de onde parou...`;
  }
  
  return textoCompleto;
}
```

## Arquivos a Serem Alterados

- `supabase/functions/gerar-conteudo-conceitos/index.ts` (reescrita significativa)

## Resultado Esperado

1. A geracao de conteudo das Trilhas de Conceitos funcionara identicamente a OAB
2. Nao havera mais erros de truncamento/MAX_TOKENS
3. O JSON sera gerado completo com todas as 8 paginas
4. O sistema de fila continuara funcionando normalmente

