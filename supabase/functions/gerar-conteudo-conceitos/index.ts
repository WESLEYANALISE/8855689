import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Configuração das páginas a serem geradas (estrutura ALINHADA com OAB Trilhas)
const PAGINAS_CONFIG = [
  { 
    tipo: "introducao", 
    titulo: "Introdução", 
    promptExtra: `Escreva uma introdução clara de 300-500 palavras.
Tom acolhedor e motivador.
Comece com algo engajador: "Vamos falar sobre um tema super importante..."
Contextualize a importância do tema de forma natural.
Explique o que será abordado na trilha.

Use elementos visuais quando apropriado:
> 🎯 **VOCÊ SABIA?:** [curiosidade relevante sobre o tema]` 
  },
  { 
    tipo: "conteudo_principal", 
    titulo: "Conteúdo Completo", 
    promptExtra: `Escreva o conteúdo principal com MÍNIMO 3000 palavras.
Cubra TODO o conteúdo do PDF de forma didática e organizada.
Use subtítulos (###) para estruturar cada parte.

OBRIGATÓRIO usar estes elementos visuais ao longo do texto:
> ⚠️ **ATENÇÃO:** [ponto importante que o estudante deve observar]
> 💡 **DICA:** [dica prática para entender melhor]
> 📌 **EM RESUMO:** [resumo de uma seção]
> 💼 **CASO PRÁTICO:** [exemplo prático da aplicação]

Use pelo menos 3-5 destes elementos ao longo do conteúdo.` 
  },
  { 
    tipo: "desmembrando", 
    titulo: "Desmembrando o Tema", 
    promptExtra: `Análise detalhada de cada elemento importante do tema (800-1200 palavras).
Decomponha os conceitos complexos em partes menores.

Para CADA termo ou conceito importante, analise:
- **Significado jurídico:** O que significa exatamente no contexto do Direito
- **Etimologia/Origem:** De onde vem o termo, sua origem histórica ou linguística (quando relevante)
- **Pronúncia correta:** Como pronunciar corretamente (quando houver dúvida comum)
- **Elementos constitutivos:** Quais são os componentes ou requisitos
- **Características principais:** O que o diferencia de outros institutos
- **Natureza jurídica:** Qual sua natureza no ordenamento

Inicie: "Olha, isso parece complicado, mas vou te mostrar passo a passo..."
Use exemplos para clarificar cada elemento.

Formato sugerido para cada conceito:
### [Nome do Conceito]

**Significado:** [explicação]
**Origem:** [etimologia ou história]
**Elementos:** [componentes]
**Características:** [diferenciais]` 
  },
  { 
    tipo: "entendendo_na_pratica", 
    titulo: "Entendendo na Prática", 
    promptExtra: `Apresente 5 exemplos práticos/casos concretos (800-1200 palavras).
Use situações reais ou hipotéticas com análise jurídica.

Formato para cada caso:
### Caso 1: [Título do Caso]
> 💼 **CASO PRÁTICO:** [Descrição da situação]

**Análise Jurídica:** [Análise do caso]
**Conclusão:** [Conclusão do caso]` 
  },
  { 
    tipo: "quadro_comparativo", 
    titulo: "Quadro Comparativo", 
    promptExtra: `Crie tabelas comparativas dos principais institutos relacionados ao tema.
Compare elementos, requisitos, efeitos de forma clara.
Use formato Markdown de tabela CORRETO.
Inclua pelo menos 2 tabelas relevantes.

Formato OBRIGATÓRIO para cada tabela:

| Aspecto | Instituto A | Instituto B |
|---------|-------------|-------------|
| Definição | ... | ... |
| Requisitos | ... | ... |
| Efeitos | ... | ... |
| Previsão Legal | ... | ... |

Garanta que cada tabela tenha:
- Linha de cabeçalho com nomes dos institutos
- Linha separadora (|---|---|---|)
- Linhas de dados bem formatadas` 
  },
  { 
    tipo: "dicas_provas", 
    titulo: "Dicas para Memorizar", 
    promptExtra: `Forneça dicas de memorização, macetes e pontos-chave (600-800 palavras).
Use técnicas como acrônimos, associações, esquemas mentais.
Destaque o que mais cai em provas.

OBRIGATÓRIO usar:
> 💡 **DICA DE PROVA:** [macete ou dica específica para provas]
> ⚠️ **ATENÇÃO:** [ponto que costuma confundir em provas]

Use pelo menos 4-5 destes elementos.` 
  },
  { 
    tipo: "correspondencias", 
    titulo: "Ligar Termos", 
    promptExtra: `Escreva uma breve instrução (2-3 frases) para um exercício interativo.
O estudante vai ligar os termos às suas definições corretas arrastando os elementos.

Exemplo: "Conecte cada termo à sua definição correta arrastando os elementos. Este exercício vai ajudar você a fixar os conceitos principais que estudamos."

NOTA: Os dados do jogo (pares termo/definição) serão gerados separadamente.` 
  },
  { 
    tipo: "sintese_final", 
    titulo: "Síntese Final", 
    promptExtra: `Faça um resumo conciso de tudo que foi abordado (500-700 palavras).
Destaque os pontos principais e conecte os conceitos.
Encerre de forma motivadora.

Use:
> 📌 **EM RESUMO:** [síntese dos pontos principais]

Inclua um checklist final:
- [ ] Conceito X compreendido
- [ ] Diferença entre A e B clara
- [ ] Requisitos memorizados` 
  },
];

// Páginas extras que geram JSON estruturado
const EXTRAS_CONFIG = [
  { tipo: "correspondencias", minimo: 8 },
  { tipo: "exemplos", minimo: 5 },
  { tipo: "termos", minimo: 10 },
  { tipo: "flashcards", minimo: 15 },
  { tipo: "questoes", minimo: 8 },
];

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
    // SISTEMA DE FILA
    // ============================================
    const { data: gerandoAtivo } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "gerando")
      .neq("id", topico_id)
      .limit(1);

    if (gerandoAtivo && gerandoAtivo.length > 0) {
      console.log(`[Conceitos Fila] Geração ativa: ${gerandoAtivo[0].titulo}`);
      
      const { data: maxPosicao } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila")
        .eq("status", "na_fila")
        .order("posicao_fila", { ascending: false })
        .limit(1)
        .single();
      
      const novaPosicao = (maxPosicao?.posicao_fila || 0) + 1;
      
      const { data: jaEnfileirado } = await supabase
        .from("conceitos_topicos")
        .select("posicao_fila, status")
        .eq("id", topico_id)
        .single();
      
      if (jaEnfileirado?.status === "na_fila") {
        return new Response(
          JSON.stringify({ queued: true, position: jaEnfileirado.posicao_fila }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      await supabase
        .from("conceitos_topicos")
        .update({ status: "na_fila", posicao_fila: novaPosicao })
        .eq("id", topico_id);
      
      return new Response(
        JSON.stringify({ queued: true, position: novaPosicao }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // BUSCAR TÓPICO
    // ============================================
    const { data: topico, error: topicoError } = await supabase
      .from("conceitos_topicos")
      .select(`*, materia:conceitos_materias(id, nome, codigo)`)
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

    // Marcar como gerando
    await supabase
      .from("conceitos_topicos")
      .update({ status: "gerando", progresso: 5, posicao_fila: null })
      .eq("id", topico_id);

    const materiaNome = topico.materia?.nome || "";
    const topicoTitulo = topico.titulo;
    console.log(`[Conceitos] Iniciando geração página-por-página: ${topicoTitulo}`);

    // ============================================
    // BUSCAR CONTEÚDO DO PDF
    // ============================================
    const { data: paginas } = await supabase
      .from("conceitos_topico_paginas")
      .select("pagina, conteudo")
      .eq("topico_id", topico_id)
      .order("pagina", { ascending: true });

    let conteudoPDF = "";
    if (paginas && paginas.length > 0) {
      conteudoPDF = paginas
        .filter(p => p.conteudo && p.conteudo.trim().length > 0)
        .map(p => `\n--- PÁGINA ${p.pagina} ---\n${p.conteudo}`)
        .join("\n\n");
      console.log(`[Conceitos] PDF: ${paginas.length} páginas, ${conteudoPDF.length} chars`);
    }

    // ============================================
    // CONFIGURAR GEMINI
    // ============================================
    const geminiKeys = [
      Deno.env.get("GEMINI_KEY_1"),
      Deno.env.get("GEMINI_KEY_2"),
      Deno.env.get("GEMINI_KEY_3"),
    ].filter(Boolean);
    const geminiKey = geminiKeys[Math.floor(Math.random() * geminiKeys.length)];
    const genAI = new GoogleGenerativeAI(geminiKey!);
    // Usando gemini-2.5-flash-lite para geração de conteúdo de conceitos (mais rápido e econômico)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // Função para atualizar progresso
    const updateProgress = async (value: number) => {
      await supabase
        .from("conceitos_topicos")
        .update({ progresso: value })
        .eq("id", topico_id);
    };

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

    // Função para gerar e fazer parse de JSON
    async function gerarJSON(prompt: string): Promise<any> {
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
    }

    // Função para limpar instruções vazadas no texto
    function limparInstrucoesVazadas(texto: string): string {
      const padroesRemover = [
        /^(Não inclua|INSTRUÇÕES|Retorne APENAS|REGRAS|PROIBIDO)[^\n]*\n*/gi,
        /^(Comece diretamente|O título será|O título da seção)[^\n]*\n*/gi,
        /^(Aqui está|Segue o conteúdo|Segue abaixo)[^\n]*\n*/gi,
        /^(Observação:|Nota:|OBS:)[^\n]*\n*/gi,
        /^(Esta seção|Nesta seção)[^\n]*\n*/gi,
        /^---\s*$/gm, // Remove linhas só com ---
      ];
      
      let limpo = texto.trim();
      for (const padrao of padroesRemover) {
        limpo = limpo.replace(padrao, '');
      }
      // Limpar múltiplas quebras de linha no início
      limpo = limpo.replace(/^\n+/, '');
      return limpo.trim();
    }

    // Função para gerar texto markdown
    async function gerarTexto(prompt: string): Promise<string> {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.6 },
      });
      const textoRaw = result.response.text();
      return limparInstrucoesVazadas(textoRaw);
    }

    // ============================================
    // GERAR PÁGINA POR PÁGINA
    // ============================================
    const paginasGeradas: { titulo: string; tipo: string; markdown: string }[] = [];
    const baseProgress = 10;
    const progressPerPage = 70 / PAGINAS_CONFIG.length;

    const promptBase = `Você é um professor de Direito descontraído, didático e apaixonado por ensinar.
Seu estilo é como uma CONVERSA COM UM AMIGO - você explica os conceitos como se estivesse tomando um café e ajudando um colega a entender a matéria.

## 🎯 SEU ESTILO DE ESCRITA OBRIGATÓRIO:

### ✅ FAÇA SEMPRE:
- Escreva como se estivesse CONVERSANDO com o estudante
- Use expressões naturais como:
  • "Olha só, é assim que funciona..."
  • "Veja bem, isso é super importante porque..."
  • "Sabe aquela situação de...? Pois é, aqui se aplica isso!"
  • "Deixa eu te explicar de outro jeito..."
  • "Percebeu a diferença? Esse é o pulo do gato!"
  • "Agora vem a parte interessante..."
  • "Calma, não se assuste, é mais simples do que parece..."
  • "Resumindo pra você não esquecer..."
- Use perguntas retóricas para engajar ("E por que isso importa tanto?")
- Faça analogias com situações do dia a dia
- Antecipe dúvidas ("Você pode estar pensando: mas e se...? A resposta é...")
- Conecte os tópicos com transições naturais

### ❌ NÃO FAÇA:
- Linguagem excessivamente formal/acadêmica
- Parágrafos longos e densos sem pausas
- Explicações secas e diretas demais
- Texto que pareça copiado de um livro jurídico
- Começar frases com "É importante ressaltar que..." ou "Cumpre observar que..."
- **NUNCA USE EMOJIS NO TEXTO** (proibido qualquer emoji como 😊, 🎯, 📚, ⚖️, etc.)

⛔ REGRA ABSOLUTA: FIDELIDADE 100% AO CONTEÚDO DO PDF
- Use 100% do texto e informações do PDF
- Cite APENAS artigos/leis que aparecem LITERALMENTE no PDF
- NÃO invente artigos de lei que NÃO estejam no PDF
- NÃO adicione citações legais que você "sabe" mas NÃO estão no conteúdo

**Matéria:** ${materiaNome}
**Tópico:** ${topicoTitulo}

═══ CONTEÚDO DO PDF ═══
${conteudoPDF || "Conteúdo não disponível"}
═══════════════════════`;

    for (let i = 0; i < PAGINAS_CONFIG.length; i++) {
      const config = PAGINAS_CONFIG[i];
      const progress = Math.round(baseProgress + (i * progressPerPage));
      await updateProgress(progress);
      
      console.log(`[Conceitos] Gerando página ${i + 1}/${PAGINAS_CONFIG.length}: ${config.tipo}`);
      
      const prompt = `${promptBase}

═══ SUA TAREFA ═══
${config.promptExtra}

[IMPORTANTE: Comece diretamente com o primeiro parágrafo do conteúdo. NÃO repita estas instruções no texto.]`;

      try {
        const markdown = await gerarTexto(prompt);
        paginasGeradas.push({
          titulo: `${config.titulo}: ${topicoTitulo}`,
          tipo: config.tipo,
          markdown: markdown.trim()
        });
        console.log(`[Conceitos] ✓ Página ${config.tipo}: ${markdown.length} chars`);
      } catch (err) {
        console.error(`[Conceitos] ❌ Erro na página ${config.tipo}:`, err);
        paginasGeradas.push({
          titulo: `${config.titulo}: ${topicoTitulo}`,
          tipo: config.tipo,
          markdown: `Conteúdo não disponível para esta seção.`
        });
      }
    }

    await updateProgress(80);
    console.log(`[Conceitos] ${paginasGeradas.length} páginas geradas`);

    // ============================================
    // GERAR EXTRAS (JSON)
    // ============================================
    console.log(`[Conceitos] Gerando extras (correspondências, flashcards, questões)...`);

    const promptExtras = `${promptBase}

═══ SUA TAREFA ═══
Gere os seguintes elementos de estudo baseados no conteúdo:

Retorne um JSON válido com esta estrutura EXATA:
{
  "correspondencias": [
    {"termo": "Termo do PDF", "definicao": "Definição curta (máx 60 chars)"}
  ],
  "exemplos": [
    {"titulo": "Título do caso", "situacao": "Descrição", "analise": "Análise jurídica", "conclusao": "Conclusão"}
  ],
  "termos": [
    {"termo": "Termo jurídico", "definicao": "Definição completa"}
  ],
  "flashcards": [
    {"frente": "Pergunta", "verso": "Resposta", "exemplo": "Exemplo prático"}
  ],
  "questoes": [
    {"pergunta": "Enunciado da questão", "alternativas": ["A) opção", "B) opção", "C) opção", "D) opção"], "correta": 0, "explicacao": "Explicação da resposta"}
  ]
}

QUANTIDADES:
- correspondencias: mínimo 8 pares
- exemplos: mínimo 5 casos
- termos: mínimo 10 termos
- flashcards: mínimo 15 cards
- questoes: mínimo 8 questões

Retorne APENAS o JSON, sem texto adicional.`;

    let extras: any = {};
    try {
      extras = await gerarJSON(promptExtras);
      console.log(`[Conceitos] ✓ Extras gerados`);
    } catch (err) {
      console.error(`[Conceitos] ❌ Erro nos extras, gerando fallback:`, err);
      extras = {
        correspondencias: [],
        exemplos: [],
        termos: [],
        flashcards: [],
        questoes: []
      };
    }

    await updateProgress(90);

    // Validar correspondências
    let correspondencias = extras.correspondencias || [];
    if (!Array.isArray(correspondencias) || correspondencias.length < 6) {
      // Fallback: usar termos se disponíveis
      if (extras.termos && Array.isArray(extras.termos) && extras.termos.length >= 6) {
        correspondencias = extras.termos.slice(0, 10).map((t: any) => ({
          termo: t.termo || t.nome || String(t),
          definicao: (t.definicao || t.descricao || "Conceito jurídico").substring(0, 60)
        }));
      }
    }
    
    correspondencias = correspondencias
      .filter((c: any) => c && c.termo && c.definicao)
      .slice(0, 10)
      .map((c: any) => ({
        termo: String(c.termo).trim().substring(0, 50),
        definicao: String(c.definicao).trim().substring(0, 80)
      }));

    console.log(`[Conceitos] Correspondências válidas: ${correspondencias.length}`);

    // ============================================
    // MONTAR CONTEÚDO FINAL COM TÍTULOS DAS SEÇÕES
    // ============================================
    const conteudoPrincipal = paginasGeradas
      .map((p, i) => {
        // Adiciona título da seção como ## para criar páginas no reader
        const tituloSecao = `## ${p.titulo.split(':')[0]}\n\n`;
        return `${tituloSecao}${p.markdown}`;
      })
      .join("\n\n---\n\n");

    const termosComCorrespondencias = {
      glossario: extras.termos || [],
      correspondencias: correspondencias
    };

    // ============================================
    // SALVAR NO BANCO
    // ============================================
    const { error: updateError } = await supabase
      .from("conceitos_topicos")
      .update({
        conteudo_gerado: conteudoPrincipal,
        exemplos: extras.exemplos || [],
        termos: termosComCorrespondencias,
        flashcards: extras.flashcards || [],
        questoes: extras.questoes || [],
        status: "concluido",
        progresso: 100,
        tentativas: (topico.tentativas || 0) + 1,
        posicao_fila: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", topico_id);

    if (updateError) {
      throw updateError;
    }

    console.log(`[Conceitos] ✅ Conteúdo salvo: ${topicoTitulo}`);

    // Processar próximo da fila
    await processarProximoDaFila(supabase, supabaseUrl, supabaseServiceKey);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conteúdo gerado página por página",
        topico_id,
        titulo: topicoTitulo,
        paginas: paginasGeradas.length,
        stats: {
          correspondencias: correspondencias.length,
          exemplos: extras.exemplos?.length || 0,
          termos: extras.termos?.length || 0,
          flashcards: extras.flashcards?.length || 0,
          questoes: extras.questoes?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[Conceitos] ❌ Erro:", error);

    try {
      if (topicoIdForCatch && supabaseForCatch) {
        await supabaseForCatch
          .from("conceitos_topicos")
          .update({ status: "erro", progresso: 0 })
          .eq("id", topicoIdForCatch);

        await processarProximoDaFila(
          supabaseForCatch,
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
      }
    } catch (catchErr) {
      console.error("[Conceitos] Erro no fallback:", catchErr);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função auxiliar para processar próximo da fila
async function processarProximoDaFila(supabase: any, supabaseUrl: string, supabaseServiceKey: string) {
  try {
    const { data: proximo, error } = await supabase
      .from("conceitos_topicos")
      .select("id, titulo")
      .eq("status", "na_fila")
      .order("posicao_fila", { ascending: true })
      .limit(1)
      .single();

    if (error || !proximo) {
      console.log("[Conceitos Fila] Fila vazia");
      return;
    }

    console.log(`[Conceitos Fila] Próximo: ${proximo.titulo}`);

    fetch(`${supabaseUrl}/functions/v1/gerar-conteudo-conceitos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ topico_id: proximo.id }),
    }).catch(err => console.error("[Conceitos Fila] Erro:", err));
  } catch (err) {
    console.error("[Conceitos Fila] Erro:", err);
  }
}
