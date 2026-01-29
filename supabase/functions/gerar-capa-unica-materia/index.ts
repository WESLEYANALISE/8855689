import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sistema de paletas de cores e elementos visuais IMPACTANTES por área jurídica
const PALETAS_POR_AREA: Record<string, { cores: string; visual: string; mood: string; icone: string }> = {
  "Ética Profissional": {
    cores: "charcoal black, silver metallic, white marble, dignified gold accents",
    visual: "distinguished senior lawyer in elegant black robe standing in front of OAB golden emblem, ethics code books on mahogany desk, professional certificate framed on wall, scales of justice",
    mood: "dignified, serious, professional integrity, honorable",
    icone: "balança da justiça dourada sobre livro de ética"
  },
  "Direito Constitucional": {
    cores: "imperial sapphire blue, regal gold, pristine white marble, patriotic green-yellow Brazilian flag colors",
    visual: "MAJESTIC Brazilian National Congress building in Brasília with twin towers, Constitution of 1988 open with golden pages, Brazilian flag waving, grand democratic pillars with marble columns",
    mood: "majestic, sovereign, foundational, patriotic, monumental",
    icone: "Congresso Nacional Brasília com Constituição"
  },
  "Direito Civil": {
    cores: "warm mahogany brown, cream parchment, antique gold, burgundy leather, family warmth tones",
    visual: "INTIMATE family scene with wedding rings, inheritance documents, family portraits on elegant wall, handshake between generations, home deed signing, loving couple exchanging contracts",
    mood: "warm, traditional, personal relationships, family bonds, inheritance",
    icone: "família unida com aliança de casamento"
  },
  "Direito Penal": {
    cores: "deep crimson red, noir black shadows, steel gray, cold blue dramatic lighting",
    visual: "DRAMATIC criminal courtroom scene with defendant in handcuffs, stern judge with gavel raised, police evidence folders, prison bars in shadow, noir atmosphere with venetian blind shadows",
    mood: "intense, dramatic, noir tension, justice and punishment, serious consequences",
    icone: "algemas e martelo do juiz"
  },
  "Direito Processual Civil": {
    cores: "clean navy blue, organized white, silver accents, light gray, pristine order",
    visual: "METICULOUS legal office with perfectly organized case folders, procedural flowcharts on wall, court filing stamps, procedural timeline whiteboard, lawyer reviewing documents systematically",
    mood: "clean, methodical, procedural order, systematic precision",
    icone: "pastas de processo organizadas cronologicamente"
  },
  "Direito Processual Penal": {
    cores: "dark charcoal, police blue, courtroom brown, evidence yellow crime scene tape",
    visual: "INTENSE police investigation room with evidence board, criminal case folders, forensic equipment, detective reviewing case, crime scene photos, interrogation atmosphere",
    mood: "serious, investigative, procedural justice, detective noir",
    icone: "placa de evidência policial"
  },
  "Direito do Trabalho": {
    cores: "worker orange safety, corporate blue, industrial gray, safety yellow, hardhat colors",
    visual: "POWERFUL workers and executives at negotiation table, labor union banner, construction worker with hardhat shaking hands with businessman, factory floor with protective equipment",
    mood: "dynamic, protective, worker dignity, labor rights, negotiation",
    icone: "capacete de segurança e aperto de mãos"
  },
  "Direito Administrativo": {
    cores: "institutional gray, navy blue, official gold seals, government green, bureaucratic tones",
    visual: "IMPOSING Brazilian government ministry building interior with grand staircase, official stamps and seals, public servant at desk with official documents, government emblems",
    mood: "formal, bureaucratic, institutional power, public service",
    icone: "brasão da república e carimbo oficial"
  },
  "Direito Tributário": {
    cores: "fiscal green money, financial gold, accounting gray, treasury emerald, tax document colors",
    visual: "COMPLEX tax office with Receita Federal logo, calculator on financial reports, tax declaration forms, money and coins, accountant reviewing fiscal documents, treasury building",
    mood: "fiscal, precise, financial responsibility, taxation, government revenue",
    icone: "leão da Receita Federal com calculadora"
  },
  "Direito Empresarial": {
    cores: "corporate blue, executive gold, modern glass architecture, silver chrome, business elegance",
    visual: "SOPHISTICATED corporate boardroom in glass tower, executives signing merger contracts, stock certificates, modern office skyline, company headquarters, business handshake",
    mood: "modern, corporate, business sophistication, entrepreneurship, success",
    icone: "arranha-céu corporativo com contrato"
  },
  "Direito Ambiental": {
    cores: "forest green Amazon, earth brown, sky blue, natural moss tones, ecological harmony",
    visual: "MAGNIFICENT Amazon rainforest with indigenous protection, IBAMA enforcement officers, sustainable development balance, nature meeting law, protected wildlife, river and forest preservation",
    mood: "natural, protective, ecological balance, environmental guardianship",
    icone: "floresta amazônica com símbolo de proteção"
  },
  "Direitos Humanos": {
    cores: "peaceful sky blue UN colors, diverse skin tones rainbow, unity white, hope gold, dignity purple",
    visual: "INSPIRING diverse hands of different ethnicities united in solidarity, UN Human Rights declaration, peaceful protest, hopeful multiracial crowd, dignified human faces from all backgrounds",
    mood: "hopeful, unified, human dignity, universal rights, solidarity",
    icone: "mãos diversas unidas em círculo"
  },
  "Direito Internacional Público": {
    cores: "diplomatic blue UN, world gold, treaty white, multiple country flag colors",
    visual: "GRAND United Nations assembly hall with multiple country flags, world map with treaty connections, diplomatic seals, international conference, global governance symbols",
    mood: "global, diplomatic, international order, world governance, treaties",
    icone: "bandeiras de países com globo terrestre"
  },
  "Direito Internacional Privado": {
    cores: "elegant navy, cosmopolitan gold, passport burgundy, global silver, sophisticated travel",
    visual: "COSMOPOLITAN international business scene with multiple passports, cross-border contracts, global trade ships, airplane and cargo, international law firm office",
    mood: "cosmopolitan, elegant, cross-border commerce, global business",
    icone: "passaportes internacionais com contrato"
  },
  "Direito Financeiro": {
    cores: "treasury green, budget gold, fiscal gray, government blue, financial charts",
    visual: "IMPRESSIVE public finance office with government budget documents, financial charts and graphs, treasury building, public spending oversight, congressional budget committee",
    mood: "fiscal, governmental, public finance, budget responsibility",
    icone: "gráfico orçamentário do governo"
  },
  "Teoria e Filosofia do Direito": {
    cores: "classical marble white, philosophical indigo, ancient gold, parchment cream, Athenian colors",
    visual: "MAGNIFICENT classical Greek philosophical academy with PLATO, ARISTOTLE and SOCRATES discussing law and justice, ancient marble columns, Themis goddess statue holding scales, ancient leather-bound law books, philosophical scrolls, Academy of Athens atmosphere",
    mood: "contemplative, classical wisdom, philosophical depth, ancient wisdom, intellectual pursuit",
    icone: "filósofos gregos com Themis"
  },
  "Direito Eleitoral": {
    cores: "democratic blue, ballot white, electoral green-yellow Brazilian, civic red, voting colors",
    visual: "VIBRANT Brazilian electronic voting machine urna, ballot box with citizen voting, election campaign banners, TSE electoral court, democratic participation scene, Brazilian flag voting booth",
    mood: "democratic, civic duty, participatory democracy, electoral integrity",
    icone: "urna eletrônica brasileira"
  },
  "Direito Previdenciário": {
    cores: "protective INSS blue, caring orange, retirement gold, social security green",
    visual: "COMPASSIONATE elderly Brazilian receiving retirement benefits at INSS office, social security documents, pensioner with family, retirement celebration, worker becoming retiree, caring government support",
    mood: "caring, protective, social security, retirement dignity, lifetime contribution",
    icone: "idoso feliz com carteira do INSS"
  },
  "Direito da Criança e do Adolescente": {
    cores: "hopeful sky blue, protective purple, caring pink, playful yellow, childhood joy",
    visual: "HOPEFUL child protection scene with caring social worker, ECA (Estatuto da Criança) statute book, juvenile court with compassionate judge, children playing safely, protective adult hands shielding young ones",
    mood: "hopeful, protective, nurturing, childhood innocence, safeguarding future",
    icone: "crianças protegidas por mãos adultas"
  },
  "Direito Romano": {
    cores: "ancient marble white, Roman imperial gold, purple toga, bronze patina, classical Rome",
    visual: "MAJESTIC Roman Senate with toga-clad senators debating law, ancient scrolls with Latin inscriptions, Colosseum columns, Roman legal codex, Emperor's court, XII Tables carved in stone",
    mood: "ancient grandeur, foundational law, classical Roman civilization, imperial justice",
    icone: "senador romano com toga e pergaminho"
  },
  "História do Direito": {
    cores: "aged parchment sepia, medieval brown, historical gold, ink black, antique tones",
    visual: "FASCINATING legal history timeline from ancient codes to modern law, medieval manuscripts, Hammurabi's code, Magna Carta, Portuguese Ordenações, evolution of justice through ages, historical courtroom scenes",
    mood: "historical depth, legal evolution, archival wisdom, centuries of jurisprudence",
    icone: "linha do tempo da história do direito"
  }
};

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

async function gerarImagemComGemini(prompt: string): Promise<string | null> {
  console.log(`[Capa Única] Tentando ${GEMINI_KEYS.length} chaves Gemini`);
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    try {
      console.log(`[Capa Única] Tentando chave ${i + 1}...`);
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_KEYS[i]}`,
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
        console.log(`[Capa Única] Chave ${i + 1} falhou: ${response.status}`);
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 1000));
        }
        continue;
      }
      
      const data = await response.json();
      
      for (const part of data.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          console.log(`[Capa Única] ✅ Imagem gerada com chave ${i + 1}`);
          return part.inlineData.data;
        }
      }
    } catch (err) {
      console.log(`[Capa Única] Chave ${i + 1} erro:`, err);
    }
  }
  
  return null;
}

function getPromptForMateria(areaNome: string): string {
  const config = PALETAS_POR_AREA[areaNome] || PALETAS_POR_AREA["Direito Constitucional"];
  
  return `Create an IMPACTFUL, CINEMATIC cover image for a Brazilian law course.

═══════════════════════════════════════════════════════════════════
⚠️ CRITICAL TECHNICAL REQUIREMENTS:
═══════════════════════════════════════════════════════════════════
1. LANDSCAPE orientation ONLY - 16:9 aspect ratio (wider than tall)
2. ABSOLUTELY NO TEXT - no words, letters, numbers, typography
3. Ultra-realistic 8K HDR photographic quality
4. Professional editorial magazine cover aesthetic

═══════════════════════════════════════════════════════════════════
🎯 SUBJECT: ${areaNome} (OAB Law Examination Course)
═══════════════════════════════════════════════════════════════════

MANDATORY VISUAL ELEMENTS (BE LITERAL AND SPECIFIC):
${config.visual}

ICONIC ELEMENT TO FEATURE PROMINENTLY:
${config.icone}

COLOR PALETTE (Apply throughout):
${config.cores}

EMOTIONAL ATMOSPHERE:
${config.mood}

═══════════════════════════════════════════════════════════════════
🎬 CINEMATIC PRODUCTION QUALITY:
═══════════════════════════════════════════════════════════════════
- Hollywood blockbuster movie poster aesthetic
- Dramatic three-point lighting with strong key light
- Shallow depth of field with bokeh background
- Rich cinematic color grading (teal-orange or complementary)
- Editorial magazine cover composition
- Rule of thirds composition with strong focal point
- Atmospheric haze/fog for depth
- Premium texture details visible
- 8K ultra-high resolution rendering`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materia_id, forcar_regeneracao } = await req.json();

    if (!materia_id) {
      return new Response(
        JSON.stringify({ error: "materia_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se já existe capa para esta matéria
    if (!forcar_regeneracao) {
      const { data: existingCover } = await supabase
        .from("oab_trilhas_topicos")
        .select("capa_url")
        .eq("materia_id", materia_id)
        .not("capa_url", "is", null)
        .limit(1)
        .single();

      if (existingCover?.capa_url) {
        console.log(`[Capa Única] Capa já existe para matéria ${materia_id}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            url: existingCover.capa_url,
            cached: true,
            message: "Capa já existente"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Buscar info da matéria
    const { data: materia } = await supabase
      .from("oab_trilhas_materias")
      .select("nome, area_id")
      .eq("id", materia_id)
      .single();

    const areaNome = materia?.nome || "Direito Constitucional";
    console.log(`[Capa Única] Gerando capa para matéria ${materia_id}: ${areaNome}`);

    // Gerar prompt baseado na área
    const prompt = getPromptForMateria(areaNome);
    
    // Gerar imagem com Gemini
    const base64Image = await gerarImagemComGemini(prompt);

    if (!base64Image) {
      throw new Error("Falha ao gerar imagem com Gemini - todas as chaves falharam");
    }

    // Converter base64 para buffer
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload para Storage
    const fileName = `materia-${materia_id}-unica-${Date.now()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("gerador-imagens")
      .upload(`capas-materias/${fileName}`, bytes.buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload falhou: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from("gerador-imagens")
      .getPublicUrl(`capas-materias/${fileName}`);

    console.log(`[Capa Única] Upload concluído: ${publicUrl}`);

    // Aplicar a MESMA capa a TODOS os tópicos da matéria
    const { data: topicosAtualizados, error: updateError } = await supabase
      .from("oab_trilhas_topicos")
      .update({ capa_url: publicUrl })
      .eq("materia_id", materia_id)
      .select("id");

    if (updateError) {
      throw new Error(`Erro ao atualizar tópicos: ${updateError.message}`);
    }

    console.log(`[Capa Única] ✅ Capa aplicada a ${topicosAtualizados?.length || 0} tópicos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        topicos_atualizados: topicosAtualizados?.length || 0,
        materia: areaNome
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Capa Única] Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
