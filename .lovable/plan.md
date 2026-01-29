
# Plano: Corrigir Parser JSON para Alinhar com OAB Trilhas

## Diagnóstico do Problema

Os logs mostram erros de parse JSON nas posições 703, 2981, e 6683:
```
SyntaxError: Expected ',' or '}' after property value in JSON at position 6683
```

Isso indica que **newlines literais estão fora das strings JSON** (entre propriedades), não dentro. A função `escaparNewlinesEmStrings` só escapa dentro de strings, mas o problema está **fora delas**.

---

## Diferença entre OAB Trilhas (funciona) e Conceitos (quebra)

| Aspecto | OAB Trilhas | Conceitos Atual |
|---------|-------------|-----------------|
| Estratégia | Substituição global ANTES do parse | Iteração caractere a caractere |
| Newlines | `replace(/[\x00-\x1F\x7F]/g, ...)` | `escaparNewlinesEmStrings()` |
| Onde atua | Em TODO o JSON | Apenas DENTRO de strings |
| Resultado | Funciona | Quebra com newlines entre propriedades |

---

## Solução

Reescrever o parser JSON do Conceitos para usar a **mesma lógica simples** do OAB Trilhas:

1. **Remover** a função `escaparNewlinesEmStrings()` complexa
2. **Usar** substituição global igual ao OAB Trilhas
3. **Simplificar** para apenas 2 estágios (direto → correção simples)

---

## Mudanças no Arquivo

**Arquivo:** `supabase/functions/gerar-conteudo-conceitos/index.ts`

### Remover (linhas ~590-636)
- Toda a função `escaparNewlinesEmStrings`

### Substituir bloco de parse (linhas ~639-733)

Trocar por lógica simples igual OAB Trilhas:

```typescript
// Parse JSON com sanitização igual OAB Trilhas
let conteudoGerado;
try {
  // Sanitizar caracteres de controle ANTES do parse (como OAB Trilhas)
  const sanitizedJson = jsonStr.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  });
  conteudoGerado = JSON.parse(sanitizedJson);
  console.log("[Conceitos] ✅ JSON parseado diretamente");
} catch (parseError) {
  console.log("[Conceitos] Erro no parse, tentando corrigir JSON...");
  
  // Sanitizar + adicionar fechamentos faltantes (igual OAB Trilhas)
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
    throw new Error("Falha ao processar resposta da IA");
  }
}
```

### Atualizar complemento de páginas (linhas ~790-820)

Usar a mesma sanitização simples no complemento:

```typescript
try {
  const sanitizedComp = complementoJson.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  });
  complemento = JSON.parse(sanitizedComp);
} catch {
  // Limpeza adicional se falhar
  let jsonLimpo = complementoJson.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n') return '\\n';
    if (char === '\r') return '\\r';
    if (char === '\t') return '\\t';
    return '';
  }).replace(/,(\s*[}\]])/g, "$1");
  complemento = JSON.parse(jsonLimpo);
}
```

---

## Também Necessário

### Adicionar config.toml

A função `gerar-conteudo-conceitos` não está no `config.toml`, o que pode causar problemas de autenticação:

```toml
[functions.gerar-conteudo-conceitos]
verify_jwt = false
```

### Reset dos tópicos com erro

```sql
UPDATE conceitos_topicos 
SET status = 'pendente', tentativas = 0, progresso = 0, updated_at = NOW()
WHERE materia_id = 58 AND status = 'erro';
```

---

## Resumo das Alterações

1. **Simplificar parser JSON** → Usar substituição global igual OAB Trilhas
2. **Remover `escaparNewlinesEmStrings`** → Função complexa que não resolve o problema real
3. **Manter `extrairJsonBalanceado`** → Continua útil para limpar texto antes/depois do JSON
4. **Adicionar ao config.toml** → Garantir que a função está configurada
5. **Reset tópicos** → Permitir nova geração

---

## Resultado Esperado

- Parse JSON funcionará igual ao OAB Trilhas (que está gerando corretamente)
- Os tópicos "Surgimento do Direito", "Direito Romano" e outros serão gerados com sucesso
- A fila continuará processando automaticamente
