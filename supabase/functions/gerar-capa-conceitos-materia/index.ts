import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para tentar gerar imagem com fallback de chaves
async function gerarImagemComFallback(prompt: string): Promise<string> {
  const keys = [
    Deno.env.get("GEMINI_KEY_1"),
    Deno.env.get("GEMINI_KEY_2"),
    Deno.env.get("GEMINI_KEY_3"),
  ].filter(Boolean);

  if (keys.length === 0) {
    throw new Error("Nenhuma chave GEMINI_KEY configurada");
  }

  let lastError: Error | null = null;

  for (const apiKey of keys) {
    try {
      console.log("Tentando gerar imagem com chave...");
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro com chave: ${response.status} - ${errorText}`);
        
        // Se for erro de quota ou rate limit, tenta próxima chave
        if (response.status === 429 || response.status === 503 || response.status === 400) {
          lastError = new Error(`API error: ${response.status}`);
          continue;
        }
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Extrair imagem da resposta
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          console.log("Imagem gerada com sucesso!");
          return part.inlineData.data; // base64
        }
      }

      throw new Error("Nenhuma imagem na resposta");
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error("Falha ao gerar imagem com todas as chaves");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materiaId } = await req.json();

    if (!materiaId) {
      return new Response(
        JSON.stringify({ error: "materiaId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar matéria
    const { data: materia, error: materiaError } = await supabase
      .from("conceitos_materias")
      .select("*")
      .eq("id", materiaId)
      .single();

    if (materiaError || !materia) {
      throw new Error("Matéria não encontrada");
    }

    console.log(`Gerando capa para matéria: ${materia.nome}`);

    // Mapeamento de elementos visuais ICÔNICOS e REPRESENTATIVOS para cada matéria
    // O objetivo é que a pessoa bata o olho e ENTENDA imediatamente o tema
    const elementosEspecificos: Record<string, string> = {
      // FUNDAMENTAIS
      "História do Direito": "CÓDICE ANTIGO com páginas amareladas sendo iluminado por vela, mãos de escriba com pena de ganso escrevendo, selo de cera vermelha, ambiente medieval com vitrais coloridos ao fundo",
      
      "Introdução ao Estudo do Direito": "ESTUDANTE DE COSTAS entrando por portas monumentais de biblioteca jurídica grandiosa pela primeira vez, raios de luz solar entrando pelas janelas altas, ambiente acolhedor e inspirador",
      
      "Filosofia do Direito": "BUSTO DE MÁRMORE de filósofo grego (Sócrates ou Platão) em primeiro plano, luz lateral dramática, livros de filosofia empilhados ao redor, ambiente de academia grega antiga com colunas",
      
      "Teoria Geral dos Prazos e Prazos na LINDB": "AMPULHETA ANTIGA de bronze com areia caindo em primeiro plano, calendário vintage ao fundo, relógio de bolso antigo, livro de leis aberto mostrando artigos",
      
      // ROMA E HUMANIDADES
      "Direito Romano": "SENADOR ROMANO DE TOGA BRANCA com borda púrpura discursando no Senado de Roma, colunas coríntias do Fórum Romano, estandarte SPQR visível, mosaico romano no chão, ambiente majestoso da Roma Antiga",
      
      "Hans Kelsen": "PIRÂMIDE ESCALONADA abstrata feita de livros jurídicos representando a hierarquia das normas, ambiente acadêmico austríaco do início do século XX, luz intelectual suave",
      
      "Introdução à Sociologia do Direito": "MULTIDÃO DIVERSIFICADA de pessoas de diferentes classes e etnias em praça pública, mãos entrelaçadas representando união social, cidade ao fundo",
      
      "Teoria Geral dos Direitos Humanos": "MÃOS HUMANAS de diferentes etnias UNIDAS EM CÍRCULO, luz dourada celestial vindo de cima, símbolo de paz, ambiente esperançoso e universal, cores vibrantes de humanidade",
      
      "Direitos da Personalidade": "SILHUETA HUMANA com luz interior brilhando, representando a dignidade e essência da pessoa, espelho refletindo identidade, ambiente íntimo e pessoal",
      
      "LINDB": "BÚSSOLA JURÍDICA sobre mapa do Brasil, código de leis aberto na primeira página, ponte conectando dois mundos (antigo e moderno), transição de épocas",
      
      "Pessoas no Código Civil": "FAMÍLIA BRASILEIRA unida em ambiente doméstico acolhedor, bebê sendo segurado, idoso sorrindo, representando todas as fases da vida, certidão de nascimento visível",
      
      "A Formação do Capitalismo": "FÁBRICA INDUSTRIAL do século XIX com chaminés soltando fumaça, trabalhadores entrando, moedas de ouro empilhadas, contraste entre riqueza e trabalho",
      
      "História Constitucional do Brasil": "PERGAMINHO da Constituição Imperial sendo assinado, transição de épocas brasileiras, bandeiras históricas do Brasil, ambiente do Paço Imperial",
      
      "Constitucionalismo e Classificação das Constituições": "CONSTITUIÇÕES de diferentes países empilhadas em estante organizada, lupa analisando diferenças, quadro comparativo visual, ambiente de pesquisa acadêmica",
      
      "Noções Gerais de Direito Penal": "MARTELO DE JUIZ CRIMINAL em primeiro plano sobre mesa de madeira escura, algemas ao lado, balança da justiça com olhos vendados, ambiente de tribunal criminal dramático"
    };

    const elementoVisual = elementosEspecificos[materia.nome] || "ambiente jurídico acadêmico clássico com livros antigos e símbolos da justiça";

    // Prompt ICÔNICO e REPRESENTATIVO - a pessoa deve entender o tema só de olhar
    const prompt = `Crie uma CAPA DE LIVRO PROFISSIONAL ultra-realista para a disciplina "${materia.nome}".

ELEMENTO VISUAL CENTRAL E ICÔNICO (OBRIGATÓRIO):
${elementoVisual}

REGRAS CRÍTICAS DE COMPOSIÇÃO:
1. O elemento principal deve ser GRANDE e CENTRALIZADO - ocupar 70% da imagem
2. A imagem deve ser IMEDIATAMENTE RECONHECÍVEL - quem olhar deve entender o tema em 1 segundo
3. Use símbolos UNIVERSAIS e ICÔNICOS do tema, não genéricos
4. Evite clichês como "livros em estante" - seja ESPECÍFICO e MARCANTE

ESTILO CINEMATOGRÁFICO:
- Fotografia de capa de livro jurídico premium, qualidade editorial Harper Collins ou Saraiva
- Iluminação DRAMÁTICA tipo Rembrandt - luz lateral dourada contrastando com sombras profundas
- Profundidade de campo rasa com bokeh suave no fundo
- Composição 16:9 widescreen, proporção de capa de ebook

FIDELIDADE HISTÓRICA:
- Se o tema é de Roma Antiga: mostre elementos ROMANOS autênticos (togas, senado, SPQR)
- Se o tema é medieval: use elementos MEDIEVAIS (pergaminhos, velas, selos de cera)
- Se o tema é contemporâneo: ambiente moderno e institucional

PALETA DE CORES JURÍDICA:
- Predominância de DOURADO, ÂMBAR e MOGNO
- Acentos em BORDÔ e VERDE ESMERALDA
- Sombras em SÉPIA profundo
- Toques de BRONZE e COBRE

PROIBIDO ABSOLUTAMENTE: texto, palavras, letras, números, marcas d'água, logos, rostos de frente identificáveis.`;

    // Gerar imagem com fallback
    const imageBase64 = await gerarImagemComFallback(prompt);

    // Converter base64 para buffer
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

    // Salvar no storage
    const fileName = `conceitos-materias/${materiaId}-${Date.now()}.webp`;
    
    const { error: uploadError } = await supabase.storage
      .from("gerador-imagens")
      .upload(fileName, imageBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Erro no upload:", uploadError);
      throw new Error("Erro ao salvar imagem no storage");
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from("gerador-imagens")
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Atualizar matéria com a URL da capa
    const { error: updateError } = await supabase
      .from("conceitos_materias")
      .update({ capa_url: publicUrl })
      .eq("id", materiaId);

    if (updateError) {
      console.error("Erro ao atualizar matéria:", updateError);
      throw new Error("Erro ao salvar URL da capa");
    }

    console.log(`Capa gerada com sucesso: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        capa_url: publicUrl,
        materia: materia.nome
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
