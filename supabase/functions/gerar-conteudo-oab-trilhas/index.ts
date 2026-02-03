import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Constantes de configuração - AUMENTAR PARA PADRÃO CONCEITOS
const MIN_PAGINAS = 30;
const MAX_TENTATIVAS = 3;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let topicoIdForCatch: number | null = null;
  let supabaseForCatch: any = null;

  try {
    const { topico_id, force_restart } = await req.json();
    topicoIdForCatch = topico_id ?? null;
    
    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    supabaseForCatch = supabase;

    // ============================================
    // SISTEMA DE FILA: Verificar se já há geração ativa
    // ============================================
    const { data: gerandoAtivo, error: checkError } = await supabase
      .from("oab_trilhas_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    if (!checkError && gerandoAtivo && gerandoAtivo.length > 0) {
      console.log(`[OAB Fila] Geração ativa detectada: ${gerandoAtivo[0].titulo} (ID: ${gerandoAtivo[0].id})`);
      
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      const { data: jaEnfileirado } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        const { count: totalFila } = await supabase
          .from("oab_trilhas_topicos")
          .select("id", { count: "exact", head: true })
          .eq("status", "na_fila");
        
        return new Response(
          JSON.stringify({ 
            queued: true, 
            position: jaEnfileirado.posicao_fila,
            total: totalFila || 1,
            message: `Já está na fila na posição ${jaEnfileirado.posicao_fila}`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("oab_trilhas_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          updated_at: new Date().toISOString() 
        })
        .eq("id", topico_id);
      
      const { count: totalFila } = await supabase
        .from("oab_trilhas_topicos")
        .select("id", { count: "exact", head: true })
        .eq("status", "na_fila");
      
      console.log(`[OAB Fila] Tópico ${topico_id} adicionado na posição ${novaPosicao} (total: ${totalFila})`);
      
      return new Response(
        JSON.stringify({ 
          queued: true, 
          position: novaPosicao,
          total: totalFila || 1,
          message: `Adicionado à fila na posição ${novaPosicao}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // INÍCIO DA GERAÇÃO
    // ============================================
    const { data: topico, error: topicoError } = await supabase
      .from("oab_trilhas_topicos")
      .select(`
        *,
        materia:oab_trilhas_materias(id, nome)
      `)
      .eq("id", topico_id)
      .single();

    if (topicoError || !topico) {
      return new Response(
        JSON.stringify({ error: "Tópico não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && !force_restart) {
      return new Response(
        JSON.stringify({ message: "Geração já em andamento" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (topico.status === "gerando" && force_restart) {
      console.log(`[OAB Trilhas] 🔁 Force restart solicitado para topico_id=${topico_id}`);
    }

    const posicaoRemovida = topico.posicao_fila;
    
    await supabase
      .from("oab_trilhas_topicos")
      .update({ 
        status: "gerando", 
        progresso: 5,
        posicao_fila: null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", topico_id);

    if (posicaoRemovida) {
      const { data: filaParaAtualizar } = await supabase
        .from("oab_trilhas_topicos")
        .select("id, posicao_fila")
        .eq("status", "na_fila")
        .gt("posicao_fila", posicaoRemovida);
      
      if (filaParaAtualizar && filaParaAtualizar.length > 0) {
        for (const item of filaParaAtualizar) {
          await supabase
            .from("oab_trilhas_topicos")
            .update({ posicao_fila: (item.posicao_fila || 1) - 1 })
            .eq("id", item.id);
        }
        console.log(`[OAB Fila] Posições atualizadas: ${filaParaAtualizar.length} itens`);
      }
    }

    const updateProgress = async (value: number) => {
      await supabase
        .from("oab_trilhas_topicos")
        .update({ progresso: value })
        .eq("id", topico_id);
    };

    const areaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    const tentativasAtuais = topico.tentativas || 0;

    console.log(`[OAB Trilhas] ══════════════════════════════════════════`);
    console.log(`[OAB Trilhas] Gerando conteúdo INCREMENTAL: ${topicoTitulo} (tentativa ${tentativasAtuais + 1})`);

    // 1. Buscar conteúdo extraído das páginas do PDF
    await updateProgress(10);
    const { data: paginas } = await supabase
      .from("oab_trilhas_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[OAB Trilhas] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    } else {
      console.log("[OAB Trilhas] ALERTA: Nenhuma página do PDF encontrada!");
    }

    await updateProgress(15);

    // 2. Buscar contexto adicional do RESUMO se existir
    let conteudoResumo = "";
    const { data: resumos } = await supabase
      .from("RESUMO")
      .select("conteudo, subtema")
      .eq("area", areaNome)
      .eq("tema", topicoTitulo)
      .order("\"ordem subtema\"", { ascending: true })
      .limit(15);

    if (resumos && resumos.length > 0) {
      conteudoResumo = resumos.map(r => {
        const sub = r.subtema ? `### ${r.subtema}\n` : "";
        return sub + (r.conteudo || "");
      }).join("\n\n");
      console.log(`[OAB Trilhas] RESUMO: ${resumos.length} subtemas`);
    }

    await updateProgress(20);

    // 3. Buscar contexto da Base de Conhecimento OAB
    let contextoBase = "";
    try {
      const { data: contextData } = await supabase.functions.invoke("buscar-contexto-base-oab", {
        body: { area: areaNome, topico: topicoTitulo, maxTokens: 5000 }
      });
      
      if (contextData?.contexto) {
        contextoBase = contextData.contexto;
        console.log(`[OAB Trilhas] Base OAB: ${contextData.tokensUsados} tokens`);
      }
    } catch (e) {
      console.log("[OAB Trilhas] Base de conhecimento não disponível");
    }

    await updateProgress(25);

    // 4. Configurar Gemini
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);

    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Função para sanitizar JSON
    function sanitizeJsonString(str: string): string {
      let result = "";
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const code = str.charCodeAt(i);
        
        if (escapeNext) { result += char; escapeNext = false; continue; }
        if (char === '\\') { result += char; escapeNext = true; continue; }
        if (char === '"') { inString = !inString; result += char; continue; }
        
        if (inString) {
          if (code === 0x0A) result += '\\n';
          else if (code === 0x0D) result += '\\r';
          else if (code === 0x09) result += '\\t';
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        } else {
          if (char === '\n' || char === '\r' || char === '\t' || char === ' ') result += char;
          else if (code < 0x20 || code === 0x7F) continue;
          else result += char;
        }
      }
      return result;
    }

    // Função para gerar e fazer parse de JSON com retry
    async function gerarJSON(prompt: string, maxRetries = 2): Promise<any> {
      let lastError: any = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`[OAB Trilhas] Retry ${attempt}/${maxRetries}...`);
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
          
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.5 },
          });
          
          let text = result.response.text();
          text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");
          
          const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (!match) throw new Error("JSON não encontrado na resposta");
          
          const sanitized = sanitizeJsonString(match[0]);
          
          try {
            return JSON.parse(sanitized);
          } catch {
            const fixed = sanitized.replace(/,\s*([}\]])/g, "$1");
            return JSON.parse(fixed);
          }
        } catch (err) {
          lastError = err;
          console.error(`[OAB Trilhas] Tentativa ${attempt + 1} falhou:`, err);
        }
      }
      
      throw lastError;
    }

    // ============================================
    // PROMPT BASE (ESTILO CONCEITOS - LINGUAGEM ACESSÍVEL)
    // ============================================
    const promptBase = `Você é um professor de Direito experiente, mas que sabe EXPLICAR DE FORMA SIMPLES.
Seu público são candidatos à OAB, mas você deve escrever como se estivesse explicando para uma pessoa de 16 anos.

## 🎯 REGRA FUNDAMENTAL DE ESCRITA (CRÍTICO!)

Imagine que está explicando para seu IRMÃO MAIS NOVO de 16 anos.
Ele é inteligente, mas nunca estudou Direito.

### ESTRUTURA OBRIGATÓRIA para cada conceito:
1. Primeiro explica COM SUAS PALAVRAS (simples, do dia a dia)
2. Depois diz o TERMO TÉCNICO entre aspas simples
3. Se tiver expressão em LATIM, traduz IMEDIATAMENTE

### EXEMPLO DE COMO DEVE ESCREVER:

"Quando alguém comete um crime, a polícia pode prender essa pessoa 
imediatamente se pegar ela no ato - isso se chama 'prisão em flagrante' 
(do latim 'flagrante delicto', que significa 'enquanto o crime ainda 
está acontecendo'). Funciona como pegar alguém 'com a mão na massa'."

### ✅ COMO ESCREVER (OBRIGATÓRIO):

1. **Primeiro o simples, depois o técnico:**
   - ERRADO: "A jurisdição voluntária caracteriza-se pela ausência de lide."
   - CERTO: "Quando não há briga entre as partes, mas apenas um pedido ao juiz (como autorizar a venda de um imóvel de menor), chamamos isso de 'jurisdição voluntária'."

2. **Sempre explique os termos jurídicos IMEDIATAMENTE (na mesma frase ou entre parênteses):**
   - ERRADO: "O princípio do contraditório deve ser observado."
   - CERTO: "O 'contraditório' (o direito de cada parte saber o que a outra disse e poder responder) é fundamental. Funciona como uma conversa: se alguém fala de você, você tem direito de se defender."

3. **Use ANALOGIAS do dia a dia para cada conceito abstrato:**
   - "Pense na 'competência' como os limites de cada 'território' do juiz. Assim como um policial de SP não pode multar alguém no RJ, um juiz só pode julgar dentro do seu 'território'."
   - "A 'coisa julgada' funciona como um jogo que já acabou - não dá mais pra voltar e mudar o placar."
   - "O 'litisconsórcio' é como um processo em dupla ou em grupo - várias pessoas do mesmo lado da briga."

4. **Traduza TODAS as expressões em latim IMEDIATAMENTE:**
   - ERRADO: "Aplica-se o princípio nemo iudex sine actore."
   - CERTO: "Aqui vale a regra 'nemo iudex sine actore' (que em latim significa 'não há juiz sem autor'). Na prática: o juiz não pode começar um processo sozinho, precisa que alguém peça."

5. **Exemplos concretos com nomes e situações do COTIDIANO:**
   - "Imagine que João bateu no carro de Maria. Maria quer receber o conserto. Ela vai precisar..."
   - "Pense assim: Ana comprou um celular online que nunca chegou. O que ela pode fazer?"
   - Use situações como: compra de celular, aluguel de apartamento, acidente de carro, contrato de trabalho

### ❌ O QUE NUNCA FAZER:
- NÃO use frases longas com muitas vírgulas e orações subordinadas
- NÃO assuma que o leitor sabe termos técnicos
- NÃO pule explicações (cada termo novo precisa de tradução imediata)
- NÃO seja prolixo ou rebuscado - seja direto
- NÃO comece com: "A prisão em flagrante, prevista no art. 302 do CPP, ocorre quando..." (isso é técnico demais!)

## ⛔⛔⛔ REGRA #2 - SAUDAÇÕES (LEIA COM ATENÇÃO!) ⛔⛔⛔

🚫 PROIBIDO EM QUALQUER SLIDE QUE NÃO SEJA "introducao" DA PRIMEIRA SEÇÃO:
- "Futuro colega,", "Prezado advogado,", "Caro estudante,", "Colega,"
- "Olá!", "Bem-vindo!", "Vamos lá!", "Bora!", "E aí!"
- "Tá preparado?", "Beleza?", "Partiu!", "Vamos nessa"
- "Olha só!", "Vamos mergulhar...", "Galera"
- QUALQUER saudação ou vocativo no início do slide

✅ OBRIGATÓRIO - Como iniciar slides normais (não introdução):
- "A jurisdição caracteriza-se por..." (direto no conceito)
- "Quando não há briga entre as partes..." (direto na explicação simples)
- "Pense assim: quando alguém..." (direto na analogia)
- "É fundamental entender que..." (direto no ponto)

⚠️ ÚNICA EXCEÇÃO: Slide tipo "introducao" da PRIMEIRA seção pode ter saudação.

## 📚 EXEMPLOS PRÁTICOS (REGRAS CRÍTICAS!)

⛔ NÃO inclua exemplo prático em TODOS os slides de texto!

✅ REGRAS OBRIGATÓRIAS:
1. NUNCA coloque mais de 1 exemplo prático por slide
2. Slides tipo "caso" JÁ SÃO o exemplo - NUNCA adicione "> 📚 **EXEMPLO PRÁTICO:**" dentro deles
3. Em slides tipo "texto", inclua exemplo em apenas 1 de cada 3-4 slides
4. O formato do exemplo é: "> 📚 **EXEMPLO PRÁTICO:** João comprou..."
5. VARIE os nomes nos exemplos: Ana, Pedro, Maria, Carlos, Fernanda, Lucas
6. Faça exemplos do COTIDIANO: compra de celular, aluguel de apartamento, acidente de carro, briga de vizinhos

## 🎨 VARIEDADE VISUAL (OBRIGATÓRIO!):

Intercale tipos de slides para manter DINAMISMO:
- A cada 2-3 slides "texto", insira um slide diferente:
  - "atencao": > ⚠️ **ATENÇÃO!** Ponto que CAI em prova...
  - "dica": > 💡 **DICA DE MEMORIZAÇÃO:** Para lembrar...
  - "caso": Slide inteiro dedicado a um caso prático (já é o exemplo!)
  - "termos": Glossário com 4-6 termos
  - "quickcheck": Pergunta de verificação

NUNCA gere 4+ slides tipo "texto" consecutivos sem intercalar!

## 📖 PROFUNDIDADE:
- Mínimo 200-400 palavras por página tipo "texto"
- Sempre incluir cards visuais quando apropriado: "> ⚠️ **ATENÇÃO:**", "> 💡 **DICA:**"
- Sempre traduzir latim imediatamente: "O termo 'habeas corpus' (do latim, 'que tenhas o corpo', ou seja, traga a pessoa presa)..."
- Cite juristas de forma acessível: "Como ensina Dinamarco (um dos grandes estudiosos do tema)..."
- Blockquotes para citações legais: > "Art. 421 do CC..."

## 🎯 ESTILO DE ESCRITA:
- Use expressões como "Veja bem...", "Perceba que...", "Observe...", "Na prática..."
- Perguntas retóricas para engajar: "E por que isso é tão importante?"
- Termos-chave e conceitos importantes ENTRE ASPAS: 'tipicidade', 'culpabilidade', 'dolo eventual'
- NUNCA mencione "PDF", "material", "documento" - escreva como conhecimento SEU

**Matéria:** ${areaNome} - OAB 1ª Fase
**Tópico:** ${topicoTitulo}

═══ REFERÊNCIA DE ESTUDO ═══
${conteudoPDF || "Conteúdo não disponível"}
${conteudoResumo ? `\n═══ SUBTEMAS ═══\n${conteudoResumo}` : ""}
${contextoBase ? `\n═══ BASE OAB ═══\n${contextoBase}` : ""}
═══════════════════════`;

    // Função ROBUSTA para remover saudações proibidas de slides que não são introdução
    const limparSaudacoesProibidas = (texto: string): string => {
      if (!texto) return texto;
      const saudacoesProibidas = [
        // Vocativos formais
        /^Futuro\s+colega,?\s*/gi,
        /^Prezad[oa]\s+(advogad[oa]|coleg[ao]|estudante)[^.]*,?\s*/gi,
        /^Car[oa]\s+(colega|estudante|futuro)[^.]*,?\s*/gi,
        /^Coleg[ao],?\s*/gi,
        /^Estimad[oa]\s+(colega|estudante|futuro)[^.]*,?\s*/gi,
        // Saudações casuais
        /^E aí,?\s*(galera|futuro|colega|pessoal)?[!,.\s]*/gi,
        /^Olha só[!,.\s]*/gi,
        /^Olá[!,.\s]*/gi,
        /^Bem-vind[oa][!,.\s]*/gi,
        /^Vamos\s+(lá|juntos|estudar|mergulhar|nessa)?[!,.\s]*/gi,
        /^Bora\s+(lá|entender|ver|estudar)?[!,.\s]*/gi,
        /^Tá preparad[oa][?!.\s]*/gi,
        /^Beleza[?!,.\s]*/gi,
        /^Partiu[!,.\s]*/gi,
        /^Vamos nessa[!,.\s]*/gi,
        /^(Cara|Mano),?\s*/gi,
        /^Galera,?\s*/gi,
        /^Pessoal,?\s*/gi,
        /^Oi[!,.\s]*/gi,
      ];
      let resultado = texto;
      for (const regex of saudacoesProibidas) {
        resultado = resultado.replace(regex, '');
      }
      // Se o resultado começar com letra minúscula após limpeza, capitalize
      if (resultado.length > 0 && /^[a-z]/.test(resultado)) {
        resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
      }
      return resultado.trim();
    };

    // ============================================
    // ETAPA 1: GERAR ESTRUTURA/ESQUELETO (IGUAL CONCEITOS)
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 1: Gerando estrutura/esqueleto...`);
    await updateProgress(30);
    
    const promptEstrutura = `${promptBase}

═══ SUA TAREFA ═══
Crie APENAS a ESTRUTURA/ESQUELETO do conteúdo interativo.
NÃO gere o conteúdo completo agora, apenas títulos e tipos de página.

Retorne um JSON com esta estrutura EXATA:
{
  "titulo": "${topicoTitulo}",
  "tempoEstimado": "25 min",
  "objetivos": ["Objetivo 1", "Objetivo 2", "Objetivo 3", "Objetivo 4"],
  "secoes": [
    {
      "id": 1,
      "titulo": "Nome da Seção",
      "paginas": [
        {"tipo": "introducao", "titulo": "O que você vai aprender"},
        {"tipo": "texto", "titulo": "Conceito Principal X"},
        {"tipo": "texto", "titulo": "Detalhamento de Y"},
        {"tipo": "termos", "titulo": "Termos Importantes"},
        {"tipo": "quickcheck", "titulo": "Verificação Rápida"}
      ]
    },
    {
      "id": 2,
      "titulo": "Segunda Seção",
      "paginas": [...]
    }
  ]
}

REGRAS:
1. Gere entre 5-7 seções (para alcançar 35-55 páginas totais)
2. Cada seção deve ter 6-10 páginas
3. TIPOS DISPONÍVEIS: introducao, texto, termos, linha_tempo, tabela, atencao, dica, caso, resumo, quickcheck
4. Distribua bem os tipos (não só "texto")
5. Cada seção deve ter pelo menos 1 quickcheck
6. Use títulos descritivos para cada página
7. Cubra TODO o conteúdo do material

Retorne APENAS o JSON, sem texto adicional.`;

    let estrutura: any = null;
    try {
      estrutura = await gerarJSON(promptEstrutura);
      
      if (!estrutura?.secoes || !Array.isArray(estrutura.secoes) || estrutura.secoes.length < 3) {
        throw new Error("Estrutura inválida: menos de 3 seções");
      }
      
      const totalPaginasEstrutura = estrutura.secoes.reduce(
        (acc: number, s: any) => acc + (s.paginas?.length || 0), 0
      );
      console.log(`[OAB Trilhas] ✓ Estrutura: ${estrutura.secoes.length} seções, ${totalPaginasEstrutura} páginas planejadas`);
    } catch (err) {
      console.error(`[OAB Trilhas] ❌ Erro na estrutura:`, err);
      throw new Error(`Falha ao gerar estrutura: ${err}`);
    }

    await updateProgress(35);

    // ============================================
    // ETAPA 2: GERAR CONTEÚDO POR SEÇÃO (BATCH INCREMENTAL - IGUAL CONCEITOS)
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 2: Gerando conteúdo seção por seção...`);
    
    const secoesCompletas: any[] = [];
    const totalSecoes = estrutura.secoes.length;

    for (let i = 0; i < totalSecoes; i++) {
      const secaoEstrutura = estrutura.secoes[i];
      const progressoSecao = Math.round(35 + (i / totalSecoes) * 40); // 35% a 75%
      
      console.log(`[OAB Trilhas] Gerando seção ${i + 1}/${totalSecoes}: ${secaoEstrutura.titulo}`);
      await updateProgress(progressoSecao);

      const promptSecao = `${promptBase}

═══ SUA TAREFA ═══
Gere o CONTEÚDO COMPLETO para a SEÇÃO ${i + 1}:
Título: "${secaoEstrutura.titulo}"

PÁGINAS A GERAR (com seus tipos):
${JSON.stringify(secaoEstrutura.paginas, null, 2)}

Para CADA página, retorne o objeto completo com:

1. Para tipo "introducao":
   {"tipo": "introducao", "titulo": "...", "conteudo": "Texto motivador sobre o que será aprendido na OAB..."}

2. Para tipo "texto":
   {"tipo": "texto", "titulo": "...", "conteudo": "Explicação EXTENSA (200-400 palavras) com exemplos, termos explicados, citações legais..."}

3. Para tipo "termos":
   {"tipo": "termos", "titulo": "...", "conteudo": "Introdução breve", "termos": [{"termo": "...", "definicao": "..."}]}

4. Para tipo "linha_tempo":
   {"tipo": "linha_tempo", "titulo": "...", "conteudo": "Contexto", "etapas": [{"titulo": "...", "descricao": "..."}]}

5. Para tipo "tabela":
   {"tipo": "tabela", "titulo": "...", "conteudo": "Descrição", "tabela": {"cabecalhos": [...], "linhas": [[...], [...]]}}

6. Para tipo "atencao":
   {"tipo": "atencao", "titulo": "...", "conteudo": "⚠️ Ponto importante que CAI NA OAB..."}

7. Para tipo "dica":
   {"tipo": "dica", "titulo": "...", "conteudo": "💡 Dica de memorização ou macete para a prova OAB..."}

8. Para tipo "caso":
   {"tipo": "caso", "titulo": "...", "conteudo": "💼 Caso prático que pode aparecer na OAB..."}

9. Para tipo "quickcheck":
   {"tipo": "quickcheck", "titulo": "...", "conteudo": "Teste seu conhecimento:", "pergunta": "...", "opcoes": ["A", "B", "C", "D"], "resposta": 0, "feedback": "Explicação..."}

10. Para tipo "resumo":
    {"tipo": "resumo", "titulo": "...", "conteudo": "Recapitulando para a OAB:", "pontos": ["...", "...", "..."]}

Retorne um JSON com a seção COMPLETA:
{
  "id": ${secaoEstrutura.id},
  "titulo": "${secaoEstrutura.titulo}",
  "slides": [
    // Array com TODAS as páginas completas
  ]
}

REGRAS CRÍTICAS:
- Páginas "texto" devem ter 200-400 palavras com exemplos práticos
- Use blockquotes (>) para citações e cards de atenção
- NUNCA use emojis no texto corrido (só nos cards especiais)
- Foco em como o tema CAI NA OAB

Retorne APENAS o JSON da seção, sem texto adicional.`;

      try {
        const secaoCompleta = await gerarJSON(promptSecao);
        
        if (!secaoCompleta?.slides || !Array.isArray(secaoCompleta.slides)) {
          throw new Error(`Seção ${i + 1} sem slides válidos`);
        }
        
        if (secaoCompleta.slides.length < 3) {
          throw new Error(`Seção ${i + 1} com apenas ${secaoCompleta.slides.length} slides`);
        }
        
        // PÓS-PROCESSAMENTO: Remover saudações proibidas de slides que não são introdução
        for (const slide of secaoCompleta.slides) {
          // Só limpa se não for introdução da primeira seção
          const isPrimeiraSecaoIntro = i === 0 && slide.tipo === 'introducao';
          if (!isPrimeiraSecaoIntro && slide.conteudo) {
            slide.conteudo = limparSaudacoesProibidas(slide.conteudo);
          }
        }
        
        secoesCompletas.push(secaoCompleta);
        console.log(`[OAB Trilhas] ✓ Seção ${i + 1}: ${secaoCompleta.slides.length} páginas (sanitizado)`);
        
      } catch (err) {
        console.error(`[OAB Trilhas] ❌ Erro na seção ${i + 1}:`, err);
        secoesCompletas.push({
          id: secaoEstrutura.id,
          titulo: secaoEstrutura.titulo,
          slides: [{
            tipo: "texto",
            titulo: secaoEstrutura.titulo,
            conteudo: `Conteúdo da seção "${secaoEstrutura.titulo}" está sendo regenerado. Por favor, tente novamente em alguns instantes.`
          }]
        });
      }
    }

    await updateProgress(80);

    // ============================================
    // ETAPA 3: GERAR EXTRAS (correspondências, flashcards, questões)
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 3: Gerando extras (flashcards, questões)...`);

    const promptExtras = `${promptBase}

═══ SUA TAREFA ═══
Gere elementos de estudo complementares para a OAB:

Retorne JSON com:
{
  "correspondencias": [
    {"termo": "Termo do conteúdo", "definicao": "Definição curta (máx 60 chars)"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Descrição", "analise": "Análise", "conclusao": "Conclusão"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Definição completa"}
  ],
  "flashcards": [
    {"frente": "Pergunta estilo OAB", "verso": "Resposta", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado estilo OAB", "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"], "correta": 0, "explicacao": "Explicação"}
  ]
}

QUANTIDADES:
- correspondencias: 8-10 pares (para jogo Ligar Termos)
- exemplos: 5-8 casos práticos
- termos: 10-15 termos importantes
- flashcards: 15-20 cards
- questoes: 8-12 questões estilo OAB

Retorne APENAS o JSON, sem texto adicional.`;

    let extras: any = { correspondencias: [], exemplos: [], termos: [], flashcards: [], questoes: [] };
    try {
      extras = await gerarJSON(promptExtras);
      console.log(`[OAB Trilhas] ✓ Extras: ${extras.correspondencias?.length || 0} corresp, ${extras.flashcards?.length || 0} flashcards, ${extras.questoes?.length || 0} questões`);
    } catch (err) {
      console.error(`[OAB Trilhas] ⚠️ Erro nos extras (usando vazios):`, err);
    }

    await updateProgress(85);

    // ============================================
    // MONTAR CONTEÚDO FINAL (FORMATO IGUAL CONCEITOS)
    // ============================================
    const totalPaginas = secoesCompletas.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    console.log(`[OAB Trilhas] Total de páginas geradas: ${totalPaginas}`);

    // Validação de páginas mínimas
    if (totalPaginas < MIN_PAGINAS) {
      console.log(`[OAB Trilhas] ⚠️ Apenas ${totalPaginas} páginas (mínimo: ${MIN_PAGINAS})`);
      
      const novasTentativas = tentativasAtuais + 1;
      
      if (novasTentativas >= MAX_TENTATIVAS) {
        console.log(`[OAB Trilhas] ❌ Máximo de tentativas atingido, marcando como erro`);
        await supabase.from("oab_trilhas_topicos")
          .update({ status: "erro", tentativas: novasTentativas, progresso: 0 })
          .eq("id", topico_id);
        
        await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
        
        return new Response(
          JSON.stringify({ error: `Falha após ${MAX_TENTATIVAS} tentativas (${totalPaginas}/${MIN_PAGINAS} páginas)` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Recolocar na fila
      const { data: maxPosicao } = await supabase
        .from("oab_trilhas_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      await supabase.from("oab_trilhas_topicos")
        .update({ 
          status: "na_fila", 
          posicao_fila: novaPosicao,
          tentativas: novasTentativas,
          conteudo_gerado: null,
          progresso: 0
        })
        .eq("id", topico_id);
      
      await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);
      
      return new Response(
        JSON.stringify({ requeued: true, reason: `${totalPaginas}/${MIN_PAGINAS} páginas`, position: novaPosicao }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // ETAPA 4: GERAR SÍNTESE FINAL (SLIDE DE ENCERRAMENTO)
    // ============================================
    console.log(`[OAB Trilhas] ETAPA 4: Gerando síntese final...`);
    
    const promptSintese = `${promptBase}

═══ SUA TAREFA ═══
Com base em TODO o conteúdo gerado sobre "${topicoTitulo}", crie uma SÍNTESE FINAL completa.

Esta síntese deve:
1. Resumir os PONTOS-CHAVE de cada seção estudada
2. Destacar os conceitos mais importantes para a OAB
3. Incluir termos-chave que DEVEM ser memorizados
4. Listar dicas de prova e pegadinhas comuns

Retorne um JSON com a estrutura:
{
  "pontos": [
    "Ponto-chave 1: Descrição clara e objetiva",
    "Ponto-chave 2: Conceito fundamental para a OAB",
    "Ponto-chave 3: Termo importante a memorizar",
    "Ponto-chave 4: Dica de prova",
    "Ponto-chave 5: Outro conceito essencial"
  ]
}

Gere entre 8-12 pontos-chave que resumam TODO o conteúdo estudado.
Cada ponto deve ter entre 15-50 palavras.

Retorne APENAS o JSON, sem texto adicional.`;

    let sinteseFinalPontos: string[] = [];
    try {
      const sintese = await gerarJSON(promptSintese);
      if (sintese?.pontos && Array.isArray(sintese.pontos)) {
        sinteseFinalPontos = sintese.pontos.slice(0, 12);
        console.log(`[OAB Trilhas] ✓ Síntese final: ${sinteseFinalPontos.length} pontos`);
      }
    } catch (err) {
      console.error(`[OAB Trilhas] ⚠️ Erro na síntese final (usando fallback):`, err);
      // Fallback: gerar pontos a partir dos títulos das seções
      sinteseFinalPontos = secoesCompletas.flatMap(s => 
        (s.slides || []).slice(0, 2).map((slide: any) => slide.titulo || "")
      ).filter(Boolean).slice(0, 8);
    }

    // Criar slide de Síntese Final e adicionar como última seção
    const slideSinteseFinal = {
      tipo: "resumo",
      titulo: "Síntese Final",
      conteudo: `Parabéns, futuro colega! Você completou o estudo de **${topicoTitulo}**.\n\nAbaixo estão os pontos mais importantes que você precisa dominar para a OAB:`,
      pontos: sinteseFinalPontos
    };

    // Adicionar seção de Síntese Final ao final
    const secaoSinteseFinal = {
      id: secoesCompletas.length + 1,
      titulo: "Síntese Final",
      slides: [slideSinteseFinal]
    };
    secoesCompletas.push(secaoSinteseFinal);

    // Montar estrutura final no formato de Conceitos
    const conteudoFinal = {
      versao: 1,
      titulo: topicoTitulo,
      tempoEstimado: estrutura.tempoEstimado || "25 min",
      area: areaNome,
      objetivos: estrutura.objetivos || [],
      secoes: secoesCompletas,
      // Manter também o formato de páginas flat para compatibilidade
      paginas: secoesCompletas.flatMap(s => s.slides || []).map((slide: any) => ({
        titulo: slide.titulo,
        tipo: slide.tipo,
        markdown: slide.conteudo
      }))
    };

    await updateProgress(90);

    // Validar correspondências
    let correspondenciasValidas = extras.correspondencias || [];
    correspondenciasValidas = correspondenciasValidas
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));

    const termosComCorrespondencias = {
      glossario: extras.termos || [],
      correspondencias: correspondenciasValidas
    };

    // Salvar no banco
    const { error: updateError } = await supabase
      .from("oab_trilhas_topicos")
      .update({
        conteudo_gerado: conteudoFinal,  // Agora salva o JSON completo, não markdown
        exemplos: extras.exemplos || [],
        termos: termosComCorrespondencias,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        status: "concluido",
        progresso: 100,
        tentativas: tentativasAtuais + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[OAB Trilhas] ✅ Conteúdo salvo com sucesso: ${topicoTitulo}`);
    console.log(`[OAB Trilhas] Stats: ${totalPaginas} páginas, ${secoesCompletas.length} seções`);

    await updateProgress(95);

    // ============================================
    // GERAR CAPA DO TÓPICO (IGUAL CONCEITOS)
    // ============================================
    console.log(`[OAB Trilhas] Gerando capa do tópico...`);
    try {
      await supabase.functions.invoke("gerar-capa-topico-oab", {
        body: { 
          topico_id,
          titulo: topicoTitulo,
          area: areaNome
        }
      });
      console.log(`[OAB Trilhas] ✓ Capa solicitada`);
    } catch (e) {
      console.log(`[OAB Trilhas] ⚠️ Capa não gerada (continuando sem):`, e);
    }

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Conteúdo gerado com sucesso - ${totalPaginas} páginas em ${secoesCompletas.length} seções`,
        topico_id,
        titulo: topicoTitulo,
        area: areaNome,
        stats: {
          secoes: secoesCompletas.length,
          paginas: totalPaginas,
          correspondencias: correspondenciasValidas.length,
          flashcards: extras.flashcards?.length || 0,
          questoes: extras.questoes?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[OAB Trilhas] ❌ Erro ao gerar conteúdo:", error);

    try {
      if (topicoIdForCatch) {
        const supabase = supabaseForCatch || createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { data: topicoAtual } = await supabase
          .from("oab_trilhas_topicos")
          .select("tentativas")
          .eq("id", topicoIdForCatch)
          .single();

        const tentativas = (topicoAtual?.tentativas || 0) + 1;

        if (tentativas < MAX_TENTATIVAS) {
          const { data: maxPos } = await supabase
            .from("oab_trilhas_topicos")
            .select("posicao_fila")
            .eq("status", "na_fila")
            .order("posicao_fila", { ascending: false })
            .limit(1)
            .single();

          const novaPosicao = (maxPos?.posicao_fila || 0) + 1;

          await supabase
            .from("oab_trilhas_topicos")
            .update({ 
              status: "na_fila", 
              posicao_fila: novaPosicao,
              tentativas,
              progresso: 0,
              conteudo_gerado: null,
              updated_at: new Date().toISOString()
            })
            .eq("id", topicoIdForCatch);

          console.log(`[OAB Fila] ♻️ Erro recuperável, recolocando na fila (tentativa ${tentativas}/${MAX_TENTATIVAS})`);
        } else {
          await supabase
            .from("oab_trilhas_topicos")
            .update({ status: "erro", tentativas, progresso: 0, updated_at: new Date().toISOString() })
            .eq("id", topicoIdForCatch);

          console.log(`[OAB Fila] ❌ Erro após ${MAX_TENTATIVAS} tentativas`);
        }
        
        await processarProximoDaFila(supabase, Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      }
    } catch (catchErr) {
      console.error("[OAB Trilhas] Erro ao processar retry:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar para processar próximo item da fila
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const { data: proximo, error } = await supabase
      .from("oab_trilhas_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(1)
      .single();

    if (error || !proximo) {
      console.log("[OAB Fila] Nenhum item na fila para processar");
      return;
    }

    console.log(`[OAB Fila] Iniciando próximo da fila: ${proximo.titulo} (ID: ${proximo.id})`);

    const functionUrl = `${supabaseUrl}/functions/v1/gerar-conteudo-oab-trilhas`;
    
    fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => {
      console.error("[OAB Fila] Erro ao iniciar próximo:", err);
    });
    
  } catch (err) {
    console.error("[OAB Fila] Erro ao buscar próximo da fila:", err);
  }
}
