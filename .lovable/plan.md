

# Alinhar Geracaoo de Categorias com OAB Trilhas

## Problema
A Edge Function `gerar-conteudo-categorias` nao encadeia a geracao do proximo topico apos concluir um. No OAB Trilhas, apos finalizar um topico, a funcao chama `processarProximoDaFila()` que busca o proximo pendente e dispara automaticamente. Nas Categorias, depende do frontend (hook) para disparar o proximo -- se o usuario sai da pagina, para tudo.

## Diferencas Identificadas

| Aspecto | OAB Trilhas | Categorias (atual) |
|---------|------------|-------------------|
| Fila com encadeamento | Sim (`processarProximoDaFila`) | Nao |
| Watchdog (30min timeout) | Sim | Nao |
| Status "na_fila" com posicao | Sim | Nao (so "pendente") |
| Contexto adicional (RESUMO + Base OAB) | Sim | Nao |

## Solucao

### 1. Adicionar sistema de fila na Edge Function `gerar-conteudo-categorias`

Ao receber um `topico_id`:
- Verificar se ja existe uma geracao ativa (status "gerando") para a mesma materia
- Se sim, colocar na fila (status "na_fila" com posicao)
- Se nao, marcar como "gerando" e processar
- Ao concluir (sucesso ou erro), chamar `processarProximoDaFila()` que busca o proximo "na_fila" da mesma materia e dispara a funcao novamente

Adicionar watchdog: se um topico esta "gerando" ha mais de 30 minutos, marcar como "erro" e seguir para o proximo.

### 2. Ajustar `processarGeracaoBackground` para encadear

Ao final do `try` (sucesso) e no `catch` (erro), adicionar chamada a `processarProximoDaFila()` que:
- Busca proximo topico com `status = 'na_fila'` ordenado por `posicao_fila`
- Faz fetch para `gerar-conteudo-categorias` com o `topico_id` encontrado

### 3. Manter o hook frontend como backup

O hook `useCategoriasAutoGeneration` continua funcionando como fallback, mas agora a geracao sequencial e garantida pelo backend.

## Arquivos a Modificar

- `supabase/functions/gerar-conteudo-categorias/index.ts`: Adicionar logica de fila, watchdog e encadeamento (igual OAB)

## Detalhes Tecnicos

A funcao `processarProximoDaFila` sera adicionada ao final do arquivo e chamada tanto no sucesso quanto no erro:

```text
processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey)
  -> busca proximo com status "na_fila" e menor posicao_fila
  -> faz fetch POST para gerar-conteudo-categorias com topico_id
```

A logica de enfileiramento no inicio da funcao:
```text
1. Recebe topico_id
2. Busca topico ativo (status "gerando") na mesma materia
3. Se encontrar ativo:
   a. Se ativo > 30min, marcar como erro
   b. Senao, enfileirar o novo topico (status "na_fila", posicao = max+1)
4. Se nao encontrar ativo, processar normalmente
```
