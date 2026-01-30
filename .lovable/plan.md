
# Plano: Unificar Conceitos com a mesma mecânica da OAB Trilhas

## Problema Identificado

A geração de conteúdo em Conceitos está apresentando erros (ícones vermelhos na UI) porque:

1. **Sanitização de JSON diferente**: A função `gerar-conteudo-conceitos` foi alterada e agora não converte corretamente os caracteres de controle (`\n`, `\r`, `\t`) para escapes JSON (`\\n`, `\\r`, `\\t`), enquanto a OAB Trilhas faz isso corretamente
2. **UI diferente**: A página de Conceitos mostra badges visuais em vermelho para erros, enquanto a OAB é mais discreta

## Solução

Copiar exatamente a lógica de sanitização e parsing de JSON da `gerar-conteudo-oab-trilhas` para a `gerar-conteudo-conceitos`.

---

## Mudanças Técnicas

### 1. Arquivo: `supabase/functions/gerar-conteudo-conceitos/index.ts`

**Substituir a função `sanitizarJsonGlobal` pela lógica exata da OAB Trilhas:**

A sanitização atual está errada porque não converte newlines literais para escapes JSON. A OAB Trilhas faz assim:

```typescript
// ANTES (Conceitos - com problema):
const sanitizarJsonGlobal = (input: string): string => {
  return input
    .replace(/\uFEFF/g, "")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/[\u2028\u2029]/g, "\n")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
};

// DEPOIS (igual OAB Trilhas - funciona):
const sanitizedJson = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
  if (char === '\n') return '\\n';
  if (char === '\r') return '\\r';
  if (char === '\t') return '\\t';
  return '';
});
```

**Mudanças específicas:**

| Item | Antes | Depois |
|------|-------|--------|
| Sanitização | Função customizada que não escapa `\n` | Mesma lógica da OAB que escapa `\n → \\n` |
| Parse de JSON | Tenta parse direto, depois correções | Mesmo padrão da OAB Trilhas |
| Tratamento de erro | Marca como erro e para | Igual OAB: marca erro e processa próximo |

### 2. Bloco de código a ser substituído (linhas ~595-680)

Remover a função `sanitizarJsonGlobal` e usar o padrão inline igual OAB:

```typescript
// PARSE JSON - Abordagem IDÊNTICA à OAB Trilhas
let conteudoGerado;
try {
  // Sanitizar caracteres de controle antes do parse (IGUAL OAB)
  const sanitizedJson = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return ''; // Remove outros caracteres de controle
  });
  conteudoGerado = JSON.parse(sanitizedJson);
  console.log("[Conceitos] ✅ JSON parseado diretamente");
} catch (parseError) {
  console.log("[Conceitos] Erro no parse, tentando corrigir JSON...");
  
  // Sanitizar caracteres de controle (igual OAB)
  let jsonCorrigido = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  });
  
  // Adicionar fechamentos faltantes
  const aberturasObj = (jsonCorrigido.match(/{/g) || []).length;
  const fechamentosObj = (jsonCorrigido.match(/}/g) || []).length;
  const aberturasArr = (jsonCorrigido.match(/\[/g) || []).length;
  const fechamentosArr = (jsonCorrigido.match(/]/g) || []).length;
  
  for (let i = 0; i < aberturasArr - fechamentosArr; i++) {
    jsonCorrigido += "]";
  }
  for (let i = 0; i < aberturasObj - fechamentosObj; i++) {
    jsonCorrigido += "}";
  }
  
  // Remover vírgula antes de fechamento
  jsonCorrigido = jsonCorrigido.replace(/,\s*([}\]])/g, "$1");
  
  try {
    conteudoGerado = JSON.parse(jsonCorrigido);
    console.log("[Conceitos] ✅ JSON corrigido com sucesso");
  } catch (finalError) {
    console.error("[Conceitos] ❌ Falha definitiva no parse JSON:", finalError);
    await supabase.from("conceitos_topicos")
      .update({ status: "erro", progresso: 0, updated_at: new Date().toISOString() })
      .eq("id", topico_id);
    
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
    throw new Error("Falha ao processar resposta da IA");
  }
}
```

---

## Resumo das Alterações

| Arquivo | Ação |
|---------|------|
| `supabase/functions/gerar-conteudo-conceitos/index.ts` | Substituir sanitização de JSON pela mesma lógica exata da OAB Trilhas |

## Resultado Esperado

- A geração de conteúdo em Conceitos funcionará 100% igual à OAB
- Não haverá mais erros de parsing de JSON
- Os ícones vermelhos de erro deixarão de aparecer
- O fluxo de geração automática funcionará corretamente
