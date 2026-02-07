
# Plano: Corrigir Respostas Duplicadas da Evelyn para Arquivos (Áudio, PDF, Imagem)

## Problema Identificado

Quando um usuário envia arquivos (áudio, PDF, imagem) para a Evelyn no WhatsApp, ela responde **duas vezes**.

### Causa Raiz

A **Evolution API está enviando a mesma mensagem duas vezes** através de dois eventos webhook diferentes:

1. Uma chamada com o `remoteJid` no formato JID normal: `5511991897603@s.whatsapp.net`
2. Outra chamada com o `remoteJid` no formato LID: `1335751655457@lid`

O sistema de deduplicação atual no webhook usa a chave `${remoteJid}:${messageId}`, mas como o `remoteJid` é **diferente** nas duas chamadas (apesar de ser a mesma mensagem), a deduplicação **não funciona**.

### Evidências dos Logs

```text
14:52:01 - Processando imagem para 5511991897603@s.whatsapp.net
14:52:10 - Mídia processada com sucesso (1ª resposta)
14:52:11 - Processando MESMA imagem para 1335751655457@lid  
14:52:19 - Mídia processada com sucesso (2ª resposta duplicada!)
```

---

## Solução Proposta

Corrigir a lógica de deduplicação para usar **apenas o `messageId`** como chave única, ignorando o `remoteJid`. Isso garantirá que a mesma mensagem (mesmo ID) não seja processada duas vezes, independentemente do formato do identificador do remetente.

---

## Mudanças Técnicas

### Arquivo: `supabase/functions/webhook-evelyn/index.ts`

**Alteração na linha 64:**

```text
// ANTES (problemático):
const dedupKey = `${remoteJid}:${messageId}`;

// DEPOIS (corrigido):
const dedupKey = messageId;
```

Também vou adicionar logs mais detalhados para facilitar o debug futuro.

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/webhook-evelyn/index.ts` | Usar apenas `messageId` como chave de deduplicação |

---

## Riscos e Considerações

- **Baixo risco**: O `messageId` da Evolution API é único por mensagem, então não há risco de ignorar mensagens legítimas diferentes
- **Cache em memória**: O cache atual já limpa mensagens após 10 segundos, o que é suficiente para evitar reprocessamento sem ocupar memória excessiva
- **Compatibilidade**: A mudança é retrocompatível e não afeta outras funcionalidades
