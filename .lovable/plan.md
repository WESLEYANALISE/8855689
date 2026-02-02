
## Objetivo (o que vai mudar)
Garantir que, quando o PDF vier com subtemas “PARTE I / PARTE II” (ex.: “INJÚRIA - PARTE I” e “INJÚRIA - PARTE II”), o sistema **não liste separado** na etapa “Confirme os subtemas identificados”. Em vez disso, ele deve **juntar automaticamente** em **um único subtema** (“INJÚRIA”) com o intervalo de páginas cobrindo as duas partes e com o conteúdo das páginas unido.

## Diagnóstico (por que ainda está vindo separado)
Pelo seu print, o problema está na **extração de SUBTEMAS** (modal “Confirme os subtemas identificados”), que é gerada pela edge function:

- `supabase/functions/identificar-subtemas-oab/index.ts`

O merge que você pediu anteriormente foi aplicado para “TEMAS” (matéria) e para a confirmação de temas:
- `identificar-temas-oab`
- `confirmar-temas-oab`

Mas a sua tela do print é de **SUBTEMAS** (tópico), que é outro fluxo: `identificar-subtemas-oab`. Nesse arquivo, hoje **não existe uma etapa de merge por “Parte I/II”**, então ele retorna exatamente o índice/Gemini com as duas entradas separadas.

## Solução (ajuste definitivo)
Implementar no `identificar-subtemas-oab` uma rotina de “normalização + agrupamento” de títulos, aplicada **sempre** antes de salvar no banco e antes de retornar para a UI.

### 1) Normalização de título (“Parte I/II”)
Adicionar uma função dedicada (ex.: `normalizarTituloSubtema`) que:
- remove sufixos no final do título como:
  - `- PARTE I`, `– Parte II`, `— parte 2`
  - `PARTE I` (sem hífen)
  - variações de espaçamento e caixa (maiúsculas/minúsculas)
- mantém o restante do título intacto
- faz `trim()` e colapsa espaços múltiplos

Regras de regex (robustas):
- aceitar `-`, `–`, `—` como separadores
- aceitar algarismos romanos amplos (`I, II, III, IV, V, VI, VII, VIII, IX, X, ...`) e arábicos (`1,2,3...`)
- garantir que só remova quando aparecer **“PARTE” no final do título**, para não estragar títulos que terminem em números por outros motivos.

### 2) Agrupamento estável (preserva a ordem visual do índice)
Adicionar função (ex.: `agruparSubtemasPorParte`) que:
- agrupa por `normalizarTituloSubtema(titulo)` (chave normalizada)
- preserva a ordem do primeiro aparecimento do grupo (para a UI ficar natural)
- para cada grupo:
  - `titulo`: o título limpo (sem “Parte …”)
  - `pagina_inicial`: menor `pagina_inicial` do grupo
  - `pagina_final`: maior `pagina_final` do grupo
- reindexa `ordem` como 1..N após o merge

### 3) Aplicar o merge nos dois caminhos do `identificar-subtemas-oab`
O arquivo tem dois caminhos principais:

**(A) Caminho “índice confiável” (retorno antecipado)**
- Hoje ele monta `subtemasValidados` diretamente do índice e retorna.
- Vamos aplicar o agrupamento **antes** de:
  - salvar em `conteudo_oab_revisao`
  - atualizar `oab_trilhas_topicos.subtemas_identificados`
  - retornar a resposta JSON

**(B) Caminho “Gemini/heurístico” (sem retorno antecipado)**
- Hoje ele valida `subtemasValidados`, faz correções quando existe índice, e então salva/retorna.
- Vamos aplicar o agrupamento logo após a construção final de `subtemasValidados` (depois dos ajustes de páginas e reindex), e antes do salvamento/retorno.

### 4) Efeito colateral desejado: conteúdo unido automaticamente
Como o `identificar-subtemas-oab` salva o conteúdo por subtema em `conteudo_oab_revisao` iterando pelas páginas (`pagina_inicial..pagina_final`), ao juntarmos “Parte I/II” em um único item com `pagina_inicial` e `pagina_final` expandido, o conteúdo também ficará automaticamente unido.

### 5) Logs de auditoria (para provar que resolveu)
Adicionar logs claros na edge function:
- Antes do merge: lista de títulos recebidos + páginas
- Depois do merge: lista de títulos finais + páginas e contagem “N → M”
- Logs específicos quando detectar “parte” no título para facilitar debug

### 6) Compatibilidade com dados existentes
- O merge “definitivo” vale para novas extrações/identificações.
- Para tópicos que já ficaram salvos com “PARTE I/II” separados, será necessário **rodar a identificação/extrair de novo** (porque a UI está mostrando o resultado atual que já veio separado do processamento anterior).

## Escopo de arquivos
1. `supabase/functions/identificar-subtemas-oab/index.ts`
   - adicionar normalização + agrupamento
   - aplicar nos dois fluxos (índice confiável e Gemini)
   - melhorar logs

(Em princípio, `confirmar-subtemas-oab` não precisa mudar se o merge acontecer antes, porque a UI já vai selecionar e confirmar apenas o subtema final consolidado.)

## Critérios de aceite (como vamos validar)
1. No modal “Confirme os subtemas identificados”, em vez de:
   - “INJÚRIA - PARTE I”
   - “INJÚRIA - PARTE II”
   deve aparecer apenas:
   - “INJÚRIA”
2. O subtema “INJÚRIA” deve ter:
   - `pagina_inicial` = início da Parte I
   - `pagina_final` = fim da Parte II
3. Ao confirmar, o `RESUMO` deve receber **apenas 1 registro** para “INJÚRIA” (não dois).
4. Os logs da edge function devem registrar algo como:
   - `Subtemas antes: 41`
   - `Subtemas depois: 40`
   - e listar o merge detectado.

## Riscos e como mitigamos
- Alguns materiais podem usar formatos diferentes (ex.: “Parte 1”, “PARTE-2”, “PARTE II:” com dois pontos).
  - Mitigação: regex tolerante a separadores e pontuação final.
- Títulos onde “Parte” não indica divisão (raro).
  - Mitigação: só remover/mesclar quando “PARTE …” estiver no final do título.

## Plano de execução (passo a passo)
1. Editar `identificar-subtemas-oab`:
   - criar `normalizarTituloSubtema`
   - criar `agruparSubtemasPorParte`
2. Chamar `agruparSubtemasPorParte`:
   - no caminho “índice confiável” antes do salvamento/return
   - no caminho padrão antes do salvamento/return
3. Ajustar logs (antes/depois).
4. Testar end-to-end no mesmo tópico do print:
   - Processar PDF
   - Conferir que o modal já mostra “INJÚRIA” único
   - Confirmar subtemas e verificar resultado na tela de trilha.
