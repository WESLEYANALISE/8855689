import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicoId, areaNome, temaNome } = await req.json();

    if (!topicoId) {
      throw new Error("topicoId é obrigatório");
    }

    console.log(`[OAB] Identificando subtemas para tópico ${topicoId} - Área: ${areaNome}, Tema: ${temaNome}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar páginas do tópico
    const { data: paginas, error: paginasError } = await supabase
      .from('oab_trilhas_topico_paginas')
      .select('pagina, conteudo')
      .eq('topico_id', topicoId)
      .order('pagina');

    if (paginasError || !paginas?.length) {
      throw new Error("Nenhum conteúdo encontrado para análise. Por favor, extraia o PDF primeiro.");
    }

    const totalPaginas = paginas.length;
    console.log(`📚 Analisando ${totalPaginas} páginas do tópico`);

    // Extrair títulos do índice (nível 1) de forma determinística para evitar “subtemas extras”
    const extrairTitulosIndiceNivel1 = (paginasIndice: Array<{ pagina: number; conteudo: string | null }>) => {
      const texto = paginasIndice
        .map(p => p.conteudo || '')
        .join('\n')
        .replace(/\r/g, '');

      // Padrão: "1. TITULO ........ 3" (captura apenas o título do item nível 1)
      const re = /(^|\n)\s*(\d{1,2})\s*\.\s*([^\n]+?)(?:\.{3,}|\s{2,}|\t)+\s*(\d{1,4})\s*(?=\n|$)/g;
      const seen = new Set<string>();
      const items: Array<{ ordem: number; titulo: string; pagina_indice?: number }> = [];

      let m: RegExpExecArray | null;
      while ((m = re.exec(texto)) !== null) {
        const ordem = Number(m[2]);
        const rawTitulo = (m[3] || '').trim();
        const paginaIndice = Number(m[4]);

        // Normalizações mínimas
        const titulo = rawTitulo
          .replace(/\s+/g, ' ')
          .replace(/\.{2,}$/g, '')
          .trim();

        // Evitar duplicados
        const key = `${ordem}::${titulo}`.toLowerCase();
        if (!titulo || seen.has(key)) continue;
        seen.add(key);

        items.push({ ordem, titulo, pagina_indice: Number.isFinite(paginaIndice) ? paginaIndice : undefined });
      }

      // Ordenar por ordem numérica
      items.sort((a, b) => a.ordem - b.ordem);

      // Limite defensivo
      // Limite defensivo aumentado para suportar índices maiores
      return items.slice(0, 30);
    };

    // Criar mapa de páginas para acesso rápido
    const paginasMap = new Map<number, string>();
    paginas.forEach(p => {
      if (p.conteudo) {
        paginasMap.set(p.pagina, p.conteudo);
      }
    });

    // Detectar páginas do índice
    const paginasIndice = paginas.filter(p => {
      const texto = (p.conteudo || '').toUpperCase();
      return texto.includes('ÍNDICE') || 
             texto.includes('SUMÁRIO') ||
             /\d+\.\s+[A-Z].*\.{3,}\s*\d+/.test(p.conteudo || '');
    });

    const titulosIndiceNivel1 = extrairTitulosIndiceNivel1(paginasIndice);
    if (titulosIndiceNivel1.length) {
      console.log(`📑 Índice detectado: ${titulosIndiceNivel1.length} itens nível 1`);
      titulosIndiceNivel1.forEach(i => console.log(`  - ${i.ordem}. ${i.titulo}${i.pagina_indice ? ` (índice pág ${i.pagina_indice})` : ''}`));
    } else {
      console.log("ℹ️ Nenhum item de índice (nível 1) detectado via regex; usando identificação sem guia do índice.");
    }

    // Limite dinâmico
    const limitePorPagina = totalPaginas > 100 ? 300 
                          : totalPaginas > 50 ? 500 
                          : totalPaginas > 30 ? 800 
                          : 2000;

    const conteudoAnalise = paginas
      .map(p => {
        const ehPaginaIndice = paginasIndice.some(pi => pi.pagina === p.pagina);
        const limite = ehPaginaIndice ? 8000 : limitePorPagina;
        return `--- PÁGINA ${p.pagina} ${ehPaginaIndice ? '(ÍNDICE)' : ''} ---\n${p.conteudo?.substring(0, limite) || ''}`;
      })
      .join('\n\n');

    const indiceObrigatorio = titulosIndiceNivel1.length
      ? `\n## 📑 ÍNDICE DETECTADO (ITENS NÍVEL 1 - OBRIGATÓRIOS)\n${titulosIndiceNivel1
          .map(i => `${i.ordem}. ${i.titulo}`)
          .join('\n')}\n`
      : '';

    const prompt = `Você é um especialista em análise de materiais de estudo para OAB.

CONTEXTO:
- Área: ${areaNome}
- Tema: ${temaNome}

${indiceObrigatorio}

CONTEÚDO (${paginas.length} páginas):
${conteudoAnalise}

## 🎯 SUA TAREFA: EXTRAIR OS SUBTEMAS (SEÇÕES) DESTE MATERIAL

Analise o material e extraia os SUBTEMAS principais que serão salvos como tópicos de estudo.
Cada subtema será um item de estudo separado na tabela RESUMO.

## FORMATO DE RESPOSTA:

{
  "subtemas": [
    {
      "ordem": 1,
      "titulo": "Nome do Subtema",
      "pagina_inicial": 1,
      "pagina_final": 5
    }
  ]
}

## REGRAS:

1. Se o ÍNDICE DETECTADO (itens nível 1) estiver presente acima, você DEVE retornar EXATAMENTE esses itens como subtemas (sem criar outros)
2. NUNCA inclua subtópicos/linhas secundárias do índice como subtema (somente os itens numerados nível 1: "1.", "2.", ...)
3. Caso não haja índice detectado, extraia entre 3 a 10 subtemas dependendo do tamanho do material
2. Cada subtema deve ser uma seção lógica do conteúdo
3. Use títulos claros e descritivos
4. Mantenha a ordem sequencial das páginas
5. O último subtema deve terminar na página ${totalPaginas}
6. Se o material for curto (< 10 páginas), pode ter menos subtemas
7. Não invente subtemas que não existem no índice

RESPONDA APENAS COM JSON válido, sem texto adicional:`;

    // Obter chaves Gemini
    const geminiKeys = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3')
    ].filter(Boolean) as string[];

    if (!geminiKeys.length) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    let geminiResponse: Response | null = null;
    let lastError = "";

    for (const geminiKey of geminiKeys) {
      console.log("Tentando chave Gemini...");

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096
              }
            })
          }
        );

        if (response.ok) {
          geminiResponse = response;
          console.log("✅ Gemini respondeu com sucesso");
          break;
        } else {
          lastError = await response.text();
          console.error(`Erro com chave (${response.status}):`, lastError.substring(0, 200));
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error("Erro de conexão:", lastError);
      }
    }

    if (!geminiResponse) {
      throw new Error(`Todas as chaves Gemini falharam: ${lastError.substring(0, 100)}`);
    }

    const geminiData = await geminiResponse.json();
    let textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpar JSON
    textResponse = textResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log("Resposta Gemini:", textResponse.substring(0, 500));

    let parsed: any;
    let subtemas: any[] = [];

    if (textResponse.startsWith('{')) {
      try {
        parsed = JSON.parse(textResponse);
        subtemas = parsed.subtemas || [];
      } catch (parseError) {
        console.error("Erro ao parsear JSON:", parseError);
      }
    }

    if (!subtemas.length) {
      const jsonMatch = textResponse.match(/\{[\s\S]*"subtemas"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          subtemas = parsed.subtemas || [];
          console.log("JSON extraído de texto misto");
        } catch (e) {
          console.error("Falha ao extrair JSON embutido");
        }
      }
    }

    // Fallback se não conseguiu extrair
    if (!subtemas.length) {
      console.log("⚠️ Gemini não retornou JSON válido. Criando estrutura básica.");
      const subtemasEstimados = Math.min(5, Math.max(2, Math.ceil(totalPaginas / 5)));
      const paginasPorSubtema = Math.ceil(totalPaginas / subtemasEstimados);
      
      for (let i = 0; i < subtemasEstimados; i++) {
        subtemas.push({
          ordem: i + 1,
          titulo: `Seção ${i + 1}`,
          pagina_inicial: i * paginasPorSubtema + 1,
          pagina_final: Math.min((i + 1) * paginasPorSubtema, totalPaginas)
        });
      }
    }

    // Validar e normalizar subtemas
    let subtemasValidados = subtemas.map((s: any, idx: number) => ({
      ordem: idx + 1,
      titulo: (s.titulo || '').toString().trim(),
      pagina_inicial: Math.max(1, Number(s.pagina_inicial || 1)),
      pagina_final: Math.min(totalPaginas, Number(s.pagina_final || totalPaginas))
    }));

    // Se temos itens nível 1 do índice, forçar correspondência e remover “extras”
    if (titulosIndiceNivel1.length) {
      const norm = (t: string) =>
        t
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      const indiceNorm = titulosIndiceNivel1.map(i => ({ ...i, n: norm(i.titulo) }));

      // Mapear por “match aproximado” (contains) e cair para ordem do índice
      const escolhidos: Array<{ ordem: number; titulo: string; pagina_inicial: number; pagina_final: number }> = [];
      for (const item of indiceNorm) {
        const match = subtemasValidados.find(s => {
          const ns = norm(s.titulo);
          return ns === item.n || ns.includes(item.n) || item.n.includes(ns);
        });

        escolhidos.push({
          ordem: item.ordem,
          titulo: match?.titulo || item.titulo,
          pagina_inicial: match?.pagina_inicial || 1,
          pagina_final: match?.pagina_final || totalPaginas,
        });
      }

      // Ajustar páginas para ficarem contínuas e sem sobreposição
      escolhidos.sort((a, b) => a.ordem - b.ordem);
      for (let i = 0; i < escolhidos.length; i++) {
        const atual = escolhidos[i];
        const prox = escolhidos[i + 1];
        const start = Math.max(1, atual.pagina_inicial);
        const end = prox ? Math.max(start, Math.min(totalPaginas, (prox.pagina_inicial || start) - 1)) : totalPaginas;
        atual.pagina_inicial = start;
        atual.pagina_final = end;
      }

      // Reindexar ordem sequencial (1..N) para a UI, mantendo títulos do índice
      subtemasValidados = escolhidos.map((s, idx) => ({
        ordem: idx + 1,
        titulo: s.titulo,
        pagina_inicial: s.pagina_inicial,
        pagina_final: s.pagina_final,
      }));
    }

    console.log(`✅ ${subtemasValidados.length} subtemas identificados`);

    // =========================================
    // NOVA LÓGICA: Salvar conteúdo na tabela conteudo_oab_revisao
    // =========================================
    console.log("📝 Salvando conteúdo extraído por subtema na tabela conteudo_oab_revisao...");

    // Deletar registros antigos para este tema
    await supabase
      .from('conteudo_oab_revisao')
      .delete()
      .eq('tema', temaNome);

    // Inserir conteúdo de cada subtema
    for (const subtema of subtemasValidados) {
      let conteudoDoSubtema = '';
      
      for (let pag = subtema.pagina_inicial; pag <= subtema.pagina_final; pag++) {
        const conteudoPagina = paginasMap.get(pag);
        if (conteudoPagina) {
          conteudoDoSubtema += `\n\n--- PÁGINA ${pag} ---\n\n${conteudoPagina}`;
        }
      }
      
      conteudoDoSubtema = conteudoDoSubtema.trim();
      
      if (conteudoDoSubtema.length > 0) {
        const { error: upsertError } = await supabase
          .from('conteudo_oab_revisao')
          .upsert({
            tema: temaNome,
            subtema: subtema.titulo,
            pagina_inicial: subtema.pagina_inicial,
            pagina_final: subtema.pagina_final,
            conteudo_original: conteudoDoSubtema,
            area: areaNome,
            topico_id: topicoId
          }, { onConflict: 'tema,subtema' });

        if (upsertError) {
          console.error(`Erro ao salvar subtema "${subtema.titulo}":`, upsertError);
        } else {
          console.log(`  ✓ Subtema "${subtema.titulo}": ${conteudoDoSubtema.length} chars (págs ${subtema.pagina_inicial}-${subtema.pagina_final})`);
        }
      } else {
        console.warn(`  ⚠️ Subtema "${subtema.titulo}" sem conteúdo!`);
      }
    }

    console.log("✅ Conteúdo salvo na tabela conteudo_oab_revisao");

    // Log dos subtemas identificados
    subtemasValidados.forEach((s: any) => {
      console.log(`  ${s.ordem}. ${s.titulo} (págs ${s.pagina_inicial}-${s.pagina_final})`);
    });

    // Atualizar tópico com subtemas identificados
    await supabase
      .from('oab_trilhas_topicos')
      .update({ 
        status: 'aguardando_confirmacao',
        subtemas_identificados: subtemasValidados
      })
      .eq('id', topicoId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        subtemas: subtemasValidados,
        message: `${subtemasValidados.length} subtemas identificados e conteúdo salvo`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erro na identificação:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
