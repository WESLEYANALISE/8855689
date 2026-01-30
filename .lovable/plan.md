
Objetivo: fazer a Edge Function `gerar-conteudo-conceitos` parar de retornar 500 (“Falha ao processar resposta da IA”), garantindo que ela (1) use as GEMINI_KEY_1/2/3 com fallback de verdade, (2) produza/extraia JSON válido de forma robusta e (3) registre logs suficientes para sabermos exatamente o que o Gemini está devolvendo quando falha.

O que eu já observei (e por que isso não é “tamanho de token” neste caso específico)
- O erro atual acontece no parse do JSON: `SyntaxError: Expected property name or '}' in JSON at position 1`.
- Esse erro, na prática, quase sempre significa que o texto começa com `{` e logo em seguida vem algo que NÃO é um nome de propriedade JSON válido (ex.: `{paginas: ...}` com chave sem aspas, ou `{'paginas': ...}` com aspas simples, ou algum lixo/label antes da chave).
- Para o tópico que você citou/está tentando (ex.: `topico_id=533`), o recorte do PDF (páginas 3 a 6) tem ~8.6k caracteres — isso é pequeno. Então não parece ser limite de tokens/contexto aqui. O problema mais provável é “formato de saída não-JSON estrito”.

Causa raiz mais provável
1) Mesmo com `responseMimeType: "application/json"`, o modelo ainda pode retornar pseudo-JSON (chaves sem aspas) em alguns cenários, especialmente quando o prompt contém muitas regras “não use aspas duplas” e exemplos de JSON/markdown misturados.
2) O normalizador atual corrige aspas curvas e (às vezes) aspas simples, mas NÃO corrige chaves sem aspas (`{paginas: ...}`), que é um formato JS, não JSON.
3) O fluxo atual escolhe uma chave aleatória e não faz fallback (do jeito que você quer e como está no `gemini-chat`).

Plano de implementação (mudanças de código)
1) Garantir fallback real das chaves GEMINI (1 → 2 → 3)
   - Substituir a escolha aleatória por uma função `generateContentWithFallback(prompt)` que:
     - tenta GEMINI_KEY_1, depois 2, depois 3
     - em caso de rate limit/temporário (429/503) tenta a próxima
     - em caso de erro permanente (400/401/403 etc.) loga e tenta a próxima, mas com logging claro de qual chave falhou
     - se todas falharem, retorna erro explícito (e atualiza `conceitos_topicos.status = "erro"` como já existe)
   - Resultado: você tem o mesmo padrão de “fallback” que pediu.

2) Melhorar CORS (não resolve 500, mas evita problemas colaterais)
   - Atualizar `corsHeaders` para incluir os headers recomendados pelo padrão do Supabase (x-supabase-client-*).
   - Manter o OPTIONS handler retornando “ok”/null com headers.

3) Log de diagnóstico que realmente explique “por quê” o JSON falhou
   - Antes de qualquer parse:
     - logar um “preview” do começo da resposta do Gemini (ex.: primeiros 200–300 chars)
     - logar os charCodes dos primeiros 30–50 chars
     - logar metadados do Gemini (quando disponível): `finishReason`, tamanho, e se veio candidate vazio
   - Importante: sem vazar o conteúdo inteiro, só um snippet inicial (para não poluir logs nem expor texto completo do PDF).

4) Tornar o parser resiliente a pseudo-JSON (principal correção do seu erro)
   - Evoluir `normalizarJsonIA` para também corrigir chaves sem aspas:
     - Transformar padrões tipo `{paginas: ...}` / `, paginas: ...` em `{"paginas": ...}` / `, "paginas": ...` quando detectado que há chaves “bare” (sem aspas).
     - Fazer isso de forma conservadora (heurística), para não quebrar JSON já válido.
   - Continuar mantendo:
     - remoção de BOM / NBSP
     - normalização de aspas curvas
     - conversão de aspas simples para duplas quando não houver chaves com aspas duplas
     - sanitização de caracteres de controle (padrão unificado que você já usa nas outras funções)

5) Ajustar a extração “balanceada” para não depender apenas de aspas duplas
   - Hoje a state machine só alterna `inString` ao ver `"`.
   - Se o Gemini devolve pseudo-JSON com strings em aspas simples, a extração pode interpretar `{`/`}` dentro de strings como estrutura e cortar errado.
   - Atualizar a lógica de string para reconhecer tanto `"` quanto `'` (com cuidado para escapes) — ou, alternativamente, rodar um “pré-normalize” antes da extração para converter aspas simples em duplas (quando aplicável) e então extrair.
   - Objetivo: `extrairJsonBalanceado()` sempre devolver um bloco bem formado.

6) Ajuste de prompt para reduzir chance de pseudo-JSON
   - Manter sua regra de “não usar aspas duplas no markdown” (se necessário), mas explicitar:
     - “As chaves e strings do JSON devem usar aspas duplas conforme o padrão JSON.”
     - “Dentro do campo markdown, evite aspas duplas.”
   - Isso reduz o conflito interno do prompt (o modelo não “foge” das aspas duplas no JSON).

7) (Opcional, mas recomendado) Reduzir superfície de erro do complemento (quando < 8 páginas)
   - Se o parse do “complemento” falhar, manter logs equivalentes (preview + codes).
   - Evitar que uma falha de complemento derrube tudo se já existem páginas suficientes.

Plano de validação (como vamos confirmar que resolveu)
1) Teste direto da Edge Function (controlado)
   - Chamar `gerar-conteudo-conceitos` para `topico_id=533` e confirmar:
     - status 200
     - atualização em `conceitos_topicos`: `status="concluido"`, `progresso=100`, `conteudo_gerado` preenchido
2) Teste pelo app (fluxo real)
   - Na rota `/conceitos/topico/533`, disparar a geração pelo fluxo atual e confirmar que não há 500.
3) Se ainda falhar
   - Usar os novos logs (preview/codes/finishReason) para identificar exatamente o formato retornado (ex.: `{paginas:...}`, “Aqui está o JSON: ...”, HTML de erro, resposta vazia, etc.) e ajustar o normalizador com base em evidência.

Arquivos que serão alterados
- `supabase/functions/gerar-conteudo-conceitos/index.ts`
  - Implementar fallback de chaves
  - Melhorar CORS
  - Reforçar normalização/extração/parsing
  - Melhorar logs de diagnóstico
- (Nenhuma mudança de schema prevista)

Riscos / cuidados
- Heurísticas de “consertar JSON” podem introduzir bugs se forem agressivas; por isso a estratégia será:
  - detectar padrões antes de substituir
  - só aplicar correções quando o parse falhar (ou quando sinais fortes de pseudo-JSON forem detectados)
- Garantir que logs não exponham conteúdo completo do PDF (apenas snippet curto).

Resultado esperado
- A geração não falha mais em `{paginas: ...}` / pseudo-JSON.
- As três chaves Gemini são usadas com fallback real.
- Se ainda houver falha, teremos logs objetivos mostrando exatamente o que o Gemini devolveu no começo da resposta, permitindo ajuste rápido e certeiro.
