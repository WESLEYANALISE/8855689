import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

interface EstruturaLivro {
  capitulos: Array<{ titulo: string; paginaInicio: number }>;
  paginasIgnorar: number[];
  primeiraPaginaConteudo: number;
  fonteAnalise: 'sumario' | 'conteudo';
}

// Buscar páginas que contêm sumário/índice (pode ser múltiplas páginas)
function encontrarPaginasSumario(paginas: any[]): { paginaInicio: number; conteudo: string } | null {
  const termosIndiceSumario = [
    /^SUMÁRIO$/im,
    /^ÍNDICE$/im,
    /^SUMARIO$/im,
    /^INDICE$/im,
    /^TABLE OF CONTENTS$/im,
    /^CONTENTS$/im,
    /SUMÁRIO\s*\n/im,
    /ÍNDICE\s*\n/im
  ];

  let indiceSumario = -1;
  
  // Buscar a primeira página com sumário
  for (let i = 0; i < paginas.length; i++) {
    const conteudo = paginas[i]["Conteúdo"] || "";
    for (const termo of termosIndiceSumario) {
      if (termo.test(conteudo)) {
        indiceSumario = i;
        console.log(`[ANÁLISE] Sumário encontrado na página ${paginas[i].Pagina}`);
        break;
      }
    }
    if (indiceSumario >= 0) break;
  }
  
  if (indiceSumario === -1) return null;
  
  // Pegar a página do sumário + próximas 3 páginas (sumário pode ocupar várias páginas)
  let conteudoCompleto = "";
  for (let i = indiceSumario; i < Math.min(indiceSumario + 4, paginas.length); i++) {
    const pag = paginas[i];
    const conteudo = pag["Conteúdo"] || "";
    
    // Parar se encontrar uma página que parece ser início de capítulo
    const pareceCapitulo = /^(APRESENTAÇÃO|PREFÁCIO|INTRODUÇÃO|CAPÍTULO|PARTE\s+[IVX\d])/im.test(conteudo);
    if (i > indiceSumario && pareceCapitulo && !conteudo.includes("SUMÁRIO") && !conteudo.includes("ÍNDICE")) {
      console.log(`[ANÁLISE] Fim do sumário detectado na página ${pag.Pagina}`);
      break;
    }
    
    conteudoCompleto += `\n--- PÁGINA ${pag.Pagina} ---\n${conteudo}\n`;
  }
  
  return { paginaInicio: paginas[indiceSumario].Pagina, conteudo: conteudoCompleto };
}

// Analisar estrutura a partir do SUMÁRIO
async function analisarPeloSumario(paginaSumario: { paginaInicio: number; conteudo: string }, totalPaginas: number, geminiKey: string): Promise<EstruturaLivro | null> {
  const prompt = `Você é um especialista em análise de livros. Extraia a estrutura COMPLETA do livro a partir deste SUMÁRIO/ÍNDICE.

CONTEÚDO DO SUMÁRIO (iniciando na página ${paginaSumario.paginaInicio}):
${paginaSumario.conteudo}

INFORMAÇÃO: Este livro tem ${totalPaginas} páginas no total.

REGRAS ABSOLUTAS:

1. **NUNCA INCLUA "SUMÁRIO" OU "ÍNDICE" COMO CAPÍTULO**
   - Palavras como "SUMÁRIO", "ÍNDICE", "TABLE OF CONTENTS" NUNCA são capítulos
   - Ignore completamente essas palavras/linhas

2. **EXTRAIA ABSOLUTAMENTE TODOS OS ITENS LISTADOS**
   - CADA LINHA do sumário é um capítulo (exceto SUMÁRIO/ÍNDICE)
   - Apresentação, Prefácio, Introdução
   - TODOS os nomes de juízes: Foster, J., Tatting, J., Keen, J., Handy, J., etc.
   - Pós-escrito, Conclusão, Epílogo, Apêndice
   - NÃO OMITA NENHUM ITEM - liste TODOS

3. **NÚMEROS DE PÁGINA**
   - Se o sumário tiver números, use-os
   - SE NÃO TIVER NÚMEROS: distribua as páginas proporcionalmente
   - Exemplo para livro de 53 páginas com 9 capítulos: 
     páginas aproximadas: 5, 10, 15, 20, 25, 30, 35, 40, 45

4. **PÁGINAS DEVEM SER CRESCENTES**
   - Cada capítulo começa DEPOIS do anterior

PARA "O Caso dos Exploradores de Cavernas" (se for este livro):
O sumário lista: Apresentação de Célio Egídio, Suprema corte de Newgarth ano 4300, Truepenny C. J., Foster J., Tatting J., Keen J., Handy J., Tatting J. (segunda vez), Pós-escrito
São 9 capítulos - TODOS devem ser incluídos!

{
  "capitulos": [
    {"titulo": "Apresentação de Célio Egídio", "paginaInicio": 5},
    {"titulo": "Suprema corte de Newgarth, ano 4300", "paginaInicio": 12},
    {"titulo": "Truepenny, C. J. — Presidente", "paginaInicio": 15},
    {"titulo": "Foster, J.", "paginaInicio": 20},
    {"titulo": "Tatting, J.", "paginaInicio": 26},
    {"titulo": "Keen, J.", "paginaInicio": 32},
    {"titulo": "Handy, J.", "paginaInicio": 38},
    {"titulo": "Tatting, J. (considerações finais)", "paginaInicio": 44},
    {"titulo": "Pós-escrito", "paginaInicio": 50}
  ],
  "paginasIgnorar": [1, 2, 3, 4],
  "primeiraPaginaConteudo": 5
}

CRÍTICO: 
- Conte TODOS os itens do sumário (exceto a palavra SUMÁRIO em si)
- Se há 9 nomes listados, retorne 9 capítulos
- NÃO pare no meio da lista!

Responda APENAS em JSON válido (sem markdown):`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8000 }
        })
      }
    );

    if (!response.ok) {
      console.error("Erro API Gemini (sumário):", response.status);
      return null;
    }

    const data = await response.json();
    let resultado = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Limpar markdown se presente
    resultado = resultado.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    
    try {
      const parsed = JSON.parse(resultado);
      if (parsed.capitulos && parsed.capitulos.length > 0) {
        // FILTRAR: Remover SUMÁRIO/ÍNDICE da lista de capítulos
        const capitulosFiltrados = parsed.capitulos.filter((cap: any) => {
          const tituloUpper = (cap.titulo || "").toUpperCase().trim();
          const titulosIgnorar = ["SUMÁRIO", "SUMARIO", "ÍNDICE", "INDICE", "TABLE OF CONTENTS", "CONTENTS"];
          return !titulosIgnorar.includes(tituloUpper);
        });
        
        // VALIDAR: Páginas devem ser crescentes
        let ultimaPagina = 0;
        const capitulosValidados = capitulosFiltrados.map((cap: any, idx: number) => {
          let pagina = cap.paginaInicio || 1;
          // Se a página não é crescente, estimar
          if (pagina <= ultimaPagina) {
            pagina = ultimaPagina + 5; // Estimar 5 páginas por capítulo
          }
          ultimaPagina = pagina;
          return { titulo: cap.titulo, paginaInicio: pagina };
        });
        
        console.log(`[ANÁLISE] ${capitulosValidados.length} capítulos extraídos do sumário (após filtrar SUMÁRIO/ÍNDICE)`);
        return {
          capitulos: capitulosValidados,
          paginasIgnorar: parsed.paginasIgnorar || [],
          primeiraPaginaConteudo: parsed.primeiraPaginaConteudo || 1,
          fonteAnalise: 'sumario'
        };
      }
    } catch (e) {
      console.error("Erro ao parsear JSON do sumário:", e);
    }
  } catch (e) {
    console.error("Erro na análise do sumário:", e);
  }
  
  return null;
}

// Analisar estrutura lendo o conteúdo (fallback)
async function analisarPeloConteudo(amostras: Array<{ pagina: number; conteudo: string }>, geminiKey: string): Promise<EstruturaLivro> {
  const prompt = `Você é um especialista em análise de estrutura de livros. Analise as amostras e identifique TODAS as divisões lógicas.

NOTA: Este livro NÃO possui sumário/índice identificável. Você deve detectar a estrutura pelo conteúdo.

AMOSTRAS DE PÁGINAS:
${amostras.map(a => `--- PÁGINA ${a.pagina} ---\n${a.conteudo.substring(0, 4000)}\n`).join('\n')}

INSTRUÇÕES:

1. DETECTE DIVISÕES POR:
   - Títulos em CAIXA ALTA ou negrito
   - Subtítulos que ocupam linha própria
   - "Capítulo X", "Parte X", "Seção X"
   - Votos de juízes: "Voto do Juiz X", "Foster, J.", etc.
   - Divisões temáticas: "Os fatos", "O julgamento", "Conclusão"
   - Mudanças claras de tema ou assunto

2. INCLUA SEMPRE:
   - Apresentação, Prefácio, Introdução
   - TODAS as divisões encontradas
   - Conclusão, Pós-escrito, Epílogo

3. PÁGINAS A IGNORAR:
   - Ficha catalográfica, ISBN, copyright
   - Páginas em branco

4. USE BOM SENSO:
   - Cada divisão lógica importante é um "capítulo"
   - Não agrupe seções diferentes
   - Mantenha a ordem original

Responda APENAS em JSON válido:
{
  "capitulos": [{"titulo": "...", "paginaInicio": N}, ...],
  "paginasIgnorar": [1, 2, ...],
  "primeiraPaginaConteudo": N
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 16000 }
        })
      }
    );

    if (!response.ok) {
      console.error("Erro API Gemini (conteúdo):", response.status);
      return { capitulos: [{ titulo: "Conteúdo", paginaInicio: 1 }], paginasIgnorar: [], primeiraPaginaConteudo: 1, fonteAnalise: 'conteudo' };
    }

    const data = await response.json();
    let resultado = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    resultado = resultado.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    
    try {
      const parsed = JSON.parse(resultado);
      console.log(`[ANÁLISE] ${parsed.capitulos?.length || 0} capítulos detectados pelo conteúdo`);
      return {
        capitulos: parsed.capitulos || [{ titulo: "Conteúdo", paginaInicio: 1 }],
        paginasIgnorar: parsed.paginasIgnorar || [],
        primeiraPaginaConteudo: parsed.primeiraPaginaConteudo || 1,
        fonteAnalise: 'conteudo'
      };
    } catch (e) {
      console.error("Erro ao parsear JSON:", e);
      return { capitulos: [{ titulo: "Conteúdo", paginaInicio: 1 }], paginasIgnorar: [], primeiraPaginaConteudo: 1, fonteAnalise: 'conteudo' };
    }
  } catch (e) {
    console.error("Erro na análise:", e);
    return { capitulos: [{ titulo: "Conteúdo", paginaInicio: 1 }], paginasIgnorar: [], primeiraPaginaConteudo: 1, fonteAnalise: 'conteudo' };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tituloLivro } = await req.json();
    
    if (!tituloLivro) {
      throw new Error("tituloLivro é obrigatório");
    }

    console.log(`[ANÁLISE ESTRUTURA] Iniciando para: "${tituloLivro}"`);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar páginas do livro
    const { data: paginasRaw, error: queryError } = await supabase
      .from("BIBLIOTECA-LEITURA-DINAMICA")
      .select("*")
      .ilike("Titulo da Obra", `%${tituloLivro}%`)
      .order("Pagina", { ascending: true });

    if (queryError || !paginasRaw || paginasRaw.length === 0) {
      throw new Error(`Nenhuma página encontrada para o livro: ${tituloLivro}`);
    }

    const paginas = paginasRaw as any[];
    console.log(`[ANÁLISE] ${paginas.length} páginas encontradas`);

    const geminiKey = GEMINI_KEYS[0] || '';
    let estrutura: EstruturaLivro;

    // ESTRATÉGIA 1: Buscar SUMÁRIO/ÍNDICE nas primeiras 15 páginas
    const primeiras15 = paginas.slice(0, 15);
    const paginaSumario = encontrarPaginasSumario(primeiras15);
    
    if (paginaSumario) {
      console.log(`[ANÁLISE] Usando sumário da página ${paginaSumario.paginaInicio}`);
      const estruturaSumario = await analisarPeloSumario(paginaSumario, paginas.length, geminiKey);
      
      if (estruturaSumario && estruturaSumario.capitulos.length >= 2) {
        estrutura = estruturaSumario;
      } else {
        console.log(`[ANÁLISE] Sumário incompleto, analisando conteúdo...`);
        // Fallback para análise de conteúdo
        const amostras = criarAmostras(paginas);
        estrutura = await analisarPeloConteudo(amostras, geminiKey);
      }
    } else {
      console.log(`[ANÁLISE] Sumário não encontrado, analisando conteúdo...`);
      // Sem sumário: analisar pelo conteúdo
      const amostras = criarAmostras(paginas);
      estrutura = await analisarPeloConteudo(amostras, geminiKey);
    }
    
    console.log(`[ANÁLISE] Estrutura detectada via ${estrutura.fonteAnalise}:`, {
      capitulos: estrutura.capitulos.length,
      paginasIgnorar: estrutura.paginasIgnorar.length,
      primeiraPaginaConteudo: estrutura.primeiraPaginaConteudo
    });

    // Salvar no banco de dados
    const indiceFormatado = estrutura.capitulos.map((cap, idx) => ({
      numero: idx + 1,
      titulo: cap.titulo,
      pagina_inicio: cap.paginaInicio
    }));

    const { error: upsertError } = await supabase
      .from("leitura_livros_indice")
      .upsert({
        livro_titulo: tituloLivro,
        indice_capitulos: indiceFormatado,
        paginas_ignoradas: estrutura.paginasIgnorar,
        primeira_pagina_conteudo: 1,
        total_paginas: paginas.length,
        total_capitulos: indiceFormatado.length,
        analise_concluida: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'livro_titulo' });
    
    console.log(`[ANÁLISE] Índice salvo com sucesso: ${indiceFormatado.length} capítulos (fonte: ${estrutura.fonteAnalise})`);

    if (upsertError) {
      console.error("[ANÁLISE] Erro ao salvar índice:", upsertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        estrutura,
        totalPaginas: paginas.length,
        fonteAnalise: estrutura.fonteAnalise
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[ANÁLISE] Erro geral:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Criar amostras estratégicas para análise por conteúdo
function criarAmostras(paginas: any[]): Array<{ pagina: number; conteudo: string }> {
  const amostras: Array<{ pagina: number; conteudo: string }> = [];
  
  // Primeiras 30 páginas
  for (let i = 0; i < Math.min(30, paginas.length); i++) {
    const pag = paginas[i];
    amostras.push({
      pagina: pag.Pagina || i + 1,
      conteudo: pag["Conteúdo"] || ""
    });
  }
  
  // Páginas distribuídas (30%, 50%, 70%, 90%)
  const pontos = [0.3, 0.5, 0.7, 0.9];
  for (const ponto of pontos) {
    const indice = Math.floor(paginas.length * ponto);
    if (indice >= 30 && paginas[indice]) {
      const pag = paginas[indice];
      amostras.push({
        pagina: pag.Pagina || indice + 1,
        conteudo: pag["Conteúdo"] || ""
      });
    }
  }
  
  // Últimas 5 páginas (para pegar Pós-escrito, Conclusão, etc)
  for (let i = Math.max(0, paginas.length - 5); i < paginas.length; i++) {
    const pag = paginas[i];
    if (!amostras.find(a => a.pagina === pag.Pagina)) {
      amostras.push({
        pagina: pag.Pagina || i + 1,
        conteudo: pag["Conteúdo"] || ""
      });
    }
  }

  return amostras;
}
