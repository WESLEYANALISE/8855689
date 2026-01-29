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
      .from("oab_trilhas_materias")
      .select("*")
      .eq("id", materiaId)
      .single();

    if (materiaError || !materia) {
      throw new Error("Matéria não encontrada");
    }

    console.log(`Gerando capa para matéria OAB: ${materia.nome}`);

    // Mapeamento de elementos visuais ICÔNICOS para cada matéria da OAB
    const elementosEspecificos: Record<string, string> = {
      "Ética Profissional": "ADVOGADO de toga preta elegante em tribunal, segurando código de ética, ambiente formal e solene, luz lateral dramática, símbolo da OAB visível",
      
      "Estatuto da Advocacia e da OAB": "CARTEIRA da OAB e martelo de juiz sobre mesa de mogno, código de ética aberto, ambiente de escritório jurídico premium, luz dourada",
      
      "Direito Constitucional": "CONSTITUIÇÃO FEDERAL do Brasil aberta em página com direitos fundamentais, bandeira do Brasil ao fundo, ambiente do STF com colunas imponentes",
      
      "Direitos Humanos": "MÃOS HUMANAS de diferentes etnias UNIDAS formando círculo, luz celestial dourada, símbolo universal de paz, ambiente esperançoso e diverso",
      
      "Direito Internacional": "GLOBO TERRESTRE com bandeiras de diferentes países, sede da ONU ao fundo, tratados internacionais sobre mesa, ambiente diplomático",
      
      "Direito Tributário": "BALANÇA DA JUSTIÇA com moedas de um lado e código tributário do outro, calculadora vintage, ambiente de contabilidade jurídica elegante",
      
      "Direito Administrativo": "PRÉDIO PÚBLICO imponente com colunas neoclássicas, brasão da República, documentos oficiais com carimbos, ambiente institucional",
      
      "Direito Ambiental": "ÁRVORE MAJESTOSA com raízes profundas entrelaçando código legal, natureza exuberante, equilíbrio entre desenvolvimento e preservação",
      
      "Direito Civil": "CÓDIGO CIVIL brasileiro aberto sobre mesa de mogno, aliança de casamento, contrato sendo assinado, ambiente de cartório elegante",
      
      "Direito Processual Civil": "PETIÇÃO INICIAL sendo protocolada, carimbo de vara cível, processo físico empilhado, ambiente de fórum cível movimentado",
      
      "Direito do Consumidor": "BALANÇA pesando produto contra direitos do consumidor, nota fiscal, ambiente de relação comercial justa e equilibrada",
      
      "ECA": "CRIANÇA feliz brincando em ambiente seguro, mãos protetoras ao redor, símbolo de proteção integral, ambiente acolhedor e colorido",
      
      "Direito Empresarial": "CONTRATO SOCIAL sendo assinado, selo de empresa, ambiente corporativo moderno, mesa de reunião executiva, gráficos de crescimento",
      
      "Direito Penal": "CÓDIGO PENAL com algemas sobre mesa de tribunal criminal, martelo de juiz, ambiente sóbrio e dramático, justiça cega ao fundo",
      
      "Direito Processual Penal": "INQUÉRITO POLICIAL com lupa, processo criminal tramitando, ambiente de delegacia e fórum criminal, luz contrastante",
      
      "Direito do Trabalho": "CLT aberta sobre mesa, carteira de trabalho, equipamentos de proteção, ambiente que equilibra empregador e empregado",
      
      "Direito Processual do Trabalho": "RECLAMATÓRIA TRABALHISTA sendo protocolada, audiência trabalhista, ambiente de Justiça do Trabalho, toga de juiz"
    };

    const elementoVisual = elementosEspecificos[materia.nome] || "ambiente jurídico acadêmico com livros de lei e símbolos da justiça";

    // Prompt ICÔNICO e REPRESENTATIVO para OAB
    const prompt = `Crie uma CAPA DE LIVRO PROFISSIONAL ultra-realista para a disciplina "${materia.nome}" do Exame da OAB.

ELEMENTO VISUAL CENTRAL E ICÔNICO (OBRIGATÓRIO):
${elementoVisual}

REGRAS CRÍTICAS DE COMPOSIÇÃO:
1. O elemento principal deve ser GRANDE e CENTRALIZADO - ocupar 70% da imagem
2. A imagem deve ser IMEDIATAMENTE RECONHECÍVEL - quem olhar deve entender o tema em 1 segundo
3. Use símbolos UNIVERSAIS e ICÔNICOS do tema jurídico, não genéricos
4. Inclua sutilmente elementos que remetam ao Exame da OAB (carteira OAB, símbolo da Ordem)

ESTILO CINEMATOGRÁFICO:
- Fotografia de capa de livro jurídico premium, qualidade editorial
- Iluminação DRAMÁTICA tipo Rembrandt - luz lateral dourada contrastando com sombras profundas
- Profundidade de campo rasa com bokeh suave no fundo
- Composição 16:9 widescreen, proporção de capa de ebook
- Tom VERMELHO ESCURO e DOURADO predominantes (cores da OAB)

PALETA DE CORES OAB:
- Predominância de VERMELHO BORDÔ, DOURADO e MOGNO
- Acentos em PRETO e BRANCO
- Sombras em SÉPIA profundo
- Toques de BRONZE

PROIBIDO ABSOLUTAMENTE: texto, palavras, letras, números, marcas d'água, logos, rostos de frente identificáveis.`;

    // Gerar imagem com fallback
    const imageBase64 = await gerarImagemComFallback(prompt);

    // Converter base64 para buffer
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

    // Salvar no storage
    const fileName = `oab-materias/${materiaId}-${Date.now()}.webp`;
    
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
      .from("oab_trilhas_materias")
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