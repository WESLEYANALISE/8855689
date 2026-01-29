import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// ============================================================
// PROMPT PARA REVISÃO LINHA A LINHA
// ============================================================
const PROMPT_REVISAO = (textoBruto: string, textoFormatado: string) => `Você é um revisor especializado em textos legais brasileiros.

TAREFA: Compare o TEXTO ORIGINAL (fonte) com o TEXTO FORMATADO linha a linha e identifique TODOS os problemas.

## O QUE VERIFICAR LINHA A LINHA:

### 1. ARTIGOS FALTANTES
- Verifique se TODOS os artigos do original estão no formatado
- Art. 1º, Art. 1º-A, Art. 2º, etc.
- Artigos VETADOS devem aparecer como "Art. X. (VETADO)"
- IMPORTANTE: Art. 34-A citado ENTRE ASPAS dentro do Art. 24-A NÃO é um artigo separado!

### 2. ARTIGOS/PARÁGRAFOS DUPLICADOS
- Quando há dois elementos com mesma numeração, APENAS O ÚLTIMO deve estar presente
- O primeiro é versão antiga/revogada e deve ser removido
- Exemplo: Se há dois "§ 4º", apenas o segundo (mais recente) deve constar

### 3. ARTIGOS CITADOS ENTRE ASPAS
- Quando um artigo introduz outro entre aspas (ex: Art. 24 que diz "passa a vigorar acrescida do seguinte art. 34-A:")
- O artigo citado entre aspas NÃO deve aparecer como artigo independente
- Deve estar JUNTO do artigo que o introduz

### 4. LACUNAS NA SEQUÊNCIA
- Verifique se há lacunas na numeração (pulou de 24 para 34)
- Identifique se são artigos faltantes ou se é esperado (revogados)

### 5. EMENTA E ESTRUTURA
- Ementa (Dispõe sobre..., Institui..., Altera...)
- Capítulos, Títulos, Seções
- Data e assinaturas

## TEXTO ORIGINAL (FONTE - primeiros 30k chars):
${textoBruto.substring(0, 30000)}

## TEXTO FORMATADO (A SER REVISADO - primeiros 30k chars):
${textoFormatado.substring(0, 30000)}

## RESPONDA EM JSON:
{
  "elementosFaltantes": [
    {
      "tipo": "ementa|capitulo|titulo|secao|artigo|paragrafo|inciso|alinea|assinatura|duplicado|lacuna|citado",
      "identificador": "texto identificador (ex: 'CAPÍTULO I', 'Art. 1º', '§ 1º')",
      "textoOriginal": "texto como aparece no original (primeiros 200 chars)",
      "posicaoAproximada": "depois de qual elemento deveria aparecer ou estar"
    }
  ],
  "problemasDetectados": [
    {
      "tipo": "duplicado|lacuna|citado_separado|faltante",
      "descricao": "descrição do problema",
      "localizacao": "onde está o problema",
      "sugestao": "como corrigir"
    }
  ],
  "resumo": {
    "ementaPresente": true/false,
    "capitulosEncontrados": número,
    "artigosEncontrados": número,
    "duplicatasDetectadas": número,
    "lacunasDetectadas": número,
    "elementosFaltantes": número,
    "percentualCompletude": número (0-100),
    "observacoes": "observações gerais sobre a qualidade da formatação"
  }
}

IMPORTANTE: 
- Retorne APENAS o JSON, sem explicações
- Foque nos elementos ESTRUTURAIS que estão faltando ou com problemas
- Identifique ESPECIALMENTE: duplicatas, lacunas, e artigos citados que foram separados`;

// ============================================================
// CHAMAR GEMINI
// ============================================================
async function chamarGemini(prompt: string): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    throw new Error('Nenhuma chave Gemini configurada');
  }

  for (const apiKey of GEMINI_KEYS) {
    try {
      console.log('[REVISAO] Chamando Gemini para revisão...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 16384,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (result) {
          console.log('[REVISAO] ✅ Resposta recebida da Gemini');
          return result.trim();
        }
      } else {
        const errorText = await response.text();
        console.error('[REVISAO] Erro Gemini:', response.status, errorText.substring(0, 200));
      }
    } catch (error: any) {
      console.error('[REVISAO] Erro:', error.message);
    }
  }

  throw new Error('Todas as chaves Gemini falharam');
}

// ============================================================
// EXTRAIR ESTRUTURA DO TEXTO BRUTO
// ============================================================
function extrairEstruturaTextoBruto(texto: string): {
  ementa: string | null;
  capitulos: string[];
  artigos: string[];
  artigoVetado1: boolean;
  artigosCitados: string[];
} {
  const estrutura = {
    ementa: null as string | null,
    capitulos: [] as string[],
    artigos: [] as string[],
    artigoVetado1: false,
    artigosCitados: [] as string[],
  };

  // Procurar ementa (Dispõe sobre, Institui, etc.)
  const matchEmenta = texto.match(/(Dispõe\s+sobre[^.]+\.|Institui[^.]+\.|Altera[^.]+\.|Regulamenta[^.]+\.)/i);
  if (matchEmenta) {
    estrutura.ementa = matchEmenta[1].trim();
  }

  // Procurar capítulos
  const regexCapitulo = /CAPÍTULO\s+[IVXLCDM]+(?:\s*[-–]\s*[^\n]+)?/gi;
  let matchCap;
  while ((matchCap = regexCapitulo.exec(texto)) !== null) {
    estrutura.capitulos.push(matchCap[0].trim());
  }

  // Procurar artigos - distinguir entre artigos reais e citados entre aspas
  const regexArtigoReal = /(?<![""])\bArt\.?\s*(\d+[ºª°]?(?:-[A-Z])?)/gi;
  const regexArtigoCitado = /[""]Art\.?\s*(\d+[ºª°]?(?:-[A-Z])?)/gi;
  
  let matchArt;
  while ((matchArt = regexArtigoReal.exec(texto)) !== null) {
    const artigo = `Art. ${matchArt[1].replace(/[ºª°]/g, 'º')}`;
    if (!estrutura.artigos.includes(artigo)) {
      estrutura.artigos.push(artigo);
    }
  }
  
  // Artigos citados entre aspas (não devem aparecer como artigos separados)
  let matchCitado;
  while ((matchCitado = regexArtigoCitado.exec(texto)) !== null) {
    const artigo = `Art. ${matchCitado[1].replace(/[ºª°]/g, 'º')}`;
    if (!estrutura.artigosCitados.includes(artigo)) {
      estrutura.artigosCitados.push(artigo);
    }
  }

  // Verificar Art. 1º (VETADO)
  if (/Art\.?\s*1[ºª°]?\s*\(?VETADO\)?/i.test(texto)) {
    estrutura.artigoVetado1 = true;
  }

  return estrutura;
}

// ============================================================
// VERIFICAR DUPLICATAS NO TEXTO FORMATADO
// ============================================================
function verificarDuplicatas(textoFormatado: string): Array<{
  tipo: string;
  identificador: string;
  ocorrencias: number;
}> {
  const duplicatas: Array<{ tipo: string; identificador: string; ocorrencias: number }> = [];
  
  // Contar artigos
  const artigosContagem: Map<string, number> = new Map();
  const regexArtigo = /^Art\.?\s*(\d+[ºª°]?(?:-[A-Z])?)/gim;
  let matchArt;
  while ((matchArt = regexArtigo.exec(textoFormatado)) !== null) {
    const id = `Art. ${matchArt[1].replace(/[ºª°]/g, 'º')}`;
    artigosContagem.set(id, (artigosContagem.get(id) || 0) + 1);
  }
  
  for (const [id, count] of artigosContagem) {
    if (count > 1) {
      duplicatas.push({ tipo: 'artigo', identificador: id, ocorrencias: count });
    }
  }
  
  // Contar parágrafos por artigo
  const linhas = textoFormatado.split('\n');
  let artigoAtual = '';
  const paragrafosContagem: Map<string, number> = new Map();
  
  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    
    // Atualizar artigo atual
    const matchArtLinha = linhaLimpa.match(/^Art\.?\s*(\d+[ºª°]?(?:-[A-Z])?)/i);
    if (matchArtLinha) {
      artigoAtual = `Art. ${matchArtLinha[1].replace(/[ºª°]/g, 'º')}`;
    }
    
    // Verificar parágrafo
    const matchParagrafo = linhaLimpa.match(/^(§\s*\d+[ºª°]?|Parágrafo\s+único)/i);
    if (matchParagrafo && artigoAtual) {
      const id = `${artigoAtual}:${matchParagrafo[1].replace(/\s+/g, ' ').trim()}`;
      paragrafosContagem.set(id, (paragrafosContagem.get(id) || 0) + 1);
    }
  }
  
  for (const [id, count] of paragrafosContagem) {
    if (count > 1) {
      const [artigo, paragrafo] = id.split(':');
      duplicatas.push({ tipo: 'parágrafo', identificador: `${paragrafo} do ${artigo}`, ocorrencias: count });
    }
  }
  
  return duplicatas;
}

// ============================================================
// VERIFICAR LACUNAS NA SEQUÊNCIA
// ============================================================
function verificarLacunas(textoFormatado: string): Array<{
  de: number;
  ate: number;
  quantidade: number;
}> {
  const lacunas: Array<{ de: number; ate: number; quantidade: number }> = [];
  
  const regexArtigo = /^Art\.?\s*(\d+)/gim;
  const numeros: number[] = [];
  
  let match;
  while ((match = regexArtigo.exec(textoFormatado)) !== null) {
    const num = parseInt(match[1]);
    if (!numeros.includes(num)) {
      numeros.push(num);
    }
  }
  
  numeros.sort((a, b) => a - b);
  
  for (let i = 1; i < numeros.length; i++) {
    const atual = numeros[i];
    const anterior = numeros[i - 1];
    
    if (atual - anterior > 1) {
      lacunas.push({
        de: anterior + 1,
        ate: atual - 1,
        quantidade: atual - anterior - 1
      });
    }
  }
  
  return lacunas;
}

// ============================================================
// VERIFICAR ELEMENTOS NO TEXTO FORMATADO
// ============================================================
function verificarElementosPresentes(
  textoFormatado: string, 
  estruturaBruto: ReturnType<typeof extrairEstruturaTextoBruto>
) {
  const faltantes: Array<{
    tipo: string;
    identificador: string;
    textoOriginal: string;
    posicaoAproximada: string;
  }> = [];

  // Verificar ementa
  if (estruturaBruto.ementa) {
    const ementaPresente = textoFormatado.toLowerCase().includes('dispõe sobre') || 
                           textoFormatado.toLowerCase().includes('institui') ||
                           textoFormatado.toLowerCase().includes('regulamenta');
    if (!ementaPresente) {
      faltantes.push({
        tipo: 'ementa',
        identificador: 'Ementa da Lei',
        textoOriginal: estruturaBruto.ementa.substring(0, 200),
        posicaoAproximada: 'Após o preâmbulo, antes do Art. 1º'
      });
    }
  }

  // Verificar capítulos
  for (const capitulo of estruturaBruto.capitulos) {
    const capituloId = capitulo.toUpperCase().split(/\s*[-–]\s*/)[0];
    if (!textoFormatado.toUpperCase().includes(capituloId)) {
      faltantes.push({
        tipo: 'capitulo',
        identificador: capitulo,
        textoOriginal: capitulo,
        posicaoAproximada: 'Verificar posição correta'
      });
    }
  }

  // Verificar Art. 1º (VETADO)
  if (estruturaBruto.artigoVetado1) {
    const art1Presente = /Art\.?\s*1[ºª°]?\s*[\.\(]/i.test(textoFormatado);
    if (!art1Presente) {
      faltantes.push({
        tipo: 'artigo',
        identificador: 'Art. 1º (VETADO)',
        textoOriginal: 'Art. 1º (VETADO)',
        posicaoAproximada: 'Antes do Art. 1º-A ou Art. 2º'
      });
    }
  }
  
  // Verificar se artigos citados entre aspas foram incorretamente separados
  for (const artigoCitado of estruturaBruto.artigosCitados) {
    // Verificar se aparece como artigo separado (início de linha, não entre aspas)
    const regexSeparado = new RegExp(`^${artigoCitado.replace(/[ºª°]/g, '[ºª°]?').replace(/\./g, '\\.?')}`, 'gim');
    const matches = textoFormatado.match(regexSeparado);
    
    if (matches && matches.length > 0) {
      // Verificar se deveria estar junto de outro artigo (citado entre aspas)
      faltantes.push({
        tipo: 'citado',
        identificador: artigoCitado,
        textoOriginal: `${artigoCitado} aparece entre aspas no original`,
        posicaoAproximada: 'Deveria estar junto do artigo que o introduz, não separado'
      });
    }
  }

  return faltantes;
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoBruto, textoFormatado, artigosExtraidos } = await req.json();

    if (!textoBruto || !textoFormatado) {
      return new Response(
        JSON.stringify({ error: 'textoBruto e textoFormatado são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[REVISAO] Iniciando revisão linha a linha...');
    console.log('[REVISAO] Texto bruto:', textoBruto.length, 'chars');
    console.log('[REVISAO] Texto formatado:', textoFormatado.length, 'chars');

    // 1. Análise local (rápida)
    const estruturaBruto = extrairEstruturaTextoBruto(textoBruto);
    console.log('[REVISAO] Estrutura bruto:', {
      ementa: estruturaBruto.ementa?.substring(0, 50),
      capitulos: estruturaBruto.capitulos.length,
      artigos: estruturaBruto.artigos.length,
      artigosCitados: estruturaBruto.artigosCitados.length,
      artigoVetado1: estruturaBruto.artigoVetado1,
    });

    const faltantesLocal = verificarElementosPresentes(textoFormatado, estruturaBruto);
    const duplicatasLocal = verificarDuplicatas(textoFormatado);
    const lacunasLocal = verificarLacunas(textoFormatado);
    
    console.log('[REVISAO] Análise local:', {
      faltantes: faltantesLocal.length,
      duplicatas: duplicatasLocal.length,
      lacunas: lacunasLocal.length,
    });

    // 2. Revisão com Gemini (mais profunda)
    let revisaoGemini: any = null;
    try {
      const prompt = PROMPT_REVISAO(textoBruto, textoFormatado);
      const respostaGemini = await chamarGemini(prompt);
      
      // Extrair JSON da resposta
      const jsonMatch = respostaGemini.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        revisaoGemini = JSON.parse(jsonMatch[0]);
        console.log('[REVISAO] Gemini encontrou:', {
          faltantes: revisaoGemini.elementosFaltantes?.length || 0,
          problemas: revisaoGemini.problemasDetectados?.length || 0,
        });
      }
    } catch (geminiError: any) {
      console.error('[REVISAO] Erro Gemini:', geminiError.message);
    }

    // 3. Combinar resultados
    const elementosFaltantes = [...faltantesLocal];
    const problemasDetectados: Array<{
      tipo: string;
      descricao: string;
      localizacao: string;
      sugestao: string;
    }> = [];
    
    // Adicionar duplicatas como problemas
    for (const dup of duplicatasLocal) {
      problemasDetectados.push({
        tipo: 'duplicado',
        descricao: `${dup.tipo} ${dup.identificador} aparece ${dup.ocorrencias}x`,
        localizacao: dup.identificador,
        sugestao: 'Manter apenas a última ocorrência (versão mais recente)'
      });
    }
    
    // Adicionar lacunas como problemas
    for (const lacuna of lacunasLocal) {
      const descLacuna = lacuna.de === lacuna.ate 
        ? `Art. ${lacuna.de}` 
        : `Arts. ${lacuna.de} a ${lacuna.ate}`;
      problemasDetectados.push({
        tipo: 'lacuna',
        descricao: `Possível lacuna: ${descLacuna} (${lacuna.quantidade} artigos)`,
        localizacao: `Entre Art. ${lacuna.de - 1} e Art. ${lacuna.ate + 1}`,
        sugestao: 'Verificar se há artigos faltando ou se foram revogados'
      });
    }
    
    // Adicionar resultados da Gemini
    if (revisaoGemini?.elementosFaltantes) {
      for (const elem of revisaoGemini.elementosFaltantes) {
        const jaExiste = elementosFaltantes.some(e => 
          e.identificador.toLowerCase() === elem.identificador?.toLowerCase()
        );
        if (!jaExiste && elem.identificador) {
          elementosFaltantes.push({
            tipo: elem.tipo || 'desconhecido',
            identificador: elem.identificador,
            textoOriginal: elem.textoOriginal || '',
            posicaoAproximada: elem.posicaoAproximada || ''
          });
        }
      }
    }
    
    if (revisaoGemini?.problemasDetectados) {
      for (const prob of revisaoGemini.problemasDetectados) {
        problemasDetectados.push({
          tipo: prob.tipo || 'outro',
          descricao: prob.descricao || '',
          localizacao: prob.localizacao || '',
          sugestao: prob.sugestao || ''
        });
      }
    }

    // 4. Gerar resumo
    const resumo = {
      ementaPresente: !faltantesLocal.some(f => f.tipo === 'ementa'),
      capitulosNoBruto: estruturaBruto.capitulos.length,
      artigosNoBruto: estruturaBruto.artigos.length,
      artigosCitadosNoBruto: estruturaBruto.artigosCitados.length,
      duplicatasDetectadas: duplicatasLocal.length,
      lacunasDetectadas: lacunasLocal.length,
      elementosFaltantes: elementosFaltantes.length,
      percentualCompletude: revisaoGemini?.resumo?.percentualCompletude || 
        Math.max(0, 100 - (elementosFaltantes.length * 5) - (duplicatasLocal.length * 3) - (lacunasLocal.length * 2)),
      observacoes: revisaoGemini?.resumo?.observacoes || 
        (elementosFaltantes.length === 0 && duplicatasLocal.length === 0 
          ? 'Texto bem formatado, nenhum problema detectado' 
          : `${elementosFaltantes.length} elemento(s) faltante(s), ${duplicatasLocal.length} duplicata(s), ${lacunasLocal.length} lacuna(s)`)
    };

    console.log('[REVISAO] ✅ Revisão concluída');
    console.log('[REVISAO] Resumo:', resumo);

    return new Response(
      JSON.stringify({
        success: true,
        elementosFaltantes,
        problemasDetectados,
        resumo,
        estruturaBruto: {
          ementa: estruturaBruto.ementa?.substring(0, 100),
          totalCapitulos: estruturaBruto.capitulos.length,
          totalArtigos: estruturaBruto.artigos.length,
          artigosCitados: estruturaBruto.artigosCitados,
          capitulos: estruturaBruto.capitulos.slice(0, 10),
        },
        duplicatas: duplicatasLocal,
        lacunas: lacunasLocal,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[REVISAO] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro na revisão' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
