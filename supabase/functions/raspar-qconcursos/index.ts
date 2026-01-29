import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuestaoRaspada {
  id_origem: string;
  disciplina: string;
  assunto: string | null;
  ano: number | null;
  banca: string | null;
  orgao: string | null;
  cargo: string | null;
  prova: string | null;
  enunciado: string;
  alternativa_a: string | null;
  alternativa_b: string | null;
  alternativa_c: string | null;
  alternativa_d: string | null;
  alternativa_e: string | null;
  resposta_correta: string | null;
  comentario: string | null;
  url_questao: string;
  fonte: string;
  nivel_dificuldade: string | null;
  tipo_questao: string | null;
}

// Mapeamento de cargos para job_ids do QConcursos
const CARGO_JOB_IDS: Record<string, number> = {
  "Delegado de Polícia": 169,
  "Procurador": 170,
  "Promotor de Justiça": 171,
  "Juiz de Direito": 172,
  "Defensor Público": 173,
  "Advogado": 174,
  "Analista Judiciário": 175,
  "Técnico Judiciário": 176,
  "Escrivão de Polícia": 177,
  "Agente de Polícia": 178,
};

// Mapeamento de disciplinas para discipline_ids
const DISCIPLINA_IDS: Record<string, number> = {
  "Direito Constitucional": 1,
  "Direito Administrativo": 2,
  "Direito Civil": 3,
  "Direito Penal": 4,
  "Direito Processual Civil": 5,
  "Direito Processual Penal": 6,
  "Direito do Trabalho": 7,
  "Direito Tributário": 8,
  "Direito Empresarial": 9,
  "Direito Eleitoral": 10,
  "Direito Previdenciário": 11,
  "Direito Ambiental": 12,
  "Direitos Humanos": 13,
  "Ética Profissional": 14,
};

function limparHtml(texto: string): string {
  return texto
    // Remove tags HTML
    .replace(/<[^>]+>/g, ' ')
    // Remove atributos data-*
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    // Remove entidades HTML
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    // Remove emojis de texto tipo :foguete:
    .replace(/:[a-z_]+:/gi, '')
    // Remove JSON-like content
    .replace(/\{[^}]*\}/g, '')
    // Remove múltiplos espaços
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairQuestaoIndividual(html: string, id: string): {
  enunciado: string;
  alternativas: string[];
  ano: number | null;
  banca: string | null;
  orgao: string | null;
  disciplina: string | null;
  tipo: string;
} | null {
  
  // Padrões para extrair o conteúdo real do enunciado
  // O QConcursos tem uma estrutura específica
  
  // Tentar extrair ano
  const anoMatch = html.match(/(\d{4})/);
  const ano = anoMatch ? parseInt(anoMatch[1]) : null;
  
  // Tentar extrair banca - geralmente aparece como texto ou link
  const bancaPatterns = [
    /CESPE|CEBRASPE|FCC|FGV|VUNESP|IBFC|AOCP|FUNDEP|IADES|CONSULPLAN|QUADRIX/i
  ];
  let banca: string | null = null;
  for (const pattern of bancaPatterns) {
    const match = html.match(pattern);
    if (match) {
      banca = match[0].toUpperCase();
      break;
    }
  }
  
  // Tentar extrair órgão
  const orgaoPatterns = [
    /Polícia Federal|Polícia Civil|TRF|TRT|TRE|STF|STJ|TCU|TCE|MPF|MPE|DPE|DPU|Receita Federal|INSS|IBAMA|ICMBio|FUNAI|ANVISA|ANAC|ANATEL|ANP|ANTAQ|ANTT|IBGE|Banco do Brasil|Caixa Econômica|Correios|Petrobras/i
  ];
  let orgao: string | null = null;
  for (const pattern of orgaoPatterns) {
    const match = html.match(pattern);
    if (match) {
      orgao = match[0];
      break;
    }
  }
  
  // Verificar se é questão Certo/Errado
  const isCertoErrado = /\bCerto\b|\bErrado\b/i.test(html);
  
  // Extrair alternativas
  const alternativas: string[] = [];
  
  if (isCertoErrado) {
    alternativas.push('Certo');
    alternativas.push('Errado');
  } else {
    // Tentar extrair alternativas A, B, C, D, E
    const altPatterns = [
      /\b([A-E])\s*[)\.\-:]\s*([^A-E\n]{10,}?)(?=\b[A-E]\s*[)\.\-:]|\s*$)/gi
    ];
    
    for (const pattern of altPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const letra = match[1].toUpperCase();
        const texto = limparHtml(match[2]);
        if (texto.length > 5) {
          alternativas.push(`${letra}) ${texto}`);
        }
      }
    }
  }
  
  // Extrair enunciado - remover tudo que não é o texto principal
  let enunciado = html;
  
  // Remover metadados e lixo
  enunciado = enunciado
    .replace(/question\s+q-question/gi, '')
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/:[a-z_]+:/gi, '')
    .replace(/\b(Certo|Errado)\b/gi, '')
    .replace(/\b[A-E]\s*[)\.\-:]/g, '')
    .replace(/Ver no QConcursos/gi, '')
    .replace(/Delegado de Polícia/gi, '')
    .replace(/sua \d+ª questão/gi, '')
    .replace(/Continue assim!/gi, '')
    .replace(/Parabéns/gi, '')
    .replace(/first_name/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Se enunciado ainda parece lixo, retornar null
  if (enunciado.length < 30 || enunciado.includes('data-question-id')) {
    return null;
  }
  
  return {
    enunciado,
    alternativas,
    ano,
    banca,
    orgao,
    disciplina: null,
    tipo: isCertoErrado ? 'certo_errado' : 'multipla_escolha'
  };
}

async function rasparQuestaoIndividual(id: string, firecrawlApiKey: string): Promise<QuestaoRaspada | null> {
  const url = `https://www.qconcursos.com/questoes-de-concursos/questoes/${id}`;
  
  console.log(`[raspar-individual] Raspando Q${id}...`);
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
        timeout: 30000
      })
    });
    
    if (!response.ok) {
      console.error(`[raspar-individual] Erro Q${id}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || '';
    
    if (markdown.length < 50) {
      console.log(`[raspar-individual] Q${id} sem conteúdo`);
      return null;
    }
    
    // Parsear o markdown da página individual
    // Formato esperado:
    // # Q1234567
    // [Disciplina] | Ano | Banca | Órgão
    // 
    // Enunciado da questão...
    //
    // Certo/Errado ou A) B) C) D) E)
    
    const lines = markdown.split('\n').filter((l: string) => l.trim());
    
    // Extrair disciplina da primeira linha após o ID
    let disciplina = '';
    let ano: number | null = null;
    let banca = '';
    let orgao = '';
    let enunciado = '';
    let tipo = 'multipla_escolha';
    const alternativas: string[] = [];
    
    let inEnunciado = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Pular linha do ID
      if (line.includes(`Q${id}`) || line.match(/^#\s*Q\d+/)) {
        inEnunciado = true;
        continue;
      }
      
      // Linha de metadados (disciplina | ano | banca | órgão)
      if (line.includes('|') && !inEnunciado) {
        const partes = line.split('|').map((p: string) => p.trim());
        for (const parte of partes) {
          if (/^\d{4}$/.test(parte)) {
            ano = parseInt(parte);
          } else if (/CESPE|CEBRASPE|FCC|FGV|VUNESP|IBFC/i.test(parte)) {
            banca = parte;
          } else if (/Direito|Constitucional|Penal|Civil|Administrativo|Tributário/i.test(parte)) {
            disciplina = parte;
          } else if (/Polícia|TRF|TRT|TRE|MPF/i.test(parte)) {
            orgao = parte;
          }
        }
        continue;
      }
      
      // Alternativas Certo/Errado
      if (/^\s*(○|●|◯)?\s*(Certo|Errado)\s*$/i.test(line)) {
        tipo = 'certo_errado';
        if (!alternativas.includes('Certo')) alternativas.push('Certo');
        if (!alternativas.includes('Errado')) alternativas.push('Errado');
        continue;
      }
      
      // Alternativas A-E
      const altMatch = line.match(/^\s*(○|●|◯)?\s*([A-E])[)\.\s]+(.+)/i);
      if (altMatch) {
        alternativas.push(`${altMatch[2].toUpperCase()}) ${altMatch[3].trim()}`);
        continue;
      }
      
      // Texto do enunciado
      if (inEnunciado && line.length > 10 && !line.startsWith('[') && !line.startsWith('!')) {
        enunciado += line + ' ';
      }
    }
    
    enunciado = enunciado.trim();
    
    if (enunciado.length < 30) {
      console.log(`[raspar-individual] Q${id} enunciado muito curto`);
      return null;
    }
    
    return {
      id_origem: `Q${id}`,
      disciplina: disciplina || 'Não informada',
      assunto: null,
      ano,
      banca: banca || null,
      orgao: orgao || null,
      cargo: null,
      prova: null,
      enunciado,
      alternativa_a: alternativas[0] || (tipo === 'certo_errado' ? 'Certo' : null),
      alternativa_b: alternativas[1] || (tipo === 'certo_errado' ? 'Errado' : null),
      alternativa_c: alternativas[2] || null,
      alternativa_d: alternativas[3] || null,
      alternativa_e: alternativas[4] || null,
      resposta_correta: null,
      comentario: null,
      url_questao: url,
      fonte: 'QConcursos',
      nivel_dificuldade: null,
      tipo_questao: tipo
    };
    
  } catch (e) {
    console.error(`[raspar-individual] Erro Q${id}:`, e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { disciplina, assunto, banca, ano, cargo, maxQuestoes = 20 } = await req.json();

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY não configurada');
    }

    // Construir URL com filtros
    const cargoSelecionado = cargo || "Delegado de Polícia";
    const jobId = CARGO_JOB_IDS[cargoSelecionado] || 169;
    const disciplinaId = disciplina ? DISCIPLINA_IDS[disciplina] : undefined;

    let targetUrl = `https://www.qconcursos.com/questoes-de-concursos/questoes?job_ids%5B%5D=${jobId}`;
    
    if (disciplinaId) {
      targetUrl += `&discipline_ids%5B%5D=${disciplinaId}`;
    }
    if (ano) {
      targetUrl += `&year_ids%5B%5D=${ano}`;
    }

    console.log(`[raspar-qconcursos] Cargo: ${cargoSelecionado}, JobId: ${jobId}, Ano: ${ano}`);
    console.log(`[raspar-qconcursos] URL: ${targetUrl}`);

    // Primeiro, raspar a página de listagem para pegar os IDs
    const listResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['html'],
        waitFor: 5000,
        timeout: 60000
      })
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('[raspar-qconcursos] Erro Firecrawl:', listResponse.status, errorText);
      throw new Error(`Firecrawl falhou: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    const htmlContent = listData.data?.html || '';
    
    console.log(`[raspar-qconcursos] HTML da listagem: ${htmlContent.length} chars`);

    // Extrair IDs das questões do HTML
    const idPattern = /data-question-id="(\d+)"/g;
    const ids = new Set<string>();
    let match;
    while ((match = idPattern.exec(htmlContent)) !== null) {
      ids.add(match[1]);
    }
    
    // Também tentar padrão de URL
    const urlPattern = /\/questoes\/(\d{5,10})/g;
    while ((match = urlPattern.exec(htmlContent)) !== null) {
      ids.add(match[1]);
    }
    
    console.log(`[raspar-qconcursos] IDs encontrados: ${ids.size}`);
    
    if (ids.size === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum ID de questão encontrado. O site pode requerer login.',
          total: 0,
          inseridas: 0,
          duplicadas: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Raspar cada questão individualmente (limitado)
    const idsArray = Array.from(ids).slice(0, Math.min(maxQuestoes, 10)); // Limitar a 10 por vez para não sobrecarregar
    const questoes: QuestaoRaspada[] = [];
    
    for (const id of idsArray) {
      const questao = await rasparQuestaoIndividual(id, firecrawlApiKey);
      if (questao) {
        questao.cargo = cargoSelecionado;
        if (disciplina) questao.disciplina = disciplina;
        questoes.push(questao);
      }
      // Pequeno delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`[raspar-qconcursos] Questões parseadas: ${questoes.length}`);
    
    if (questoes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Questões encontradas mas não foi possível extrair o conteúdo.',
          total: ids.size,
          inseridas: 0,
          duplicadas: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Salvar no Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verificar duplicatas
    const idsOrigem = questoes.map(q => q.id_origem);
    const { data: existentes } = await supabase
      .from('QUESTOES_RASPADAS')
      .select('id_origem')
      .in('id_origem', idsOrigem);
    
    const idsExistentes = new Set((existentes || []).map(e => e.id_origem));
    const questoesNovas = questoes.filter(q => !idsExistentes.has(q.id_origem));
    
    console.log(`[raspar-qconcursos] ${questoesNovas.length} novas de ${questoes.length}`);
    
    let inseridas = 0;
    const erros: string[] = [];
    
    if (questoesNovas.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('QUESTOES_RASPADAS')
        .insert(questoesNovas)
        .select('id');
      
      if (insertError) {
        console.error('[raspar-qconcursos] Erro insert:', insertError);
        erros.push(insertError.message);
      } else {
        inseridas = inserted?.length || 0;
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        total: questoes.length,
        inseridas,
        duplicadas: questoes.length - questoesNovas.length,
        erros: erros.length > 0 ? erros : undefined,
        filtros: { cargo: cargoSelecionado, disciplina, ano }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[raspar-qconcursos] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
