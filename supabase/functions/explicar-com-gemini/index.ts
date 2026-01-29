import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 3 chaves API
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function chamarGeminiComFallback(prompt: string, config: any): Promise<string> {
  let lastError = '';
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`Tentando chave ${i + 1}/${API_KEYS.length}`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: config
          })
        }
      );

      if (response.ok) {
        console.log(`Chave ${i + 1} funcionou!`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
      
      const errorText = await response.text();
      lastError = errorText;
      console.log(`Chave ${i + 1} falhou: ${response.status}`);
      
      if (response.status === 429 || response.status === 403 || errorText.includes('quota') || errorText.includes('rate')) {
        continue;
      }
      continue;
    } catch (err) {
      console.error(`Erro com chave ${i + 1}:`, err);
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }
  
  throw new Error(`Todas as chaves falharam. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contexto, dados, linguagemMode = 'descomplicado' } = await req.json();
    
    console.log('Gerando explicação com Gemini:', { contexto, dados });

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    // Criar prompt especializado baseado no contexto
    let systemPrompt = '';
    let userPrompt = '';

    // Ajustar prompts baseado no modo de linguagem
    if (linguagemMode === 'simplificado' || contexto === 'alteracao_legislativa') {
      // Contexto de alteração legislativa - sempre usa linguagem simples
      if (contexto === 'alteracao_legislativa') {
        const dadosParsed = typeof dados === 'string' ? JSON.parse(dados) : dados;
        
        systemPrompt = `Você é um professor de Direito que explica alterações legislativas de forma clara e didática.
        
Regras:
- Explique O QUE mudou e POR QUE foi importante essa mudança
- Se tiver texto anterior e atual, compare-os e destaque as diferenças
- Mencione a lei que fez a alteração e o ano
- Use linguagem simples, evite juridiquês excessivo
- Seja objetivo e direto, máximo 300 palavras
- Formate usando markdown: use **negrito** para termos importantes`;
        
        const textoAnterior = dadosParsed.texto_anterior || 'Não disponível';
        const textoAtual = dadosParsed.texto_atual || 'Não disponível';
        const tipoAlteracao = dadosParsed.tipo || 'Alteração';
        const artigo = dadosParsed.artigo || '';
        const elemento = dadosParsed.elemento || '';
        const leiAlteradora = dadosParsed.lei_alteradora || 'Lei alteradora não especificada';
        const ano = dadosParsed.ano || '';
        
        userPrompt = `Explique esta alteração legislativa no Art. ${artigo}${elemento ? ` (${elemento})` : ''}:

**Tipo de alteração:** ${tipoAlteracao}
**Lei que alterou:** ${leiAlteradora}${ano ? ` (${ano})` : ''}

${textoAnterior !== 'Não disponível' ? `**TEXTO ANTERIOR:**
${textoAnterior}

` : ''}**TEXTO ATUAL:**
${textoAtual}

Por favor, explique:
1. O que mudou exatamente?
2. Qual foi o impacto prático dessa mudança?
3. Por que essa alteração foi feita (se possível inferir)?`;
      }
      else switch (contexto) {
        case 'cargo_eleitoral':
          systemPrompt = 'Você é uma amiga explicando política de um jeito super simples, tipo áudio de WhatsApp.';
          userPrompt = `Mano, vou te explicar o cargo de ${dados.cargo} de um jeito que você vai entender de primeira! Tipo assim, sem juridiquês, só no papo reto mesmo. Explica: o que faz, como é eleito, quanto tempo fica no cargo e porque é importante. Usa gírias tipo "tipo", "sacou?", "massa". Máximo 200 palavras mas bem conversacional!`;
          break;

        case 'estatisticas_eleicao':
          systemPrompt = 'Você é uma amiga explicando estatísticas eleitorais de forma super descomplicada.';
          userPrompt = `Cara, olha só esses números aqui: ${JSON.stringify(dados.estatisticas)}. Explica pra mim de um jeito simples o que isso significa pra democracia. Usa analogias tipo Instagram, TikTok, jogos. Máximo 150 palavras mas bem informal!`;
          break;

        case 'candidato':
          systemPrompt = 'Você é uma amiga explicando como pesquisar candidato de forma descomplicada.';
          userPrompt = `Olha só, quando você for pesquisar um candidato, tem uns dados importantes pra ficar de olho: número, partido, situação, bens declarados. Me explica porque isso importa de um jeito bem simples. Máximo 100 palavras!`;
          break;

        case 'resultados_eleicao':
          systemPrompt = 'Você é uma amiga explicando resultados eleitorais de forma super simples.';
          userPrompt = `Mano, vou te explicar como entender os resultados de eleição no Brasil. Tipo, o que significam as porcentagens, diferença entre primeiro e segundo turno, votos válidos vs brancos/nulos. Usa linguagem de WhatsApp! Máximo 150 palavras.`;
          break;

        case 'historico_eleicoes':
          systemPrompt = 'Você é uma amiga contando a história das eleições no Brasil de forma massa.';
          userPrompt = `Cara, vou te contar sobre o histórico eleitoral brasileiro de um jeito que você vai achar interessante. Desde 1945 até hoje, tipo uma linha do tempo massa. Fala da urna eletrônica e tal. Máximo 200 palavras mas bem conversacional!`;
          break;

        case 'eleitorado':
          systemPrompt = 'Você é uma amiga explicando sobre o eleitorado brasileiro de forma simples.';
          userPrompt = `Olha só, vou te explicar porque é importante conhecer o perfil do eleitorado brasileiro. Tipo, distribuição regional, quem vota, biometria e tal. Como isso ajuda na segurança das eleições. Usa gírias! Máximo 150 palavras.`;
          break;

        case 'legislacao_eleitoral':
          systemPrompt = 'Você é uma amiga explicando legislação eleitoral de forma super descomplicada.';
          userPrompt = `Mano, vou te explicar a legislação eleitoral no Brasil de um jeito simples. Tipo, o que é o Código Eleitoral, porque ele é importante, o que ele garante pra gente. Usa linguagem de WhatsApp! Máximo 150 palavras.`;
          break;

        default:
          systemPrompt = 'Você é uma amiga explicando sobre eleições de forma super simples.';
          userPrompt = `Olha, explica isso aqui de um jeito bem descomplicado: ${dados.pergunta || 'processo eleitoral brasileiro'}. Usa gírias e analogias modernas! Máximo 150 palavras.`;
      }
    } else {
      // Modo técnico (original)
      switch (contexto) {
        case 'cargo_eleitoral':
          systemPrompt = 'Você é um professor de Direito Eleitoral que explica de forma clara e educativa sobre cargos políticos no Brasil.';
          userPrompt = `Explique de forma didática e objetiva (máximo 200 palavras) o cargo de ${dados.cargo}. Inclua: função principal, responsabilidades, mandato, como é eleito e importância para a democracia brasileira.`;
          break;

        case 'estatisticas_eleicao':
          systemPrompt = 'Você é um analista político que explica estatísticas eleitorais de forma acessível.';
          userPrompt = `Explique o significado e importância destas estatísticas eleitorais (máximo 150 palavras): ${JSON.stringify(dados.estatisticas)}. Use linguagem simples e dê contexto sobre o que esses números representam para a democracia.`;
          break;

        case 'candidato':
          systemPrompt = 'Você é um educador cívico que ajuda eleitores a entenderem melhor o processo eleitoral.';
          userPrompt = `Explique (máximo 100 palavras) os principais dados que um eleitor deve observar ao pesquisar um candidato: número, partido, situação eleitoral, bens declarados. Contextualize porque essas informações são importantes.`;
          break;

        case 'resultados_eleicao':
          systemPrompt = 'Você é um especialista em processo democrático que explica resultados eleitorais de forma imparcial.';
          userPrompt = `Explique (máximo 150 palavras) como interpretar os resultados de uma eleição no Brasil. Aborde: o que significam os percentuais, turno único vs segundo turno, votos válidos vs brancos/nulos, e importância do comparecimento eleitoral.`;
          break;

        case 'historico_eleicoes':
          systemPrompt = 'Você é um historiador político que contextualiza a evolução do sistema eleitoral brasileiro.';
          userPrompt = `Explique (máximo 200 palavras) a importância do histórico eleitoral no Brasil. Aborde: marcos importantes desde 1945, a evolução da democracia brasileira, urna eletrônica e o fortalecimento das instituições democráticas.`;
          break;

        case 'eleitorado':
          systemPrompt = 'Você é um cientista político que explica o perfil do eleitorado brasileiro.';
          userPrompt = `Explique (máximo 150 palavras) a importância de conhecer os dados do eleitorado brasileiro. Aborde: distribuição regional, perfil demográfico, biometria e como essas informações contribuem para a segurança e transparência do processo eleitoral.`;
          break;

        case 'legislacao_eleitoral':
          systemPrompt = 'Você é um advogado especialista em Direito Eleitoral que explica legislação de forma didática.';
          userPrompt = `Explique (máximo 150 palavras) a importância da legislação eleitoral no Brasil. Aborde: o que é o Código Eleitoral, seu papel na democracia, principais garantias aos eleitores e candidatos.`;
          break;

        default:
          systemPrompt = 'Você é um educador cívico que explica conceitos eleitorais de forma clara e objetiva.';
          userPrompt = `Explique de forma educativa (máximo 150 palavras): ${dados.pergunta || 'processo eleitoral brasileiro'}`;
      }
    }

    const explicacao = await chamarGeminiComFallback(`${systemPrompt}\n\n${userPrompt}`, {
      temperature: 0.7,
      maxOutputTokens: 500,
    });

    console.log('Explicação gerada com sucesso');

    return new Response(
      JSON.stringify({ explicacao: explicacao || 'Não foi possível gerar explicação.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Erro em explicar-com-gemini:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao gerar explicação',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
