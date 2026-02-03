import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════════════════
// PALETA DE CORES POR ÁREA JURÍDICA
// ═══════════════════════════════════════════════════════════════════════════
const paletasPorArea: Record<string, { corPrincipal: string; corSecundaria: string; corDestaque: string; descricao: string }> = {
  'Direito Processual Civil': { corPrincipal: '#4682B4', corSecundaria: '#FFFFFF', corDestaque: '#C0C0C0', descricao: 'steel blue, white, silver' },
  'Direito Processual Penal': { corPrincipal: '#800020', corSecundaria: '#696969', corDestaque: '#1a1a1a', descricao: 'burgundy red, dark gray, black' },
  'Direito Civil': { corPrincipal: '#1E3A5F', corSecundaria: '#F5F5F5', corDestaque: '#C0C0C0', descricao: 'navy blue, clean white, silver tones' },
  'Direito Penal': { corPrincipal: '#8B0000', corSecundaria: '#1a1a1a', corDestaque: '#D4AF37', descricao: 'deep crimson red, black shadows, golden accents' },
  'Direito Constitucional': { corPrincipal: '#006400', corSecundaria: '#FFD700', corDestaque: '#00308F', descricao: 'deep green, golden yellow, patriotic blue' },
  'Direito Tributário': { corPrincipal: '#228B22', corSecundaria: '#D4AF37', corDestaque: '#CD7F32', descricao: 'forest green, gold, bronze money tones' },
  'Direito do Trabalho': { corPrincipal: '#CC5500', corSecundaria: '#1E3A5F', corDestaque: '#8B4513', descricao: 'burnt orange, industrial blue, earthy brown' },
  'Direito Administrativo': { corPrincipal: '#663399', corSecundaria: '#808080', corDestaque: '#FFFFFF', descricao: 'royal purple, institutional gray, white columns' },
  'Direito Empresarial': { corPrincipal: '#0047AB', corSecundaria: '#D4AF37', corDestaque: '#36454F', descricao: 'corporate blue, gold, charcoal' },
  'Ética Profissional': { corPrincipal: '#4B0082', corSecundaria: '#D4AF37', corDestaque: '#FFFFFF', descricao: 'deep purple, gold, white' },
  'default': { corPrincipal: '#1E3A5F', corSecundaria: '#D4AF37', corDestaque: '#FFFFFF', descricao: 'navy blue, gold, white' }
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXTO VISUAL POR ÁREA JURÍDICA
// ═══════════════════════════════════════════════════════════════════════════
interface ContextoVisual {
  cena: string;
  elementos: string;
  atmosfera: string;
  variacoes: string[];
}

const contextosPorArea: Record<string, ContextoVisual> = {
  'Ética Profissional': {
    cena: 'Formal judicial ceremony with lawyers in traditional Brazilian robes',
    elementos: 'lawyer in black robe with white collar, OAB insignia, courtroom setting, professional oath taking',
    atmosfera: 'dignity, honor, professional ethics, solemnity',
    variacoes: [
      'lawyer in formal black robe with OAB medal in prestigious courtroom',
      'young lawyer taking professional oath with hand on legal code',
      'group of lawyers in formal attire during bar ceremony',
      'judge administering oath to new lawyer in ceremonial chamber',
      'lawyer reviewing ethical code book in elegant office'
    ]
  },
  'Direito Constitucional': {
    cena: 'Brazilian Constitution book with national symbols and patriotic setting',
    elementos: 'Constitution book, Brazilian flag, green and gold colors, national emblems, Supreme Court imagery',
    atmosfera: 'patriotism, fundamental rights, national identity, constitutional supremacy',
    variacoes: [
      'leather-bound Brazilian Constitution book with national symbols',
      'constitution opening with golden light emanating from pages',
      'Supreme Court facade with Brazilian flag at sunset',
      'citizen holding constitution with pride and reverence',
      'constitutional text pages with highlighted fundamental rights'
    ]
  },
  'Direito Administrativo': {
    cena: 'Grand neoclassical government building with impressive columns',
    elementos: 'white marble columns, government palace, public administration building, official seals, bureaucratic setting',
    atmosfera: 'institutional power, public service, government authority, administrative order',
    variacoes: [
      'majestic courthouse with towering white columns at golden hour',
      'interior of grand government hall with marble floors',
      'public servant at desk in ornate government office',
      'neoclassical building facade with Brazilian official symbols',
      'columns of justice framing government plaza'
    ]
  },
  'Direito Civil': {
    cena: 'Legal contract signing or family law representation',
    elementos: 'contracts, handshake, family portraits, property documents, inheritance symbols',
    atmosfera: 'trust, agreements, family bonds, property rights',
    variacoes: [
      'business partners signing contract at elegant table',
      'family gathered around legal documents for inheritance',
      'house keys and property deed on lawyers desk',
      'wedding rings alongside marriage contract',
      'lawyer mediating civil dispute between parties'
    ]
  },
  'Direito Penal': {
    cena: 'Criminal court trial scene with dramatic tension',
    elementos: 'defendants dock, criminal courtroom, evidence table, dramatic lighting, gavel',
    atmosfera: 'justice vs crime, dramatic tension, consequences, judgment',
    variacoes: [
      'dramatic criminal courtroom with defendants awaiting verdict',
      'evidence table with crime scene photographs in court',
      'prosecutor presenting case with passionate gesture',
      'empty prison cell with light through bars',
      'scales of justice tilting in dramatic lighting'
    ]
  },
  'Direito Processual Civil': {
    cena: 'Civil litigation process and court procedures',
    elementos: 'legal briefs, courtroom procedure, judicial stamps, case files, civil court',
    atmosfera: 'procedural rigor, due process, legal formalities',
    variacoes: [
      'lawyer organizing case files in office before trial',
      'judge reviewing civil petition at bench',
      'stack of legal documents with court stamps',
      'civil hearing with parties at counsel tables',
      'court clerk stamping official documents'
    ]
  },
  'Direito Processual Penal': {
    cena: 'Criminal procedure scene with investigation elements',
    elementos: 'criminal evidence, police investigation, criminal court, defendant rights',
    atmosfera: 'investigation, criminal justice procedure, due process',
    variacoes: [
      'detective examining evidence in investigation room',
      'criminal hearing with defendant and defense lawyer',
      'evidence being presented in criminal trial',
      'police report and investigation documents',
      'witness testifying in criminal court'
    ]
  },
  'Direito do Trabalho': {
    cena: 'Workplace and labor relations scene',
    elementos: 'workers, factory, office, union meeting, employment contract',
    atmosfera: 'workers rights, labor dignity, employment protection',
    variacoes: [
      'workers in factory setting with protective gear',
      'employee signing employment contract at HR office',
      'labor court hearing with worker and employer',
      'union representatives in negotiation meeting',
      'workplace safety inspection in industrial setting'
    ]
  },
  'Direito Tributário': {
    cena: 'Tax and fiscal administration scene',
    elementos: 'tax documents, calculator, money, government revenue, fiscal balance',
    atmosfera: 'fiscal obligation, tax justice, public revenue',
    variacoes: [
      'accountant analyzing tax documents at desk',
      'tax court hearing with revenue service',
      'stack of tax returns and fiscal documents',
      'balance scale weighing coins and tax code',
      'citizen filing tax return at government office'
    ]
  },
  'Direito Empresarial': {
    cena: 'Corporate business and commercial law scene',
    elementos: 'corporate office, business meeting, contracts, company formation',
    atmosfera: 'business success, corporate governance, commercial transactions',
    variacoes: [
      'corporate boardroom meeting with executives',
      'business partners signing company formation documents',
      'stock exchange or commercial trading scene',
      'entrepreneur reviewing business contracts',
      'corporate merger negotiation at conference table'
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const key1 = Deno.env.get('GEMINI_KEY_1');
  const key2 = Deno.env.get('GEMINI_KEY_2');
  const key3 = Deno.env.get('GEMINI_KEY_3');
  const keyPremium = Deno.env.get('DIREITO_PREMIUM_API_KEY');
  
  if (key1) keys.push(key1);
  if (key2) keys.push(key2);
  if (key3) keys.push(key3);
  if (keyPremium) keys.push(keyPremium);
  
  return keys;
}

function encontrarContexto(titulo: string, area: string): ContextoVisual {
  // Primeiro, tentar pelo nome da área
  for (const [areaKey, contexto] of Object.entries(contextosPorArea)) {
    if (area.toLowerCase().includes(areaKey.toLowerCase()) || 
        areaKey.toLowerCase().includes(area.toLowerCase())) {
      return contexto;
    }
  }
  
  // Fallback genérico
  return {
    cena: `Brazilian legal scene representing "${titulo}"`,
    elementos: 'law books, legal professionals, courtroom elements, justice symbols',
    atmosfera: 'professional legal environment, education, knowledge',
    variacoes: [
      'law library with student studying legal texts',
      'courtroom scene with judge and lawyers',
      'lawyer mentoring young associate in office',
      'scales of justice in front of law books',
      'graduation ceremony for law students'
    ]
  };
}

function gerarPromptTematico(titulo: string, area: string, contexto: ContextoVisual, variacao: string, paleta: any): string {
  return `CRITICAL INSTRUCTION - ABSOLUTE TEXT PROHIBITION:
This image MUST contain ZERO text elements. Any image with letters, words, numbers, titles, labels, signs, typography, watermarks, or any written content will be REJECTED. Generate a PURELY VISUAL illustration with NO TEXT WHATSOEVER.

Create a CINEMATIC EDITORIAL ILLUSTRATION in 16:9 horizontal format.

VISUAL CONCEPT: "${titulo}"
THEMATIC AREA: ${area}

SCENE TO ILLUSTRATE:
${variacao}

SCENE ELEMENTS:
${contexto.elementos}

ATMOSPHERE:
${contexto.atmosfera}

VISUAL STYLE REQUIREMENTS:
- Semi-realistic cinematic illustration style
- High detail with visible textures
- Realistic human proportions and expressions
- Dramatic cinematic lighting with strong directional source
- Rich environmental details (objects, clothing, architecture)
- Movie poster aesthetic quality
- Magazine editorial illustration feel

COLOR PALETTE (MANDATORY):
${paleta.descricao}
• Primary: ${paleta.corPrincipal}
• Secondary: ${paleta.corSecundaria}
• Accent: ${paleta.corDestaque}
Apply this color grading throughout the entire composition.

COMPOSITION:
- 16:9 horizontal landscape format (wider than tall)
- Dynamic, engaging arrangement
- Clear focal point with depth through layering
- Professional premium quality

SCENE DETAILS:
- Realistic fabric textures
- Authentic Brazilian legal settings
- Period-appropriate elements
- Professional attire and equipment
- Environmental storytelling

FINAL CHECK - TEXT PROHIBITION:
- NO text, NO letters, NO words, NO numbers, NO signs, NO labels
- NO typography of any kind
- All signs, documents, or papers in scene must be blank or blurred
- PURELY VISUAL content only`;
}

async function generateImageWithGemini(prompt: string, keys: string[]): Promise<string | null> {
  console.log(`[Capa OAB] Gerando imagem, ${keys.length} chaves disponíveis`);
  
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    console.log(`[Capa OAB] Tentando chave ${i + 1}/${keys.length}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"]
            }
          })
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[Capa OAB] Chave ${i + 1} rate limited (${response.status}), próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Capa OAB] Erro chave ${i + 1}: ${response.status} - ${errorText.substring(0, 100)}`);
        continue;
      }

      const data = await response.json();
      
      // Extrair imagem da resposta do Gemini
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          console.log(`[Capa OAB] ✓ Imagem gerada com chave ${i + 1}`);
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      console.log(`[Capa OAB] Chave ${i + 1} sem imagem, próxima...`);
      continue;
      
    } catch (error) {
      console.error(`[Capa OAB] Exceção chave ${i + 1}:`, error);
      continue;
    }
  }
  
  console.error('[Capa OAB] Todas as tentativas falharam');
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topico_id, titulo, area, materia_id } = await req.json();

    if (!topico_id) {
      return new Response(
        JSON.stringify({ error: "topico_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[Capa OAB v2] Tópico ${topico_id}: "${titulo}" (Área: ${area})`);

    // CACHE: Verificar se outro tópico da mesma matéria já tem capa v2
    if (materia_id) {
      const { data: siblingWithCover } = await supabase
        .from("oab_trilhas_topicos")
        .select("capa_url, capa_versao")
        .eq("materia_id", materia_id)
        .eq("capa_versao", 2)
        .not("capa_url", "is", null)
        .neq("id", topico_id)
        .limit(1)
        .single();

      if (siblingWithCover?.capa_url) {
        console.log(`[Capa OAB v2] ✓ Cache: reutilizando capa temática da matéria ${materia_id}`);
        
        const { error: updateError } = await supabase
          .from("oab_trilhas_topicos")
          .update({ capa_url: siblingWithCover.capa_url, capa_versao: 2 })
          .eq("id", topico_id);

        if (updateError) {
          console.error("[Capa OAB v2] Erro ao atualizar com cache:", updateError);
        }

        return new Response(
          JSON.stringify({ success: true, cached: true, capa_url: siblingWithCover.capa_url }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Verificar chaves disponíveis
    const geminiKeys = getGeminiKeys();
    if (geminiKeys.length === 0) {
      throw new Error("Nenhuma chave Gemini configurada");
    }

    // Encontrar contexto visual baseado na ÁREA jurídica
    const paleta = paletasPorArea[area] || paletasPorArea['default'];
    const contexto = encontrarContexto(titulo, area);
    
    // Selecionar uma variação aleatória
    const variacaoIndex = Math.floor(Math.random() * contexto.variacoes.length);
    const variacao = contexto.variacoes[variacaoIndex];
    
    console.log(`[Capa OAB v2] Área: ${area}`);
    console.log(`[Capa OAB v2] Variação: ${variacao.substring(0, 60)}...`);

    // Gerar prompt temático elaborado
    const imagePrompt = gerarPromptTematico(titulo, area, contexto, variacao, paleta);

    console.log(`[Capa OAB v2] Prompt: ${imagePrompt.length} chars`);

    // Gerar imagem usando Gemini
    const imageDataUrl = await generateImageWithGemini(imagePrompt, geminiKeys);

    if (!imageDataUrl) {
      console.log("[Capa OAB v2] Imagem não gerada, retornando fallback");
      return new Response(
        JSON.stringify({ success: false, message: "Imagem não gerada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Converter base64 para upload no storage
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Determinar extensão do arquivo baseado no MIME type
    const mimeMatch = imageDataUrl.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const extension = mimeType.split('/')[1] || 'png';

    // Upload para o storage
    const fileName = `oab-trilhas/topicos/${topico_id}-${Date.now()}.${extension}`;
    
    const { error: uploadError } = await supabase.storage
      .from("imagens")
      .upload(fileName, imageBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadError) {
      console.error("[Capa OAB v2] Erro upload:", uploadError);
      throw uploadError;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from("imagens")
      .getPublicUrl(fileName);

    const capaUrl = urlData?.publicUrl;

    // Atualizar o tópico com a URL da capa e marcar como versão 2
    const { error: updateError } = await supabase
      .from("oab_trilhas_topicos")
      .update({ capa_url: capaUrl, capa_versao: 2 })
      .eq("id", topico_id);

    if (updateError) {
      console.error("[Capa OAB v2] Erro ao atualizar tópico:", updateError);
      throw updateError;
    }

    console.log(`[Capa OAB v2] ✓ Nova capa temática salva: ${capaUrl}`);

    return new Response(
      JSON.stringify({ success: true, capa_url: capaUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Capa OAB v2] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
