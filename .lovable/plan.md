
# Aumentar Geracao Paralela de 5 para 10 Subtemas

## Alteracao

Uma unica mudanca no arquivo `src/hooks/useOABAutoGeneration.ts`:

- **Linha 60**: Alterar `CONCURRENT_GENERATIONS = 5` para `CONCURRENT_GENERATIONS = 10`

## Riscos

- Nenhum problema tecnico significativo. As Edge Functions do Supabase escalam horizontalmente, entao 10 chamadas simultaneas sao aceitaveis.
- A unica consideracao e o consumo de tokens da IA (Gemini), que sera o dobro por lote. Mas como cada chamada e independente, nao ha risco de conflito ou corrida de dados.

## Arquivo a modificar

- `src/hooks/useOABAutoGeneration.ts` (linha 60): trocar o valor da constante de 5 para 10.
