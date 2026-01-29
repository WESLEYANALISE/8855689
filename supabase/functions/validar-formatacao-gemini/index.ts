import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pool de chaves API Gemini (igual ao chat da professora)
const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

async function chamarGeminiComFallback(prompt: string): Promise<string> {
  console.log(`[validar-formatacao-gemini] Tentando com ${GEMINI_KEYS.length} chaves disponíveis`);
  
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const apiKey = GEMINI_KEYS[i];
    console.log(`[validar-formatacao-gemini] Tentando chave ${i + 1}...`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 16000,
            },
          }),
        }
      );

      if (response.status === 429 || response.status === 503) {
        console.log(`[validar-formatacao-gemini] Chave ${i + 1} rate limited, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[validar-formatacao-gemini] Erro na chave ${i + 1}: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log(`[validar-formatacao-gemini] Sucesso com chave ${i + 1}`);
        return text;
      } else {
        console.log(`[validar-formatacao-gemini] Resposta vazia da chave ${i + 1}`);
        continue;
      }
    } catch (error) {
      console.error(`[validar-formatacao-gemini] Exceção na chave ${i + 1}:`, error);
      continue;
    }
  }
  
  throw new Error('Todas as chaves API Gemini esgotadas ou com erro');
}

// Função para detectar problemas de formatação nos artigos
function detectarProblemasFormatacao(artigos: any[]): { 
  artigosComProblemas: any[], 
  problemas: string[] 
} {
  const artigosComProblemas: any[] = [];
  const problemas: string[] = [];
  
  for (const artigo of artigos) {
    const texto = artigo.texto || '';
    let temProblema = false;
    
    // 1. Detectar reticências (texto incompleto)
    if (texto.includes('...') || texto.includes('…')) {
      temProblema = true;
      // Encontrar onde está a reticência
      const match = texto.match(/([IVXLCDM]+\s*[-–]\s*[^.…]*)[.…]{2,}/i) || 
                    texto.match(/(Art\.\s*\d+[º°]?[^.…]*)[.…]{2,}/i) ||
                    texto.match(/([§]\s*\d+[º°]?[^.…]*)[.…]{2,}/i);
      if (match) {
        problemas.push(`Texto truncado com reticências: "${match[1]}..."`);
      } else {
        problemas.push(`Artigo ${artigo.numero || artigo.ordem} contém texto truncado com reticências`);
      }
    }
    
    // 2. Detectar artigo com número separado do texto por quebra de linha
    // Ex: "Art. 2º\nPara os efeitos..." deveria ser "Art. 2º Para os efeitos..."
    const regexArtigoQuebrado = /^(Art\.?\s*\d+[º°]?(?:-[A-Z])?)\s*$/im;
    if (regexArtigoQuebrado.test(texto.split('\n')[0]?.trim() || '')) {
      temProblema = true;
      problemas.push(`Artigo ${artigo.numero || artigo.ordem} tem quebra de linha após o número`);
    }
    
    // 3. Detectar inciso/alínea com quebra de linha após o marcador
    const regexIncisoQuebrado = /^([IVXLCDM]+\s*[-–])\s*$/im;
    const regexAlineaQuebrada = /^([a-z]\))\s*$/im;
    if (regexIncisoQuebrado.test(texto) || regexAlineaQuebrada.test(texto)) {
      temProblema = true;
      problemas.push(`Inciso/alínea em ${artigo.numero || artigo.ordem} com texto em linha separada`);
    }
    
    if (temProblema) {
      artigosComProblemas.push({
        ...artigo,
        textoTruncado: texto.substring(0, 200)
      });
    }
  }
  
  return { artigosComProblemas, problemas };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoBruto, artigosExtraidos, temEmenta, tableName } = await req.json();

    if (!textoBruto || !artigosExtraidos) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[validar-formatacao-gemini] Iniciando validação para ${tableName}`);
    console.log(`[validar-formatacao-gemini] Artigos recebidos: ${artigosExtraidos.length}`);
    console.log(`[validar-formatacao-gemini] Texto bruto: ${textoBruto.length} caracteres`);

    // Detectar problemas de formatação antes de chamar IA
    const { artigosComProblemas, problemas: problemasDetectados } = detectarProblemasFormatacao(artigosExtraidos);
    console.log(`[validar-formatacao-gemini] Problemas detectados: ${problemasDetectados.length}`);
    
    if (artigosComProblemas.length > 0) {
      console.log(`[validar-formatacao-gemini] Artigos com problemas:`, artigosComProblemas.slice(0, 5).map(a => a.numero || a.ordem));
    }

    // Verificar estrutura atual
    const tiposExistentes = artigosExtraidos.map((a: any) => a.tipo);
    const temOrgao = tiposExistentes.includes('orgao');
    const temIdentificacao = tiposExistentes.includes('identificacao');
    const temEmentaAtual = tiposExistentes.includes('ementa');
    
    console.log(`[validar-formatacao-gemini] Estrutura: orgao=${temOrgao}, identificacao=${temIdentificacao}, ementa=${temEmentaAtual}`);

    if (GEMINI_KEYS.length === 0) {
      console.error('[validar-formatacao-gemini] Nenhuma chave GEMINI_KEY configurada');
      return new Response(JSON.stringify({ error: 'Nenhuma chave Gemini configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prompt para Gemini validar e corrigir
    const prompt = `Você é um especialista em formatação de leis brasileiras. Sua tarefa é validar e CORRIGIR problemas de formatação.

TEXTO BRUTO DA LEI (para referência e correção):
${textoBruto.substring(0, 30000)}

ARTIGOS EXTRAÍDOS COM PROBLEMAS DETECTADOS:
${artigosComProblemas.length > 0 ? JSON.stringify(artigosComProblemas.slice(0, 20), null, 2) : 'Nenhum problema detectado automaticamente'}

PROBLEMAS DETECTADOS AUTOMATICAMENTE:
${problemasDetectados.length > 0 ? problemasDetectados.join('\n') : 'Nenhum'}

TODOS OS ARTIGOS (primeiros 30):
${JSON.stringify(artigosExtraidos.slice(0, 30).map((a: any) => ({ 
  ordem: a.ordem,
  tipo: a.tipo, 
  numero: a.numero, 
  texto: a.texto.substring(0, 300) 
})), null, 2)}

REGRAS DE VALIDAÇÃO E CORREÇÃO:

1. RETICÊNCIAS (TEXTO TRUNCADO):
   - Se um artigo, inciso ou alínea termina com "..." ou "…", o texto está INCOMPLETO
   - Você DEVE buscar o texto completo no TEXTO BRUTO e corrigir
   - Exemplo errado: "V - armador de pesc..."
   - Exemplo correto: "V - armador de pescado: pessoa física ou jurídica que..."

2. QUEBRA DE LINHA ENTRE NÚMERO E TEXTO:
   - O número do artigo e seu texto devem estar na MESMA LINHA
   - Exemplo errado: "Art. 2º\\nPara os efeitos desta Lei..."
   - Exemplo correto: "Art. 2º Para os efeitos desta Lei..."
   - O mesmo vale para incisos e alíneas

3. ESTRUTURA OBRIGATÓRIA:
   - Cabeçalho institucional (orgao): ${temOrgao ? 'OK' : 'FALTANDO'}
   - Identificação da lei: ${temIdentificacao ? 'OK' : 'FALTANDO'}
   - Ementa: ${temEmentaAtual ? 'OK' : 'FALTANDO'}

TAREFA:
1. Corrija TODOS os artigos com reticências buscando o texto completo no texto bruto
2. Corrija TODAS as quebras de linha incorretas
3. Adicione elementos estruturais faltantes
4. Retorne APENAS um JSON válido

FORMATO DE RESPOSTA (JSON puro, sem markdown):
{
  "artigosCorrigidos": [
    {"ordem": 5, "textoCorrigido": "Texto completo e correto do artigo"},
    {"ordem": 12, "textoCorrigido": "V - armador de pescado: pessoa física ou jurídica que..."}
  ],
  "elementosFaltantes": [
    {"tipo": "orgao", "texto": "Presidência da República\\nCasa Civil", "ordem": 0}
  ],
  "problemas": ["Lista de problemas encontrados e se foram corrigidos"],
  "resumoValidacao": "Resumo do que foi corrigido"
}

IMPORTANTE: 
- Para artigosCorrigidos, use a "ordem" do artigo original para identificá-lo
- O "textoCorrigido" deve conter o texto COMPLETO e correto
- Se não houver problemas, retorne arrays vazios`;

    console.log('[validar-formatacao-gemini] Chamando Gemini para validação...');
    
    const content = await chamarGeminiComFallback(prompt);
    console.log('[validar-formatacao-gemini] Resposta Gemini:', content.substring(0, 500));

    // Extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[validar-formatacao-gemini] JSON não encontrado na resposta');
      return new Response(JSON.stringify({ 
        artigos: artigosExtraidos,
        problemas: problemasDetectados,
        mensagem: 'Problemas detectados mas não foi possível corrigir automaticamente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const resultado = JSON.parse(jsonMatch[0]);
    console.log('[validar-formatacao-gemini] Artigos corrigidos:', resultado.artigosCorrigidos?.length || 0);
    console.log('[validar-formatacao-gemini] Elementos faltantes:', resultado.elementosFaltantes?.length || 0);

    // Aplicar correções aos artigos
    let artigos = [...artigosExtraidos];
    let artigosCorrigidosCount = 0;
    
    // Aplicar correções de texto
    if (resultado.artigosCorrigidos && resultado.artigosCorrigidos.length > 0) {
      for (const correcao of resultado.artigosCorrigidos) {
        const idx = artigos.findIndex((a: any) => a.ordem === correcao.ordem);
        if (idx !== -1 && correcao.textoCorrigido) {
          console.log(`[validar-formatacao-gemini] Corrigindo artigo ordem ${correcao.ordem}`);
          artigos[idx] = {
            ...artigos[idx],
            texto: correcao.textoCorrigido
          };
          artigosCorrigidosCount++;
        }
      }
    }

    // Adicionar elementos faltantes
    let ementaAdicionada = false;
    let elementosAdicionados = 0;

    if (resultado.elementosFaltantes && resultado.elementosFaltantes.length > 0) {
      for (const elemento of resultado.elementosFaltantes) {
        const jaExiste = artigos.some((a: any) => a.tipo === elemento.tipo);
        if (!jaExiste && elemento.texto) {
          artigos.push({
            numero: '',
            texto: elemento.texto,
            ordem: elemento.ordem || 0,
            tipo: elemento.tipo
          });
          elementosAdicionados++;
          if (elemento.tipo === 'ementa') ementaAdicionada = true;
        }
      }

      // Reordenar
      const ordemTipos: Record<string, number> = {
        'orgao': 0,
        'identificacao': 1,
        'ementa': 2,
        'preambulo': 3,
        'capitulo': 4,
        'secao': 5,
        'subsecao': 6,
        'artigo': 7,
        'data': 100,
        'assinatura': 101
      };

      artigos.sort((a: any, b: any) => {
        const ordemA = ordemTipos[a.tipo] ?? 50;
        const ordemB = ordemTipos[b.tipo] ?? 50;
        if (ordemA !== ordemB) return ordemA - ordemB;
        return (a.ordem || 0) - (b.ordem || 0);
      });

      artigos.forEach((a: any, i: number) => a.ordem = i + 1);
    }

    // Combinar problemas detectados com problemas do Gemini
    const todosProblemas = [
      ...problemasDetectados,
      ...(resultado.problemas || [])
    ];

    const mensagem = artigosCorrigidosCount > 0 || elementosAdicionados > 0
      ? `${artigosCorrigidosCount} artigo(s) corrigido(s), ${elementosAdicionados} elemento(s) adicionado(s)` 
      : resultado.resumoValidacao || 'Estrutura validada';

    console.log('[validar-formatacao-gemini] Concluído:', mensagem);

    return new Response(JSON.stringify({
      artigos,
      ementaAdicionada,
      artigosCorrigidos: artigosCorrigidosCount + elementosAdicionados,
      problemas: todosProblemas,
      mensagem
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('[validar-formatacao-gemini] Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
