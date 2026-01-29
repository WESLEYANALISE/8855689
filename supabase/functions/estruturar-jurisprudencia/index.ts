import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chaves Gemini com fallback
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean);

interface EstruturaJurisprudencia {
  identificacao: {
    tribunal: string;
    classeProcessual: string;
    numero: string;
    relator: string;
    orgaoJulgador: string;
    dataJulgamento: string;
    // Campos específicos para Repercussão Geral
    tema?: string;
    situacao?: string;
    dataTransito?: string;
  };
  enunciado: string;
  ementa: string;
  teseJuridica: string;
  relatorio: string;
  voto: string;
  dispositivo: string;
  acordao: string;
  // Campos específicos para Repercussão Geral
  questaoConstitucional?: string;
  resultado?: string;
  observacao?: string;
}

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  const config = {
    temperature: 0.3,
    topP: 0.8,
    maxOutputTokens: 8192,
  };

  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: config,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
      
      console.log(`API Key ${i + 1} falhou, tentando próxima...`);
    } catch (error) {
      console.error(`Erro com API Key ${i + 1}:`, error);
    }
  }

  throw new Error('Todas as chaves API falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { titulo, tribunal, enunciado, tese, ementa, inteiroTeor, jurisprudenciaId } = await req.json();

    if (!titulo) {
      return new Response(
        JSON.stringify({ error: 'Título é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar cache primeiro
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cacheId = jurisprudenciaId || `${tribunal}_${titulo}`.toLowerCase().replace(/\s+/g, '_').substring(0, 100);

    const { data: cached } = await supabase
      .from('jurisprudencia_estruturada_cache')
      .select('estrutura')
      .eq('jurisprudencia_id', cacheId)
      .single();

    if (cached?.estrutura) {
      console.log('✅ Retornando do cache:', cacheId);
      return new Response(
        JSON.stringify({ estrutura: cached.estrutura, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Montar contexto completo
    const textoCompleto = [
      `TÍTULO: ${titulo}`,
      tribunal && `TRIBUNAL: ${tribunal}`,
      enunciado && `ENUNCIADO: ${enunciado}`,
      tese && `TESE: ${tese}`,
      ementa && `EMENTA: ${ementa}`,
      inteiroTeor && `INTEIRO TEOR:\n${inteiroTeor}`,
    ].filter(Boolean).join('\n\n');

    // Detectar se é Repercussão Geral
    const isRepercussaoGeral = titulo?.toLowerCase().includes('tema') || 
                                titulo?.toLowerCase().includes('repercussão') ||
                                textoCompleto.toLowerCase().includes('repercussão geral') ||
                                textoCompleto.toLowerCase().includes('tese fixada');

    const promptRepercussaoGeral = `Você é um especialista em jurisprudência brasileira. Analise o texto abaixo de um TEMA DE REPERCUSSÃO GERAL e extraia as informações estruturadas.

TEXTO DA JURISPRUDÊNCIA:
${textoCompleto}

REGRA ABSOLUTAMENTE OBRIGATÓRIA:
- USE APENAS o texto original fornecido acima
- NÃO INVENTE, NÃO CRIE, NÃO ADICIONE nenhuma informação que não esteja explicitamente no texto
- Se uma informação NÃO EXISTIR no texto, retorne string vazia ""
- COPIE E COLE trechos do texto original, não parafraseie nem resuma
- É PROIBIDO criar conteúdo fictício ou inferido

INSTRUÇÕES PARA REPERCUSSÃO GERAL:
1. Extraia o NÚMERO DO TEMA (ex: "114", "370") - APENAS se estiver no texto
2. Extraia a SITUAÇÃO (ex: "Trânsito em julgado") - APENAS se estiver no texto
3. Extraia a DATA DO TRÂNSITO - APENAS se estiver no texto
4. A QUESTÃO CONSTITUCIONAL - COPIE do texto original
5. A TESE JURÍDICA - COPIE exatamente como está no texto
6. Observações - APENAS se existirem no texto
7. O RESULTADO - APENAS se estiver explícito no texto

RETORNE EXATAMENTE neste formato JSON (sem markdown, sem \`\`\`):
{
  "identificacao": {
    "tribunal": "STF",
    "classeProcessual": "Repercussão Geral",
    "numero": "número do recurso se houver no texto, senão vazio",
    "relator": "nome do relator se houver no texto, senão vazio",
    "orgaoJulgador": "Plenário ou Turma se houver no texto, senão vazio",
    "dataJulgamento": "data se houver no texto, senão vazio",
    "tema": "número do tema se houver no texto, senão vazio",
    "situacao": "situação se houver no texto, senão vazio",
    "dataTransito": "data se houver no texto, senão vazio"
  },
  "questaoConstitucional": "copiar do texto original ou vazio",
  "enunciado": "copiar do texto original ou vazio",
  "ementa": "copiar do texto original ou vazio",
  "teseJuridica": "copiar exatamente do texto original ou vazio",
  "observacao": "copiar do texto original ou vazio",
  "resultado": "copiar do texto original ou vazio",
  "relatorio": "",
  "voto": "",
  "dispositivo": "",
  "acordao": ""
}`;

    const promptPadrao = `Você é um especialista em jurisprudência brasileira. Analise o texto abaixo e extraia/organize nas seções técnicas.

TEXTO DA JURISPRUDÊNCIA:
${textoCompleto}

REGRA ABSOLUTAMENTE OBRIGATÓRIA:
- USE APENAS o texto original fornecido acima
- NÃO INVENTE, NÃO CRIE, NÃO ADICIONE nenhuma informação que não esteja explicitamente no texto
- Se uma informação NÃO EXISTIR no texto, retorne string vazia ""
- COPIE E COLE trechos do texto original, não parafraseie nem resuma
- É PROIBIDO criar conteúdo fictício ou inferido

INSTRUÇÕES:
1. ENUNCIADO: COPIE exatamente o texto em CAIXA ALTA do início
2. EMENTA: COPIE exatamente os itens numerados do texto
3. Se alguma informação NÃO EXISTIR no texto, retorne string vazia ""
4. NÃO invente informações - use APENAS o que está no texto
5. TESE JURÍDICA: COPIE do texto se existir, senão deixe vazio

RETORNE EXATAMENTE neste formato JSON (sem markdown, sem \`\`\`):
{
  "identificacao": {
    "tribunal": "extrair do texto ou vazio",
    "classeProcessual": "extrair do texto ou vazio",
    "numero": "extrair do texto ou vazio",
    "relator": "extrair do texto ou vazio",
    "orgaoJulgador": "extrair do texto ou vazio",
    "dataJulgamento": "extrair do texto ou vazio"
  },
  "enunciado": "COPIAR texto em CAIXA ALTA do início ou vazio",
  "ementa": "COPIAR itens numerados do texto ou vazio",
  "teseJuridica": "COPIAR do texto se existir ou vazio",
  "relatorio": "COPIAR do texto se existir ou vazio",
  "voto": "COPIAR do texto se existir ou vazio",
  "dispositivo": "COPIAR do texto se existir ou vazio",
  "acordao": "COPIAR do texto se existir ou vazio"
}`;

    const prompt = isRepercussaoGeral ? promptRepercussaoGeral : promptPadrao;

    console.log('🔄 Estruturando jurisprudência com Gemini...');
    const resposta = await chamarGeminiComFallback(prompt);

    // Função para limpar caracteres problemáticos e markdown
    const limparTexto = (texto: string): string => {
      if (!texto) return '';
      return texto
        // Remover asteriscos de markdown
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        // Remover outros marcadores markdown
        .replace(/#{1,6}\s/g, '')
        .replace(/`/g, '')
        // Limpar pontos de interrogação duplicados ou mal formatados
        .replace(/\?{2,}/g, '?')
        .replace(/\?\s*\?/g, '?')
        // Limpar caracteres de controle
        .replace(/[\x00-\x1F\x7F]/g, ' ')
        // Normalizar espaços
        .replace(/\s+/g, ' ')
        .trim();
    };

    // Limpar e parsear JSON
    let estrutura: EstruturaJurisprudencia;
    try {
      // Remover possíveis marcadores de código
      const jsonLimpo = resposta
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      estrutura = JSON.parse(jsonLimpo);
      
      // Limpar os campos de texto
      if (estrutura.enunciado) estrutura.enunciado = limparTexto(estrutura.enunciado);
      if (estrutura.ementa) estrutura.ementa = limparTexto(estrutura.ementa);
      if (estrutura.teseJuridica) estrutura.teseJuridica = limparTexto(estrutura.teseJuridica);
      if (estrutura.relatorio) estrutura.relatorio = limparTexto(estrutura.relatorio);
      if (estrutura.voto) estrutura.voto = limparTexto(estrutura.voto);
      if (estrutura.dispositivo) estrutura.dispositivo = limparTexto(estrutura.dispositivo);
      if (estrutura.acordao) estrutura.acordao = limparTexto(estrutura.acordao);
      // Campos de Repercussão Geral
      if (estrutura.questaoConstitucional) estrutura.questaoConstitucional = limparTexto(estrutura.questaoConstitucional);
      if (estrutura.resultado) estrutura.resultado = limparTexto(estrutura.resultado);
      if (estrutura.observacao) estrutura.observacao = limparTexto(estrutura.observacao);
      
    } catch (parseError) {
      console.error('Erro ao parsear JSON:', parseError);
      console.log('Resposta recebida:', resposta);
      
      // Tentar criar estrutura básica com os dados disponíveis
      estrutura = {
        identificacao: {
          tribunal: tribunal || '',
          classeProcessual: '',
          numero: '',
          relator: '',
          orgaoJulgador: '',
          dataJulgamento: '',
        },
        enunciado: limparTexto(enunciado || titulo || ''),
        ementa: limparTexto(ementa || ''),
        teseJuridica: limparTexto(tese || ''),
        relatorio: '',
        voto: '',
        dispositivo: '',
        acordao: '',
      };
    }

    // Salvar no cache
    const { error: insertError } = await supabase
      .from('jurisprudencia_estruturada_cache')
      .insert({
        jurisprudencia_id: cacheId,
        titulo: titulo,
        tribunal: tribunal || estrutura.identificacao?.tribunal || '',
        estrutura: estrutura,
      });

    if (insertError) {
      console.error('Erro ao salvar cache:', insertError);
    } else {
      console.log('✅ Cache salvo:', cacheId);
    }

    return new Response(
      JSON.stringify({ estrutura, fromCache: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao estruturar jurisprudência';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
