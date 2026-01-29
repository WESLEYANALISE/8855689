import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtigoAtual {
  numero: string;
  conteudo: string;
  temAudio: boolean;
  urlAudio?: string;
  ordem?: number;
}

interface ArtigoNovo {
  numero: string;
  conteudo: string;
  ordem?: number;
}

interface ArtigoAlterado {
  numero: string;
  conteudoAntigo: string;
  conteudoNovo: string;
  diferencas: string[];
  textoIdentico: boolean;
}

interface AudioAfetado {
  artigo: string;
  tipo: 'remover' | 'atualizar' | 'manter';
  urlAudio?: string;
  motivo: string;
}

interface MapeamentoAudio {
  numeroArtigo: string;
  acao: 'manter' | 'remover' | 'ignorar';
  urlAudio?: string;
  novaOrdem?: number;
}

// Normaliza texto para comparação precisa
function normalizarTexto(texto: string): string {
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .toLowerCase();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tableName, artigosAtuais, artigosNovos } = await req.json() as {
      tableName: string;
      artigosAtuais: ArtigoAtual[];
      artigosNovos: ArtigoNovo[];
    };

    console.log(`[COMPARAR-LEI] Comparando lei: ${tableName}`);
    console.log(`[COMPARAR-LEI] Artigos atuais: ${artigosAtuais.length}, Artigos novos: ${artigosNovos.length}`);

    // Criar maps para comparação rápida
    const mapAtuais = new Map(artigosAtuais.map(a => [a.numero, a]));
    const mapNovos = new Map(artigosNovos.map((a, i) => [a.numero, { ...a, ordem: a.ordem ?? i + 1 }]));

    // ===== IDENTIFICAR ARTIGOS NOVOS =====
    const artigosNovosResult: ArtigoNovo[] = [];
    for (const [numero, artigo] of mapNovos) {
      if (!mapAtuais.has(numero)) {
        artigosNovosResult.push(artigo);
      }
    }

    // ===== IDENTIFICAR ARTIGOS REMOVIDOS =====
    const artigosRemovidos: ArtigoNovo[] = [];
    for (const [numero, artigo] of mapAtuais) {
      if (!mapNovos.has(numero)) {
        artigosRemovidos.push({ numero, conteudo: artigo.conteudo });
      }
    }

    // ===== IDENTIFICAR ARTIGOS ALTERADOS (com check de texto idêntico) =====
    const artigosAlteradosTemp: Array<{ 
      numero: string; 
      antigo: string; 
      novo: string; 
      textoIdentico: boolean;
    }> = [];
    
    for (const [numero, artigoNovo] of mapNovos) {
      const artigoAtual = mapAtuais.get(numero);
      if (artigoAtual) {
        const conteudoAtualNorm = normalizarTexto(artigoAtual.conteudo);
        const conteudoNovoNorm = normalizarTexto(artigoNovo.conteudo);
        
        const textoIdentico = conteudoAtualNorm === conteudoNovoNorm;
        
        if (!textoIdentico) {
          artigosAlteradosTemp.push({
            numero,
            antigo: artigoAtual.conteudo,
            novo: artigoNovo.conteudo,
            textoIdentico: false
          });
        }
      }
    }

    // ===== MAPEAR ÁUDIOS =====
    const audiosAfetados: AudioAfetado[] = [];
    const mapeamentoAudios: MapeamentoAudio[] = [];

    // 1. Áudios de artigos REMOVIDOS - serão deletados
    for (const artigo of artigosRemovidos) {
      const artigoAtual = mapAtuais.get(artigo.numero);
      if (artigoAtual?.temAudio && artigoAtual.urlAudio) {
        audiosAfetados.push({
          artigo: artigo.numero,
          tipo: 'remover',
          urlAudio: artigoAtual.urlAudio,
          motivo: 'Artigo foi removido da lei'
        });
        mapeamentoAudios.push({
          numeroArtigo: artigo.numero,
          acao: 'remover',
          urlAudio: artigoAtual.urlAudio
        });
      }
    }

    // 2. Áudios de artigos ALTERADOS - serão deletados (precisam regravar)
    for (const artigo of artigosAlteradosTemp) {
      const artigoAtual = mapAtuais.get(artigo.numero);
      if (artigoAtual?.temAudio && artigoAtual.urlAudio) {
        audiosAfetados.push({
          artigo: artigo.numero,
          tipo: 'atualizar',
          urlAudio: artigoAtual.urlAudio,
          motivo: 'Texto foi alterado, áudio precisa ser regravado'
        });
        mapeamentoAudios.push({
          numeroArtigo: artigo.numero,
          acao: 'remover',
          urlAudio: artigoAtual.urlAudio,
          novaOrdem: mapNovos.get(artigo.numero)?.ordem
        });
      }
    }

    // 3. Áudios de artigos IGUAIS - serão mantidos
    let audiosAManter = 0;
    for (const [numero, artigoNovo] of mapNovos) {
      const artigoAtual = mapAtuais.get(numero);
      if (artigoAtual) {
        const conteudoAtualNorm = normalizarTexto(artigoAtual.conteudo);
        const conteudoNovoNorm = normalizarTexto(artigoNovo.conteudo);
        
        if (conteudoAtualNorm === conteudoNovoNorm && artigoAtual.temAudio && artigoAtual.urlAudio) {
          audiosAManter++;
          audiosAfetados.push({
            artigo: numero,
            tipo: 'manter',
            urlAudio: artigoAtual.urlAudio,
            motivo: 'Texto idêntico, áudio será preservado'
          });
          mapeamentoAudios.push({
            numeroArtigo: numero,
            acao: 'manter',
            urlAudio: artigoAtual.urlAudio,
            novaOrdem: artigoNovo.ordem
          });
        }
      }
    }

    // ===== ANÁLISE POR IA (opcional, para diferenças detalhadas) =====
    let artigosAlterados: ArtigoAlterado[] = [];
    let resumo = '';
    let analiseDetalhada = '';

    const geminiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY_2') || Deno.env.get('GEMINI_KEY_3');

    if (geminiKey && artigosAlteradosTemp.length > 0) {
      try {
        const artigosLimitados = artigosAlteradosTemp.slice(0, 15);
        
        const prompt = `Você é um especialista em legislação brasileira. Analise as diferenças entre versões de artigos.

CONTEXTO:
- Lei: ${tableName}
- Total de artigos atuais: ${artigosAtuais.length}
- Total de artigos novos: ${artigosNovos.length}
- Artigos novos: ${artigosNovosResult.length}
- Artigos removidos: ${artigosRemovidos.length}
- Artigos alterados: ${artigosAlteradosTemp.length}
- Áudios que serão mantidos: ${audiosAManter}
- Áudios que serão apagados: ${audiosAfetados.filter(a => a.tipo !== 'manter').length}

ARTIGOS ALTERADOS PARA ANALISAR:
${artigosLimitados.map(a => `
=== ${a.numero} ===
ANTES: ${a.antigo.substring(0, 400)}${a.antigo.length > 400 ? '...' : ''}
DEPOIS: ${a.novo.substring(0, 400)}${a.novo.length > 400 ? '...' : ''}
`).join('\n')}

TAREFA:
1. Para cada artigo alterado, identifique o TIPO de alteração
2. Dê um resumo GERAL das mudanças (foco no impacto jurídico)
3. Faça uma análise executiva para o administrador

Responda APENAS em JSON válido:
{
  "alteracoes": [
    {
      "numero": "Art. 1º",
      "diferencas": ["Alteração de redação no caput", "Nova expressão 'xyz' adicionada"],
      "impacto": "baixo|medio|alto"
    }
  ],
  "resumo": "Resumo geral das alterações (2-3 frases focando no impacto)",
  "analiseDetalhada": "Análise detalhada para o administrador sobre o que mudou e o que significa para os usuários que estudam essa lei"
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            resumo = parsed.resumo || '';
            analiseDetalhada = parsed.analiseDetalhada || '';
            
            const mapaIA = new Map(parsed.alteracoes?.map((a: any) => [a.numero, { diferencas: a.diferencas, impacto: a.impacto }]) || []);
            
            artigosAlterados = artigosAlteradosTemp.map(a => {
              const analiseIA = mapaIA.get(a.numero) as { diferencas: string[]; impacto: string } | undefined;
              return {
                numero: a.numero,
                conteudoAntigo: a.antigo,
                conteudoNovo: a.novo,
                diferencas: analiseIA?.diferencas || ['Alteração de texto identificada'],
                textoIdentico: false
              };
            });
          }
        }
      } catch (iaError) {
        console.error('[COMPARAR-LEI] Erro na análise por IA:', iaError);
      }
    }

    // Se não usou IA ou falhou, criar análise básica
    if (artigosAlterados.length === 0 && artigosAlteradosTemp.length > 0) {
      artigosAlterados = artigosAlteradosTemp.map(a => ({
        numero: a.numero,
        conteudoAntigo: a.antigo,
        conteudoNovo: a.novo,
        diferencas: ['Alteração de texto identificada'],
        textoIdentico: false
      }));
    }

    // Gerar resumo padrão se não houver
    if (!resumo) {
      const audiosRemover = audiosAfetados.filter(a => a.tipo === 'remover').length;
      const audiosAtualizar = audiosAfetados.filter(a => a.tipo === 'atualizar').length;
      
      resumo = `Foram identificadas ${artigosNovosResult.length} inclusões, ${artigosAlterados.length} alterações e ${artigosRemovidos.length} exclusões de artigos. `;
      resumo += `${audiosAManter} áudios serão preservados, ${audiosRemover + audiosAtualizar} serão removidos (${audiosAtualizar} precisam ser regravados).`;
    }

    // Estatísticas detalhadas
    const estatisticas = {
      artigosAtuais: artigosAtuais.length,
      artigosNovos: artigosNovos.length,
      inclusoes: artigosNovosResult.length,
      alteracoes: artigosAlterados.length,
      exclusoes: artigosRemovidos.length,
      audiosAtuais: artigosAtuais.filter(a => a.temAudio).length,
      audiosManter: audiosAManter,
      audiosRemover: audiosAfetados.filter(a => a.tipo === 'remover').length,
      audiosRegravar: audiosAfetados.filter(a => a.tipo === 'atualizar').length
    };

    const result = {
      artigosNovos: artigosNovosResult,
      artigosRemovidos,
      artigosAlterados,
      audiosAfetados,
      mapeamentoAudios,
      resumo,
      analiseDetalhada,
      estatisticas
    };

    console.log(`[COMPARAR-LEI] Resultado:`, estatisticas);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[COMPARAR-LEI] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
