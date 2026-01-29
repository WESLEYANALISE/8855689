import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista de ministros do STJ
const ministrosSTJ = [
  { nome: "Maria Thereza de Assis Moura", cargo: "Presidente do STJ" },
  { nome: "Luis Felipe Salomão", cargo: "Vice-Presidente do STJ" },
  { nome: "Humberto Martins", cargo: "Corregedor Nacional de Justiça" },
  { nome: "Herman Benjamin", cargo: "Ministro" },
  { nome: "Mauro Campbell Marques", cargo: "Ministro" },
  { nome: "Benedito Gonçalves", cargo: "Ministro" },
  { nome: "Raul Araújo", cargo: "Ministro" },
  { nome: "Paulo de Tarso Sanseverino", cargo: "Ministro" },
  { nome: "Maria Isabel Gallotti", cargo: "Ministra" },
  { nome: "Antonio Carlos Ferreira", cargo: "Ministro" },
  { nome: "Ricardo Villas Bôas Cueva", cargo: "Ministro" },
  { nome: "Sebastião Reis Júnior", cargo: "Ministro" },
  { nome: "Marco Aurélio Bellizze", cargo: "Ministro" },
  { nome: "Assusete Magalhães", cargo: "Ministra" },
  { nome: "Sérgio Kukina", cargo: "Ministro" },
  { nome: "Regina Helena Costa", cargo: "Ministra" },
  { nome: "Rogerio Schietti Cruz", cargo: "Ministro" },
  { nome: "Gurgel de Faria", cargo: "Ministro" },
  { nome: "Ribeiro Dantas", cargo: "Ministro" },
  { nome: "Joel Ilan Paciornik", cargo: "Ministro" },
  { nome: "Nancy Andrighi", cargo: "Ministra" },
  { nome: "Laurita Vaz", cargo: "Ministra" },
  { nome: "João Otávio de Noronha", cargo: "Ministro" },
  { nome: "Francisco Falcão", cargo: "Ministro" },
  { nome: "Og Fernandes", cargo: "Ministro" },
  { nome: "Reynaldo Soares da Fonseca", cargo: "Ministro" },
  { nome: "Marcelo Navarro Ribeiro Dantas", cargo: "Ministro" },
  { nome: "Antonio Saldanha Palheiro", cargo: "Ministro" },
  { nome: "Moura Ribeiro", cargo: "Ministro" },
  { nome: "Marco Buzzi", cargo: "Ministro" },
  { nome: "Messod Azulay Neto", cargo: "Ministro" },
  { nome: "Daniela Teixeira", cargo: "Ministra" },
  { nome: "Teodoro Silva Santos", cargo: "Ministro" }
];

// Lista de membros do Executivo Federal
const membrosPresidencia = [
  { nome: "Luiz Inácio Lula da Silva", cargo: "Presidente da República" },
  { nome: "Geraldo Alckmin", cargo: "Vice-Presidente da República" },
  { nome: "Rui Costa", cargo: "Ministro da Casa Civil" },
  { nome: "José Múcio Monteiro", cargo: "Ministro da Defesa" },
  { nome: "Fernando Haddad", cargo: "Ministro da Fazenda" },
  { nome: "Flávio Dino", cargo: "Ex-Ministro da Justiça (agora STF)" },
  { nome: "Ricardo Lewandowski", cargo: "Ministro da Justiça e Segurança Pública" },
  { nome: "Mauro Vieira", cargo: "Ministro das Relações Exteriores" },
  { nome: "Camilo Santana", cargo: "Ministro da Educação" },
  { nome: "Nísia Trindade", cargo: "Ministra da Saúde" },
  { nome: "Luiz Marinho", cargo: "Ministro do Trabalho e Emprego" },
  { nome: "Carlos Fávaro", cargo: "Ministro da Agricultura" },
  { nome: "Simone Tebet", cargo: "Ministra do Planejamento" },
  { nome: "Alexandre Silveira", cargo: "Ministro de Minas e Energia" },
  { nome: "Marina Silva", cargo: "Ministra do Meio Ambiente" },
  { nome: "Cida Gonçalves", cargo: "Ministra das Mulheres" },
  { nome: "Anielle Franco", cargo: "Ministra da Igualdade Racial" },
  { nome: "Silvio Almeida", cargo: "Ex-Ministro dos Direitos Humanos" },
  { nome: "Paulo Pimenta", cargo: "Ministro da SECOM" },
  { nome: "Márcio Macêdo", cargo: "Ministro da Secretaria-Geral" },
  { nome: "Wellington Dias", cargo: "Ministro do Desenvolvimento Social" },
  { nome: "Juscelino Filho", cargo: "Ministro das Comunicações" },
  { nome: "Renan Filho", cargo: "Ministro dos Transportes" },
  { nome: "Jader Filho", cargo: "Ministro das Cidades" },
  { nome: "Waldez Góes", cargo: "Ministro da Integração e Desenvolvimento Regional" },
  { nome: "Celso Sabino", cargo: "Ministro do Turismo" },
  { nome: "Margareth Menezes", cargo: "Ministra da Cultura" },
  { nome: "André Fufuca", cargo: "Ministro do Esporte" },
  { nome: "Luciana Santos", cargo: "Ministra da Ciência e Tecnologia" },
  { nome: "Sônia Guajajara", cargo: "Ministra dos Povos Indígenas" },
  { nome: "Paulo Teixeira", cargo: "Ministro do Desenvolvimento Agrário" },
  { nome: "Geraldo Alckmin", cargo: "Ministro da Indústria e Comércio (interino)" },
  { nome: "Esther Dweck", cargo: "Ministra da Gestão e Inovação" },
  { nome: "Jorge Messias", cargo: "Advogado-Geral da União" },
  { nome: "Bruno Dantas", cargo: "Presidente do TCU" },
  { nome: "Paulo Gonet", cargo: "Procurador-Geral da República" }
];

async function buscarWikipedia(nome: string): Promise<{ resumo: string; foto: string | null }> {
  try {
    // Buscar na Wikipedia em português
    const searchUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nome)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      // Tentar busca alternativa
      const searchApiUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(nome)}&format=json`;
      const searchResponse = await fetch(searchApiUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.query?.search?.[0]) {
        const title = searchData.query.search[0].title;
        const summaryUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const summaryResponse = await fetch(summaryUrl);
        
        if (summaryResponse.ok) {
          const data = await summaryResponse.json();
          return {
            resumo: data.extract || "",
            foto: data.thumbnail?.source || data.originalimage?.source || null
          };
        }
      }
      return { resumo: "", foto: null };
    }
    
    const data = await response.json();
    return {
      resumo: data.extract || "",
      foto: data.thumbnail?.source || data.originalimage?.source || null
    };
  } catch (error) {
    console.error(`Erro ao buscar Wikipedia para ${nome}:`, error);
    return { resumo: "", foto: null };
  }
}

async function gerarBiografiaGemini(nome: string, cargo: string, resumoWikipedia: string, geminiKey: string): Promise<{ biografia: string; formacao: string; carreira: string }> {
  try {
    const prompt = `Você é um especialista em direito e política brasileira. Com base nas informações disponíveis, gere uma biografia profissional para:

Nome: ${nome}
Cargo: ${cargo}
Informações da Wikipedia: ${resumoWikipedia || "Não disponível"}

Retorne um JSON com exatamente este formato (sem markdown, apenas o JSON puro):
{
  "biografia": "Uma biografia concisa de 2-3 parágrafos sobre a pessoa, focando em sua trajetória profissional e conquistas.",
  "formacao": "Formação acadêmica conhecida (graduação, pós-graduação, mestrado, doutorado). Se não houver informação, coloque 'Informação não disponível'.",
  "carreira": "Principais cargos e funções exercidos ao longo da carreira, em formato de lista separada por quebras de linha."
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Limpar e parsear JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        biografia: parsed.biografia || "",
        formacao: parsed.formacao || "",
        carreira: parsed.carreira || ""
      };
    }
    
    return { biografia: "", formacao: "", carreira: "" };
  } catch (error) {
    console.error(`Erro ao gerar biografia Gemini para ${nome}:`, error);
    return { biografia: resumoWikipedia, formacao: "", carreira: "" };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instituicao, forceRefresh = false, limite = 10 } = await req.json();
    
    console.log(`Populando membros para instituição: ${instituicao}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiKey = Deno.env.get('GEMINI_KEY_1')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let listaMembros: { nome: string; cargo: string }[] = [];
    
    if (instituicao === 'stj') {
      listaMembros = ministrosSTJ;
    } else if (instituicao === 'presidencia') {
      listaMembros = membrosPresidencia;
    } else {
      return new Response(
        JSON.stringify({ error: "Instituição não suportada. Use 'stj' ou 'presidencia'." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar membros já existentes
    const { data: existentes } = await supabase
      .from('aprofundamento_membros')
      .select('nome')
      .eq('instituicao', instituicao);

    const nomesExistentes = new Set(existentes?.map(m => m.nome) || []);
    
    // Filtrar apenas os que precisam ser adicionados
    const membrosParaAdicionar = forceRefresh 
      ? listaMembros.slice(0, limite)
      : listaMembros.filter(m => !nomesExistentes.has(m.nome)).slice(0, limite);

    console.log(`${membrosParaAdicionar.length} membros para processar`);

    const resultados = [];

    for (let i = 0; i < membrosParaAdicionar.length; i++) {
      const membro = membrosParaAdicionar[i];
      console.log(`[${i + 1}/${membrosParaAdicionar.length}] Processando: ${membro.nome}`);

      // Buscar na Wikipedia
      const { resumo, foto } = await buscarWikipedia(membro.nome);
      console.log(`  Wikipedia: ${resumo ? 'Encontrado' : 'Não encontrado'}, Foto: ${foto ? 'Sim' : 'Não'}`);

      // Gerar biografia com Gemini
      const { biografia, formacao, carreira } = await gerarBiografiaGemini(
        membro.nome, 
        membro.cargo, 
        resumo, 
        geminiKey
      );

      // Inserir ou atualizar no banco
      const dadosMembro = {
        nome: membro.nome,
        nome_completo: membro.nome,
        cargo: membro.cargo,
        instituicao: instituicao,
        foto_url: foto,
        foto_wikipedia: foto,
        biografia: biografia || resumo,
        formacao: formacao,
        ativo: true,
        ordem: i + 1
      };

      const { error } = await supabase
        .from('aprofundamento_membros')
        .upsert(dadosMembro, { onConflict: 'nome,instituicao' });

      if (error) {
        console.error(`  Erro ao salvar ${membro.nome}:`, error);
      } else {
        console.log(`  ✓ Salvo com sucesso`);
        resultados.push(membro.nome);
      }

      // Delay para não sobrecarregar APIs
      if (i < membrosParaAdicionar.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        instituicao,
        processados: resultados.length,
        membros: resultados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
