import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, area, tema, dificuldade, conteudo } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar cache primeiro
    const { data: cached } = await supabase
      .from('jogos_juridicos')
      .select('*')
      .eq('tipo', tipo)
      .eq('area', area)
      .eq('tema', tema)
      .eq('dificuldade', dificuldade)
      .gt('cache_validade', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      console.log('Jogo encontrado no cache');
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Gerar novo jogo com Gemini
    console.log(`Gerando novo jogo: ${tipo} - ${area} - ${tema}`);
    
    const direitoPremiumKey = Deno.env.get('DIREITO_PREMIUM_API_KEY');
    if (!direitoPremiumKey) {
      throw new Error('DIREITO_PREMIUM_API_KEY não configurada');
    }

    const prompt = gerarPrompt(tipo, dificuldade, area, tema, conteudo);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${direitoPremiumKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
          text: `Você é um gerador de jogos educativos jurídicos. 

CRÍTICO: Retorne APENAS JSON válido, sem nenhum texto adicional antes ou depois.
- Use APENAS aspas duplas (")
- NÃO use aspas simples (')
- NÃO inclua comentários
- NÃO inclua trailing commas
- Certifique-se de que todas as propriedades estejam entre aspas duplas

${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Gemini:', response.status, errorText);
      throw new Error(`Erro ao gerar jogo: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('Conteúdo não gerado pela API');
    }

    console.log('Conteúdo bruto recebido:', content.substring(0, 200));

    // Extrair JSON do conteúdo (pode vir com ```json ou ```markdown)
    let jsonContent = content.trim();
    
    // Remover blocos de código markdown
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    }

    // Limpar possíveis caracteres inválidos
    jsonContent = jsonContent
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
      .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
    
    console.log('JSON limpo (primeiros 300 chars):', jsonContent.substring(0, 300));
    
    let dadosJogo;
    try {
      dadosJogo = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.error('JSON que causou erro:', jsonContent);
      throw new Error(`JSON inválido retornado pela API: ${parseError instanceof Error ? parseError.message : 'erro desconhecido'}`);
    }

    // Salvar no cache
    const { data: novoJogo, error } = await supabase
      .from('jogos_juridicos')
      .insert({
        tipo,
        area,
        tema,
        dificuldade,
        dados_jogo: dadosJogo,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar jogo:', error);
      throw error;
    }

    console.log('Jogo gerado e salvo com sucesso');
    return new Response(JSON.stringify(novoJogo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function gerarPrompt(tipo: string, dificuldade: string, area: string, tema: string, conteudo: string): string {
  const basePrompt = `Baseado no tema "${tema}" da área "${area}":\n\n${conteudo}\n\n`;
  
  switch (tipo) {
    case 'forca':
      return basePrompt + `Crie 10 palavras para o jogo da forca, organizadas em níveis progressivos de dificuldade ${dificuldade}. 
  
Retorne JSON com:
{
  "opcoes": [
    {
      "palavra": "PALAVRA_SECRETA",
      "dica": "Dica clara e objetiva",
      "exemplo": "Exemplo de uso no contexto jurídico",
      "categoria": "Categoria específica"
    }
    // ... mais 9 palavras
  ]
}

REGRAS DE PROGRESSÃO:
- Palavras 1-3 (Nível Iniciante): 4-6 letras, termos básicos, dicas muito claras
- Palavras 4-7 (Nível Intermediário): 7-10 letras, termos moderados, dicas moderadas
- Palavras 8-10 (Nível Avançado): 11+ letras, termos complexos, dicas sutis
- Todas as palavras do tema "${tema}" em "${area}"
- Palavras progressivamente mais difíceis e educativas
`;

    case 'cruzadas':
      return basePrompt + `Crie 12 palavras jurídicas do tema "${tema}" em "${area}".

Retorne JSON com:
{
  "palavras": [
    {
      "palavra": "PALAVRA",
      "dica": "Definição jurídica clara e objetiva"
    }
  ]
}

REGRAS CRÍTICAS:
- TODAS as palavras DEVEM ser termos, conceitos, institutos ou princípios JURÍDICOS
- Mínimo 4 letras, máximo 15 letras
- 12 palavras no total
- Palavras progressivamente mais complexas (começar com termos simples, terminar com complexos)
- Dicas claras e educativas sobre o significado jurídico
- Exemplo de termos jurídicos válidos: RECURSO, SENTENCA, EMBARGO, HABEAS CORPUS, PRECEDENTE
- NUNCA usar palavras genéricas como "LEGAL", "FLORA", "FAUNA" etc.
`;

    case 'caca_palavras':
      return basePrompt + `Crie APENAS termos jurídicos do tema "${tema}" em "${area}" para caça-palavras com 5 níveis.

Retorne JSON com:
{
  "niveis": [
    {
      "nivel": 1,
      "palavras": ["TERMO1", "TERMO2", "TERMO3"]
    }
  ]
}

REGRAS CRÍTICAS - LEIA COM ATENÇÃO:
- TODAS as palavras DEVEM ser termos JURÍDICOS específicos do Direito
- Nível 1: 3 palavras jurídicas (4-6 letras) - ex: LEI, ATO, REU
- Nível 2: 4 palavras jurídicas (7-8 letras) - ex: RECURSO, SENTENCA
- Nível 3: 5 palavras jurídicas (9-10 letras) - ex: JURISPRUDENCIA
- Nível 4: 6 palavras jurídicas (11-12 letras) - ex: CONSTITUCIONAL
- Nível 5: 8 palavras jurídicas (13+ letras) - ex: ADMINISTRATIVO
- Exemplo para Direito Ambiental: LICENCA, FISCALIZACAO, SNUC, IBAMA, BIODIVERSIDADE
- PROIBIDO usar palavras genéricas não jurídicas como FLORA, FAUNA, LEGAL, VERDE, NATUREZA
- Foco em institutos, leis, órgãos, princípios e conceitos do Direito ${area}
`;

    case 'stop':
      return basePrompt + `Crie 6 categorias JURÍDICAS específicas para o jogo Stop sobre "${tema}" em "${area}".

Retorne JSON com:
{
  "categorias": [
    {
      "nome": "Nome da Categoria Jurídica",
      "exemplos": ["EXEMPLO1", "EXEMPLO2", "EXEMPLO3"]
    }
  ]
}

REGRAS:
- 6 categorias relacionadas ESPECIFICAMENTE ao Direito ${area} e tema ${tema}
- 3 exemplos por categoria (palavras maiúsculas, termos jurídicos)
- Categorias sugeridas: Leis/Códigos, Crimes/Infrações, Princípios, Institutos Jurídicos, Órgãos Públicos, Direitos/Deveres
- Exemplos DEVEM ser termos jurídicos reais e aplicáveis
`;

    default:
      throw new Error('Tipo de jogo inválido');
  }
}