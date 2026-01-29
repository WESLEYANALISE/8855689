import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function chamarGemini(prompt: string, chavesDisponiveis: string[]): Promise<string> {
  for (const chave of chavesDisponiveis) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chave}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Não foi possível gerar explicação.';
      }
    } catch (e) {
      console.error(`Erro com chave Gemini:`, e);
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, dados, contexto } = await req.json();

    const chavesGemini = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (chavesGemini.length === 0) {
      throw new Error('Nenhuma chave Gemini configurada');
    }

    let prompt = '';

    switch (tipo) {
      case 'kpi':
        prompt = `Você é um especialista em estatísticas judiciais brasileiras. Explique de forma clara e acessível para um estudante de direito ou cidadão comum o seguinte dado estatístico do Poder Judiciário:

**Dado:** ${dados.nome}
**Valor:** ${formatarNumero(dados.valor)}
${dados.comparativo ? `**Comparativo:** ${dados.comparativo}` : ''}
${contexto ? `**Contexto:** ${contexto}` : ''}

Sua explicação deve:
1. Explicar o que esse número significa na prática
2. Contextualizar com a realidade brasileira
3. Se relevante, mencionar tendências ou impactos
4. Usar linguagem simples, evitando jargões desnecessários
5. Ter no máximo 150 palavras

Responda em português brasileiro.`;
        break;

      case 'tribunal':
        prompt = `Você é um especialista em estrutura do Poder Judiciário brasileiro. Explique de forma clara e acessível:

**Tribunal:** ${dados.nome} (${dados.sigla})
**Total de Processos:** ${formatarNumero(dados.total)}
**Tipo:** ${dados.tipo}
${contexto ? `**Contexto adicional:** ${contexto}` : ''}

Sua explicação deve:
1. Qual é a competência/jurisdição deste tribunal
2. Que tipos de casos ele julga
3. Por que o volume de processos é significativo
4. Importância para o cidadão comum
5. Ter no máximo 150 palavras

Responda em português brasileiro.`;
        break;

      case 'assunto':
        prompt = `Você é um especialista em estatísticas judiciais brasileiras. Explique de forma acessível:

**Assunto Jurídico:** ${dados.nome}
**Quantidade de Processos:** ${formatarNumero(dados.quantidade)}
**Percentual do Total:** ${dados.percentual}%
${contexto ? `**Contexto:** ${contexto}` : ''}

Sua explicação deve:
1. O que esse assunto jurídico significa
2. Por que é tão frequente nos tribunais
3. Exemplos práticos do dia a dia relacionados
4. Impacto na vida das pessoas
5. Ter no máximo 150 palavras

Responda em português brasileiro.`;
        break;

      case 'classe':
        prompt = `Você é um especialista em processo judicial brasileiro. Explique de forma clara:

**Classe Processual:** ${dados.nome}
**Quantidade:** ${formatarNumero(dados.quantidade)}
${contexto ? `**Contexto:** ${contexto}` : ''}

Sua explicação deve:
1. O que é essa classe processual
2. Quando ela é utilizada
3. Por que existem tantos processos nessa classe
4. Diferença para outras classes similares
5. Ter no máximo 150 palavras

Responda em português brasileiro.`;
        break;

      case 'comparacao':
        prompt = `Você é um analista de dados judiciais. Compare os seguintes tribunais:

**Tribunal 1:** ${dados.tribunal1.nome} - ${formatarNumero(dados.tribunal1.total)} processos
**Tribunal 2:** ${dados.tribunal2.nome} - ${formatarNumero(dados.tribunal2.total)} processos
${contexto ? `**Contexto:** ${contexto}` : ''}

Sua análise deve:
1. Explicar as diferenças de volume
2. Contextualizar com a jurisdição de cada um
3. Fatores que influenciam essas diferenças
4. O que isso significa para quem busca justiça
5. Ter no máximo 200 palavras

Responda em português brasileiro.`;
        break;

      case 'tendencia':
        prompt = `Você é um analista de dados judiciais. Analise a seguinte tendência:

**Período:** ${dados.periodo}
**Tribunal:** ${dados.tribunal || 'Geral'}
**Dados:** Novos processos: ${formatarNumero(dados.novos)}, Baixados: ${formatarNumero(dados.baixados)}
${contexto ? `**Contexto:** ${contexto}` : ''}

Sua análise deve:
1. O que essa tendência indica
2. Causas prováveis
3. Impacto no acesso à justiça
4. Perspectivas futuras
5. Ter no máximo 150 palavras

Responda em português brasileiro.`;
        break;

      default:
        prompt = `Explique de forma clara e acessível para um estudante de direito ou cidadão comum a seguinte estatística judicial brasileira:

${JSON.stringify(dados, null, 2)}

Contexto: ${contexto || 'Estatísticas do Poder Judiciário brasileiro'}

Responda de forma objetiva em no máximo 150 palavras, em português brasileiro.`;
    }

    const explicacao = await chamarGemini(prompt, chavesGemini);

    return new Response(JSON.stringify({
      explicacao,
      tipo,
      geradoEm: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro ao gerar explicação:', error);
    return new Response(JSON.stringify({
      error: error?.message || 'Erro desconhecido',
      explicacao: 'Não foi possível gerar a explicação no momento. Tente novamente mais tarde.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatarNumero(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} milhões`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} mil`;
  }
  return num.toLocaleString('pt-BR');
}
