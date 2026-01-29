import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para gerar imagem com Gemini (NanoBanana - mesma API do texto)
async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  const API_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
    Deno.env.get('DIREITO_PREMIUM_API_KEY')
  ].filter(Boolean);
  
  console.log(`[gerar-capa] Tentando ${API_KEYS.length} chaves Gemini disponíveis`);
  
  for (let i = 0; i < API_KEYS.length; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEYS[i]}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"]
            }
          })
        }
      );
      
      if (!response.ok) {
        console.log(`[gerar-capa] Chave ${i + 1} falhou: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      for (const part of data.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          console.log(`[gerar-capa] Sucesso com chave ${i + 1}`);
          return `data:image/${part.inlineData.mimeType || 'png'};base64,${part.inlineData.data}`;
        }
      }
    } catch (err) {
      console.log(`[gerar-capa] Chave ${i + 1} erro:`, err);
      continue;
    }
  }
  
  return null;
}

// Fallback para Hugging Face
async function gerarImagemComHuggingFace(prompt: string): Promise<string | null> {
  const HF_TOKEN = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
  
  if (!HF_TOKEN) {
    console.log('[gerar-capa] Token Hugging Face não configurado');
    return null;
  }
  
  try {
    console.log('[gerar-capa] Tentando Hugging Face FLUX...');
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );
    
    if (hfResponse.ok) {
      const arrayBuffer = await hfResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      console.log('[gerar-capa] Sucesso com Hugging Face FLUX');
      return `data:image/png;base64,${base64}`;
    } else {
      console.log(`[gerar-capa] Hugging Face falhou: ${hfResponse.status}`);
      return null;
    }
  } catch (err) {
    console.error('[gerar-capa] Erro Hugging Face:', err);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { areaId, areaNome, disciplinaId, disciplinaNome } = await req.json();
    
    console.log("[gerar-capa-dominando-area] Recebido:", { areaId, areaNome, disciplinaId, disciplinaNome });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determinar se é para área ou disciplina
    const isArea = !!areaId;
    const nome = isArea ? areaNome : disciplinaNome;

    // Mapeamento de imagens temáticas específicas por área
    const temasVisuais: Record<string, string> = {
      // Filosofia e Teoria
      "Teoria e Filosofia do Direito": "grandes filósofos como Platão, Aristóteles, Kant, Kelsen em discussão sobre justiça, com togas gregas, pergaminhos antigos, colunas romanas, luz divina iluminando a verdade",
      "Teoria Geral do Direito": "filósofos jurídicos debatendo em biblioteca antiga, estátuas de pensadores clássicos, Hans Kelsen e Hart em destaque, conceitos abstratos de norma e justiça",
      "Filosofia do Direito": "filósofos gregos e romanos debatendo justiça natural, Sócrates e Platão, academia de Atenas, pergaminhos e sabedoria antiga",
      
      // Direito Público
      "Direito Constitucional": "Senado Federal e Congresso Nacional de Brasília, bandeira do Brasil, Constituição de 1988 aberta, pilares da República, céu azul majestoso",
      "Direito Administrativo": "Palácio do Planalto em Brasília, órgãos públicos, funcionários públicos, selos oficiais do governo brasileiro, burocracia estatal organizada",
      "Direito Tributário": "Receita Federal, moedas e notas de Real, cofres públicos, balança equilibrando impostos e serviços, declaração de imposto de renda",
      "Direito Financeiro": "Tesouro Nacional, orçamento público, gráficos financeiros do Estado, Lei de Responsabilidade Fiscal, gestão de recursos públicos",
      
      // Direito Privado
      "Direito Civil": "família brasileira reunida, casa com jardim, certidão de casamento, herança, contratos sendo assinados, momentos da vida civil",
      "Direito das Famílias": "família diversa brasileira, casamento, guarda de filhos, união estável, proteção infantil, lar acolhedor",
      "Direito das Sucessões": "testamento antigo, árvore genealógica, herança familiar, inventário, partilha de bens entre gerações",
      "Direito das Obrigações": "aperto de mãos em acordo, contratos, promissórias, cumprimento de deveres, responsabilidade civil",
      "Direito Empresarial": "escritório corporativo moderno, empresários em reunião, bolsa de valores, empresas brasileiras, negócios e contratos comerciais",
      
      // Direito Penal
      "Direito Penal": "tribunal do júri, algemas, Código Penal, cela de prisão, julgamento criminal, toga de juiz criminal",
      "Direito Processual Penal": "delegacia de polícia, inquérito policial, audiência criminal, flagrante, investigação, defesa técnica",
      
      // Direito do Trabalho
      "Direito do Trabalho": "trabalhadores brasileiros em fábrica e escritório, carteira de trabalho, sindicato, CLT, direitos trabalhistas",
      "Direito Processual do Trabalho": "Tribunal Regional do Trabalho, audiência trabalhista, reclamação trabalhista, conciliação entre patrão e empregado",
      
      // Direito Internacional
      "Direito Internacional Público": "ONU, bandeiras de nações, tratados internacionais, diplomacia, paz mundial, embaixadores reunidos",
      "Direito Internacional Privado": "contratos internacionais, comércio exterior, fronteiras, passaportes, relações privadas entre países",
      "Direitos Humanos": "Declaração Universal dos Direitos Humanos, diversidade humana, liberdade, igualdade, dignidade da pessoa humana",
      
      // Direito Processual
      "Direito Processual Civil": "petição inicial, audiência cível, citação, prazos processuais, advogados em tribunal cível",
      "Teoria Geral do Processo": "fluxograma processual, ação, jurisdição, processo como instrumento de justiça, princípios processuais",
      
      // Áreas Especializadas
      "Direito Ambiental": "floresta amazônica, fauna e flora brasileira, sustentabilidade, IBAMA, proteção ambiental, natureza exuberante",
      "Direito do Consumidor": "PROCON, consumidor fazendo compras, Código de Defesa do Consumidor, relação de consumo, proteção ao cliente",
      "Direito Digital": "tecnologia, internet, proteção de dados, LGPD, cibersegurança, mundo digital e conectado",
      "Direito Eleitoral": "urna eletrônica brasileira, TSE, eleições, voto popular, democracia, candidatos políticos",
      "Direito Previdenciário": "aposentados felizes, INSS, benefícios previdenciários, terceira idade, seguridade social",
    };

    // Buscar tema visual específico ou usar genérico
    const temaEspecifico = temasVisuais[nome] || `representação visual impactante e simbólica de ${nome}, com elementos icônicos que remetam diretamente ao tema`;

    // Gerar prompt para a imagem
    const prompt = isArea 
      ? `Gere uma imagem de capa cinematográfica ultra realista para a área "${nome}" do Direito brasileiro. TEMA: ${temaEspecifico}. Estilo: fotografia profissional épica, iluminação dramática dourada e vermelha, composição impactante como pôster de filme, detalhes ultrarrealistas, atmosfera grandiosa e inspiradora. Formato paisagem 16:9, 8K, HDR.`
      : `Gere uma imagem de capa cinematográfica ultra realista para a disciplina "${nome}" em ${areaNome || 'Direito'}. TEMA: ${temaEspecifico}. Estilo: fotografia profissional épica, iluminação dramática, composição impactante como pôster de filme, detalhes ultrarrealistas, atmosfera grandiosa. Formato paisagem 16:9, 8K, HDR.`;

    console.log("[gerar-capa-dominando-area] Gerando imagem com Gemini:", prompt);

    // Tentar Gemini primeiro
    let imageUrl = await gerarImagemComGemini(prompt);
    
    // Fallback para Hugging Face
    if (!imageUrl) {
      console.log('[gerar-capa-dominando-area] Gemini falhou, tentando Hugging Face...');
      imageUrl = await gerarImagemComHuggingFace(prompt);
    }
    
    if (!imageUrl) {
      throw new Error("Nenhuma imagem gerada. Todas as APIs falharam.");
    }

    console.log("[gerar-capa-dominando-area] Imagem gerada com sucesso");

    // Atualizar no banco
    if (isArea) {
      const { error } = await supabase
        .from("dominando_areas")
        .update({ capa_url: imageUrl })
        .eq("id", areaId);
      
      if (error) {
        console.error("[gerar-capa-dominando-area] Erro ao atualizar área:", error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("BIBLIOTECA-ESTUDOS")
        .update({ url_capa_gerada: imageUrl })
        .eq("id", disciplinaId);
      
      if (error) {
        console.error("[gerar-capa-dominando-area] Erro ao atualizar disciplina:", error);
        throw error;
      }
    }

    return new Response(JSON.stringify({ success: true, url: imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[gerar-capa-dominando-area] Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
