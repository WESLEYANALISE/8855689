
## Diagnóstico Confirmado

Os logs revelaram exatamente o problema:

```
SyntaxError: Expected ',' or ']' after array element in JSON at position 33130 (line 267)
SyntaxError: Expected ',' or ']' after array element in JSON at position 34744 (line 322)
```

O Gemini está tentando gerar um JSON de 35-55 páginas de uma só vez (35.000+ caracteres). O modelo atinge o limite de tokens de saída (8192) antes de completar o JSON, que fica **truncado** no meio (sem fechar chaves/colchetes).

O código atual continua mesmo com `slidesData = null` e salva no banco como `status: "concluido"` com `slides_json: null`. Isso cria os "tópicos fantasmas".

## Solução: Geração Página por Página (Batch Incremental)

Vou implementar exatamente o que você sugeriu: gerar o conteúdo em etapas menores.

### Arquitetura Nova

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE GERAÇÃO                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. ESTRUTURAÇÃO (1 chamada pequena)                           │
│     └─> Gera apenas o "esqueleto":                             │
│         - Títulos das seções                                   │
│         - Nomes das páginas                                    │
│         - Tipos de cada página                                 │
│         - Objetivos gerais                                     │
│     └─> JSON pequeno (~2KB), nunca trunca                      │
│                                                                 │
│  2. GERAÇÃO EM LOTES (N chamadas)                              │
│     └─> Para cada seção (ou grupo de 5-8 páginas):             │
│         - Gera o conteúdo completo das páginas                 │
│         - Valida JSON antes de continuar                       │
│         - Salva progresso parcial no banco                     │
│                                                                 │
│  3. MONTAGEM FINAL                                             │
│     └─> Combina todos os lotes                                 │
│     └─> Valida estrutura completa                              │
│     └─> Só marca "concluido" se tudo estiver OK                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Implementação Detalhada

#### 1. Nova Etapa: Gerar Estrutura/Esqueleto

Primeira chamada ao Gemini gera apenas a estrutura (sem conteúdo):

```json
{
  "titulo": "Surgimento do Direito",
  "tempoEstimado": "25 min",
  "objetivos": ["...", "...", "..."],
  "secoes": [
    {
      "id": 1,
      "titulo": "Origens do Direito",
      "paginas": [
        {"tipo": "introducao", "titulo": "O que você vai aprender"},
        {"tipo": "texto", "titulo": "Direito na Antiguidade"},
        {"tipo": "texto", "titulo": "Código de Hamurabi"},
        {"tipo": "quickcheck", "titulo": "Teste Rápido"}
      ]
    },
    {
      "id": 2,
      "titulo": "Direito Romano",
      "paginas": [...]
    }
  ]
}
```

Esse JSON é pequeno (~3-5KB) e nunca será truncado.

#### 2. Geração em Lotes por Seção

Para cada seção do esqueleto:
- Faz uma chamada separada ao Gemini
- Pede apenas o conteúdo daquela seção (5-10 páginas)
- JSON de ~8-15KB por seção - dentro do limite seguro
- Atualiza progresso no banco a cada seção concluída

```text
Seção 1 (5 páginas) → 10% progresso → salva parcial
Seção 2 (7 páginas) → 25% progresso → salva parcial  
Seção 3 (6 páginas) → 40% progresso → salva parcial
...
Seção 6 (5 páginas) → 90% progresso → salva parcial
```

#### 3. Validação Rigorosa

Antes de marcar como concluído:
- Verificar que todas as seções foram geradas
- Verificar que cada seção tem slides válidos
- Verificar total de páginas mínimo (ex: 25)
- Se qualquer validação falhar: status = "erro"

#### 4. Retry por Seção

Se uma seção falhar:
- Tentar novamente apenas aquela seção (até 2 retries)
- Não precisa refazer as seções que já deram certo
- Progresso não é perdido

### Mudanças nos Arquivos

#### supabase/functions/gerar-conteudo-conceitos/index.ts

1. **Nova função `gerarEstrutura()`**
   - Prompt enxuto pedindo só títulos/tipos
   - maxOutputTokens: 4096 (suficiente para esqueleto)
   - Retorna estrutura sem conteúdo

2. **Nova função `gerarConteudoSecao(secao, indice)`**
   - Recebe uma seção do esqueleto
   - Gera conteúdo completo só daquela seção
   - maxOutputTokens: 8192
   - Retry interno se falhar

3. **Loop de geração com progresso**
   - Itera sobre seções
   - Atualiza banco a cada seção (progresso parcial)
   - Coleta resultados

4. **Montagem e validação final**
   - Combina todas as seções
   - Valida estrutura completa
   - Só então marca concluído

5. **Correção do bug atual**
   - Se slidesData for null/inválido: throw error
   - Catch block marca status = "erro"
   - Nunca mais "concluido fantasma"

### Benefícios

1. **Confiabilidade**: JSONs menores nunca truncam
2. **Progresso real**: Usuário vê % avançando de verdade
3. **Resiliência**: Se falhar uma seção, as outras estão salvas
4. **Menos timeout**: Cada chamada é mais rápida
5. **Conteúdo mais rico**: Pode pedir mais detalhes por página

### Seção Técnica

#### Estrutura do Prompt de Esqueleto

```javascript
const promptEstrutura = `Crie APENAS a estrutura/esqueleto do conteúdo.
NÃO gere conteúdo, apenas títulos e tipos.

Retorne JSON com:
{
  "titulo": "${topicoTitulo}",
  "objetivos": ["3-4 objetivos de aprendizado"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "paginas": [
        {"tipo": "introducao", "titulo": "Título da página"},
        {"tipo": "texto", "titulo": "Título da página"},
        ...
      ]
    }
  ]
}

Gere 5-7 seções com 5-10 páginas cada (total 35-55 páginas).
Tipos: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck`;
```

#### Estrutura do Prompt por Seção

```javascript
const promptSecao = `Gere o conteúdo COMPLETO para esta seção:
Seção ${indice+1}: "${secao.titulo}"
Páginas: ${JSON.stringify(secao.paginas)}

Para cada página, adicione:
- conteudo: texto completo (200-400 palavras para tipo "texto")
- imagemPrompt: descrição em inglês para ilustração
- campos específicos do tipo (termos, etapas, tabela, etc)

Retorne JSON com a seção completa...`;
```

#### Progresso Incremental

```javascript
const totalSecoes = estrutura.secoes.length;
for (let i = 0; i < totalSecoes; i++) {
  const progresso = Math.round(20 + (i / totalSecoes) * 70); // 20% a 90%
  
  const secaoCompleta = await gerarConteudoSecao(estrutura.secoes[i], i);
  secoesCompletas.push(secaoCompleta);
  
  await updateProgress(progresso);
}
```

#### Validação Final

```javascript
// Validar antes de salvar como concluído
const totalPaginas = secoesCompletas.reduce(
  (acc, s) => acc + (s.slides?.length || 0), 0
);

if (totalPaginas < 25) {
  throw new Error(`Páginas insuficientes: ${totalPaginas}/25`);
}

// Só aqui marca como concluído
await supabase.from("conceitos_topicos").update({
  slides_json: slidesData,
  status: "concluido",
  progresso: 100
});
```

### Migração para Corrigir Dados Existentes

Uma migração SQL para resetar tópicos "fantasmas":

```sql
UPDATE public.conceitos_topicos
SET status = 'pendente',
    progresso = 0,
    tentativas = 0
WHERE status = 'concluido'
  AND slides_json IS NULL
  AND conteudo_gerado IS NULL;
```
