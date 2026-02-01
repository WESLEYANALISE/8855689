
Objetivo
- Fazer o identificador de subtemas reconhecer e extrair corretamente índices que continuam na página seguinte “em formato de título/markdown” (ex.: “## 6. …”) para que, no tópico 507 (Imputabilidade e Concurso de Pessoas), apareçam os 9 itens (1–9) e não apenas 5.

Diagnóstico (com base no que vi no banco)
- A página 2 do tópico 507 tem o índice numerado 1–5 em linhas comuns.
- A página 3 continua o índice, mas os itens 6–9 aparecem como headers em markdown, por exemplo:
  - “## 6. MEDIDA DE SEGURANÇA...17”
  - “## 7. IMPUTABILIDADE E EMBRIAGUEZ...19”
  - “## 8. CONCURSO DE PESSOAS...21”
  - “## 9. CIRCUNSTÂNCIAS E ELEMENTARES...25”
- A edge function supabase/functions/identificar-subtemas-oab:
  - Já detecta “páginas de índice” aceitando esse formato de header (indiceHeaderRe) para filtrar paginasIndice.
  - Porém, a função extrairTitulosIndiceNivel1() NÃO possui um regex de extração para esse formato “## N. TÍTULO ... PÁGINA”.
- Resultado: a função vê a página 3 como índice, mas não consegue extrair os itens 6–9; por isso termina com 5 subtemas.

Mudança proposta (alto nível)
1) Ajustar a extração do índice (extrairTitulosIndiceNivel1)
- Adicionar um 4º padrão ao array patterns que extraia itens no formato header/markdown com “#”:
  - Capturar ordem (N), título, e número da página, no mesmo formato dos outros padrões.
  - Reutilizar a mesma ideia do indiceHeaderRe, mas adaptada aos critérios de “título começa com maiúscula” (ou relaxar esse critério para não perder casos como “(IN)IMPUTABILIDADE...”).
- Garantir que:
  - Ele concatene corretamente múltiplas páginas de índice (já concatena).
  - O dedupe por “ordem” não descarte o item correto (manter o primeiro por ordem, como já faz).

2) Melhorar robustez para títulos que começam com parênteses (opcional, mas recomendado)
- Relaxar o “começa com letra maiúscula” para aceitar também “(” no começo do título:
  - Ex.: permitir que o grupo do título comece com “[(A-ZÁÉÍÓÚ…]”.
  - Isso evita perdas em PDFs onde o OCR coloca parênteses no início do item.

3) Logging de diagnóstico (para confirmar no log sem depender só da UI)
- Logar:
  - Quais páginas foram consideradas “páginas de índice” (número da página).
  - Quantos matches cada padrão encontrou (principalmente o novo padrão de headers).
  - A lista final de itens extraídos (ordem, título, página do índice).
- Isso ajuda a “identificar” quando o corte acontecer novamente em PDFs com 3–4 páginas de índice.

4) Manter a regra “índice confiável => gerar subtemas diretamente do índice”
- Não mudar a lógica de “indiceEhConfiavel” (理解 atual está correta).
- Após extrair os 9 itens (1–9), essa lógica vai:
  - Calcular ranges (pagina_inicial/pagina_final) por monotonicidade.
  - Salvar em oab_trilhas_topicos.subtemas_identificados.
  - Salvar conteúdo por subtema na conteudo_oab_revisao.

Como vou validar (checklist de testes)
- Teste direcionado no tópico 507:
  - Rodar a edge function identificar-subtemas-oab para topicoId=507 com areaNome/temaNome corretos (os mesmos usados na UI).
  - Conferir no retorno JSON: subtemas.length === 9.
  - Conferir no log: itens 6–9 foram extraídos pelo padrão novo.
- Teste pela UI (fluxo real):
  - Clicar em “Reprocessar PDF” / “Processar PDF” e verificar que o modal “Confirmar os subtemas identificados” mostra 9 itens, não 5.
- Teste regressão:
  - Reprocessar um tópico com índice em formato “linha normal” (sem headers) para garantir que não quebrou.

Riscos e cuidados
- Falso positivo: regex de header pegar “##” de conteúdo que não é índice.
  - Mitigação: só aplicamos a extração em páginas já classificadas como “páginas de índice” (paginasIndice) e ainda usamos dedupe/ordem.
- PDFs com títulos muito “sujos” no OCR:
  - Mitigação: relaxar início do título para aceitar “(” e manter filtros de tamanho mínimo + limite de página (<=500) já existente.

Escopo de arquivos que serão alterados (quando aprovado)
- supabase/functions/identificar-subtemas-oab/index.ts
  - Adicionar o novo regex no array patterns dentro de extrairTitulosIndiceNivel1.
  - (Opcional) relaxar o critério de primeiro caractere do título.
  - Adicionar logs de diagnóstico para matches e páginas do índice.
