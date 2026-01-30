
# Plano: Corrigir Geração de Conteúdo das Trilhas de Conceitos

## Diagnóstico do Problema

O erro identificado nos logs é:
```
ERROR [Conceitos] ❌ Falha definitiva no parse JSON: SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
```

### Causa Raiz
O sistema de continuação da Edge Function `gerar-conteudo-conceitos` concatena múltiplas respostas do Gemini diretamente:
```javascript
textoCompleto += responseText;
```

Quando o Gemini retorna uma "continuação", ele gera um JSON **completo novo**, não um fragmento. Isso resulta em:
```
{"paginas": [...]}{  // ← Início da continuação
"paginas": [...]}    // ← JSON inválido!
```

### Problemas Adicionais Encontrados

1. **`config.toml` incompleto** - O arquivo perdeu todas as configurações de Edge Functions e agora contém apenas `project_id`. Isso pode estar impedindo algumas funções de funcionar corretamente.

2. **Lógica de continuação falha** - A detecção de "truncamento" e a fusão de respostas não funcionam quando `responseMimeType: "application/json"` está ativo.

---

## Solução Proposta

### 1. Restaurar `supabase/config.toml`
Adicionar de volta as configurações de JWT das Edge Functions que foram perdidas.

### 2. Corrigir a função `gerarComContinuacao`

**Estratégia principal**: Eliminar a lógica de continuação manual e confiar no modelo para gerar tudo de uma vez, ou implementar fusão inteligente de JSONs.

**Abordagem recomendada - Simplificar para uma única chamada**:
- Aumentar `maxOutputTokens` para 65.000 (já está)
- Remover a lógica de continuação que concatena JSONs
- Se a resposta vier incompleta, marcar como erro e permitir retry

**Código corrigido**:
```typescript
async function gerarConteudo(promptInicial: string): Promise<string> {
  console.log(`[Conceitos] Chamando Gemini...`);
  
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: promptInicial }] }],
    generationConfig: {
      maxOutputTokens: 65000,
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });
  
  const responseText = result.response.text();
  console.log(`[Conceitos] Resposta: ${responseText.length} chars`);
  
  return responseText;
}
```

### 3. Melhorar o parsing de JSON com validação

Se a resposta vier truncada, tentar completar os fechamentos automaticamente (já existe, mas precisa de ajustes).

---

## Mudanças Técnicas

| Arquivo | Alteração |
|---------|-----------|
| `supabase/config.toml` | Restaurar configurações `[functions.xxx]` com `verify_jwt = false` |
| `supabase/functions/gerar-conteudo-conceitos/index.ts` | Simplificar `gerarComContinuacao` removendo concatenação de múltiplas respostas |

---

## Resultado Esperado

Após as correções:
1. O Gemini retornará um JSON completo em uma única chamada
2. Se truncado, o sistema tentará completar os fechamentos ou marcará como erro
3. As Edge Functions terão suas configurações de JWT restauradas
4. A geração de conteúdo das Trilhas de Conceitos funcionará corretamente
