import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TCCResult {
  titulo: string;
  autor: string;
  ano: number | null;
  instituicao: string;
  tipo: 'tcc' | 'dissertacao' | 'tese';
  area_direito: string | null;
  link_acesso: string;
  resumo_original: string | null;
  fonte: string;
  relevancia: 'alta' | 'media' | 'baixa';
}

const AREAS_DIREITO = [
  'constitucional', 'administrativo', 'civil', 'penal', 'trabalhista',
  'tributário', 'ambiental', 'empresarial', 'processual civil', 'processual penal',
  'internacional', 'digital', 'consumidor', 'família', 'previdenciário'
];

function classificarArea(texto: string): string | null {
  const textoLower = texto.toLowerCase();
  
  const mapeamento: Record<string, string[]> = {
    'constitucional': ['constitucional', 'constituição', 'direitos fundamentais', 'controle de constitucionalidade'],
    'administrativo': ['administrativo', 'administração pública', 'licitação', 'servidor público'],
    'civil': ['civil', 'contratos', 'responsabilidade civil', 'obrigações', 'propriedade'],
    'penal': ['penal', 'crime', 'criminoso', 'pena', 'prisão', 'delito'],
    'trabalhista': ['trabalhista', 'trabalho', 'emprego', 'clt', 'trabalhador'],
    'tributário': ['tributário', 'tributo', 'imposto', 'fiscal', 'icms', 'irpf'],
    'ambiental': ['ambiental', 'meio ambiente', 'sustentabilidade', 'ecológico'],
    'empresarial': ['empresarial', 'empresa', 'societário', 'falência', 'recuperação judicial'],
    'processual civil': ['processo civil', 'processual civil', 'cpc', 'ação civil'],
    'processual penal': ['processo penal', 'processual penal', 'cpp', 'ação penal'],
    'internacional': ['internacional', 'tratado', 'direito das gentes'],
    'digital': ['digital', 'lgpd', 'internet', 'dados pessoais', 'cibernético', 'tecnologia'],
    'consumidor': ['consumidor', 'cdc', 'relação de consumo'],
    'família': ['família', 'casamento', 'divórcio', 'guarda', 'alimentos', 'sucessões'],
    'previdenciário': ['previdenciário', 'previdência', 'inss', 'aposentadoria', 'benefício']
  };
  
  for (const [area, termos] of Object.entries(mapeamento)) {
    for (const termo of termos) {
      if (textoLower.includes(termo)) {
        return area;
      }
    }
  }
  
  return null;
}

function classificarTipo(texto: string): 'tcc' | 'dissertacao' | 'tese' {
  const textoLower = texto.toLowerCase();
  if (textoLower.includes('tese') || textoLower.includes('doutorado')) return 'tese';
  if (textoLower.includes('dissertação') || textoLower.includes('mestrado')) return 'dissertacao';
  return 'tcc';
}

function calcularRelevancia(titulo: string, palavraChave: string): 'alta' | 'media' | 'baixa' {
  const tituloLower = titulo.toLowerCase();
  const palavraLower = palavraChave.toLowerCase();
  
  if (tituloLower.includes(palavraLower)) return 'alta';
  
  const palavras = palavraLower.split(' ');
  const matches = palavras.filter(p => tituloLower.includes(p)).length;
  
  if (matches >= palavras.length * 0.5) return 'media';
  return 'baixa';
}

async function buscarBDTD(
  palavraChave: string,
  tipo: string | null,
  areaDireito: string | null,
  ano: number | null,
  firecrawlApiKey: string
): Promise<TCCResult[]> {
  const resultados: TCCResult[] = [];
  
  try {
    // Construir query de busca
    let query = `${palavraChave} Direito`;
    if (areaDireito) query += ` ${areaDireito}`;
    if (tipo === 'tcc') query += ' TCC "trabalho de conclusão"';
    if (tipo === 'dissertacao') query += ' dissertação mestrado';
    if (tipo === 'tese') query += ' tese doutorado';
    
    const bdtdUrl = `https://bdtd.ibict.br/vufind/Search/Results?lookfor=${encodeURIComponent(query)}&type=AllFields&limit=20`;
    
    console.log("Buscando BDTD:", bdtdUrl);
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: bdtdUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    
    if (!response.ok) {
      console.error("Erro BDTD:", await response.text());
      return resultados;
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || "";
    
    // Parsing simplificado do markdown
    const linhas = markdown.split('\n');
    let tccAtual: Partial<TCCResult> | null = null;
    
    for (const linha of linhas) {
      // Detectar título (geralmente em negrito ou como link)
      if (linha.includes('[') && linha.includes('](')) {
        const matchTitulo = linha.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (matchTitulo) {
          // Salvar TCC anterior se existir
          if (tccAtual && tccAtual.titulo) {
            resultados.push({
              titulo: tccAtual.titulo,
              autor: tccAtual.autor || 'Autor não identificado',
              ano: tccAtual.ano || null,
              instituicao: tccAtual.instituicao || 'Instituição não identificada',
              tipo: classificarTipo(tccAtual.titulo),
              area_direito: classificarArea(tccAtual.titulo) || areaDireito,
              link_acesso: tccAtual.link_acesso || '',
              resumo_original: tccAtual.resumo_original || null,
              fonte: 'bdtd',
              relevancia: calcularRelevancia(tccAtual.titulo, palavraChave),
            });
          }
          
          tccAtual = {
            titulo: matchTitulo[1].trim(),
            link_acesso: matchTitulo[2],
          };
        }
      }
      
      // Detectar autor - múltiplos padrões
      if (!tccAtual?.autor || tccAtual.autor === 'Autor não identificado') {
        // Padrões comuns em repositórios brasileiros
        const padroesAutor = [
          /(?:autor(?:a)?(?:\s+principal)?|autoria|by|escrito\s+por|por):?\s*:?\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)/i,
          /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,4})\s*[-–]\s*/,
          /^([A-ZÀ-Ú][a-zà-ú]+,\s*[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/,
          /\|\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)\s*\|/,
        ];
        
        for (const padrao of padroesAutor) {
          const matchAutor = linha.match(padrao);
          if (matchAutor && tccAtual) {
            const autorLimpo = matchAutor[1].trim()
              .replace(/\s+/g, ' ')
              .replace(/[*_#\[\]]/g, '');
            // Validar que parece um nome (2-5 palavras, começa com maiúscula)
            const palavras = autorLimpo.split(' ');
            if (palavras.length >= 2 && palavras.length <= 5 && /^[A-ZÀ-Ú]/.test(autorLimpo)) {
              tccAtual.autor = autorLimpo;
              break;
            }
          }
        }
      }
      
      // Detectar ano
      const matchAno = linha.match(/\b(19|20)\d{2}\b/);
      if (matchAno && tccAtual && !tccAtual.ano) {
        const anoNum = parseInt(matchAno[0]);
        if (anoNum >= 1990 && anoNum <= new Date().getFullYear()) {
          tccAtual.ano = anoNum;
        }
      }
      
      // Detectar instituição (nomes de universidades)
      if (linha.match(/universidade|faculdade|instituto|usp|unicamp|ufrj|ufmg|puc|fgv/i)) {
        const matchInst = linha.match(/(Universidade[^,.\n]+|Faculdade[^,.\n]+|Instituto[^,.\n]+|USP|UNICAMP|UFRJ|UFMG|PUC[^,.\n]*|FGV[^,.\n]*)/i);
        if (matchInst && tccAtual) {
          tccAtual.instituicao = matchInst[1].trim();
        }
      }
    }
    
    // Salvar último TCC
    if (tccAtual && tccAtual.titulo) {
      resultados.push({
        titulo: tccAtual.titulo,
        autor: tccAtual.autor || 'Autor não identificado',
        ano: tccAtual.ano || null,
        instituicao: tccAtual.instituicao || 'Instituição não identificada',
        tipo: classificarTipo(tccAtual.titulo),
        area_direito: classificarArea(tccAtual.titulo) || areaDireito,
        link_acesso: tccAtual.link_acesso || '',
        resumo_original: tccAtual.resumo_original || null,
        fonte: 'bdtd',
        relevancia: calcularRelevancia(tccAtual.titulo, palavraChave),
      });
    }
    
  } catch (error) {
    console.error("Erro ao buscar BDTD:", error);
  }
  
  return resultados;
}

async function buscarOASISBR(
  palavraChave: string,
  tipo: string | null,
  areaDireito: string | null,
  ano: number | null,
  firecrawlApiKey: string
): Promise<TCCResult[]> {
  const resultados: TCCResult[] = [];
  
  try {
    // Construir query para OASIS BR
    let query = `${palavraChave} Direito`;
    if (areaDireito) query += ` ${areaDireito}`;
    
    // Filtrar por tipo de trabalho
    let tipoFiltro = '';
    if (tipo === 'tcc') tipoFiltro = 'bachelorThesis';
    if (tipo === 'dissertacao') tipoFiltro = 'masterThesis';
    if (tipo === 'tese') tipoFiltro = 'doctoralThesis';
    
    const oasisUrl = `https://oasisbr.ibict.br/vufind/Search/Results?lookfor=${encodeURIComponent(query)}&type=AllFields&limit=20${tipoFiltro ? `&filter[]=format:"${tipoFiltro}"` : ''}`;
    
    console.log("Buscando OASIS BR:", oasisUrl);
    
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: oasisUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    
    if (!response.ok) {
      console.error("Erro OASIS:", await response.text());
      return resultados;
    }
    
    const data = await response.json();
    const markdown = data.data?.markdown || "";
    
    // Parsing similar ao BDTD
    const linhas = markdown.split('\n');
    let tccAtual: Partial<TCCResult> | null = null;
    
    for (const linha of linhas) {
      if (linha.includes('[') && linha.includes('](')) {
        const matchTitulo = linha.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (matchTitulo) {
          if (tccAtual && tccAtual.titulo) {
            resultados.push({
              titulo: tccAtual.titulo,
              autor: tccAtual.autor || 'Autor não identificado',
              ano: tccAtual.ano || null,
              instituicao: tccAtual.instituicao || 'Instituição não identificada',
              tipo: classificarTipo(tccAtual.titulo),
              area_direito: classificarArea(tccAtual.titulo) || areaDireito,
              link_acesso: tccAtual.link_acesso || '',
              resumo_original: tccAtual.resumo_original || null,
              fonte: 'oasisbr',
              relevancia: calcularRelevancia(tccAtual.titulo, palavraChave),
            });
          }
          
          tccAtual = {
            titulo: matchTitulo[1].trim(),
            link_acesso: matchTitulo[2],
          };
        }
      }
      
      // Detectar autor - múltiplos padrões
      if (!tccAtual?.autor || tccAtual.autor === 'Autor não identificado') {
        const padroesAutor = [
          /(?:autor(?:a)?(?:\s+principal)?|autoria|by|escrito\s+por|por):?\s*:?\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)/i,
          /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){1,4})\s*[-–]\s*/,
          /^([A-ZÀ-Ú][a-zà-ú]+,\s*[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/,
          /\|\s*([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)\s*\|/,
        ];
        
        for (const padrao of padroesAutor) {
          const matchAutor = linha.match(padrao);
          if (matchAutor && tccAtual) {
            const autorLimpo = matchAutor[1].trim()
              .replace(/\s+/g, ' ')
              .replace(/[*_#\[\]]/g, '');
            const palavras = autorLimpo.split(' ');
            if (palavras.length >= 2 && palavras.length <= 5 && /^[A-ZÀ-Ú]/.test(autorLimpo)) {
              tccAtual.autor = autorLimpo;
              break;
            }
          }
        }
      }
      
      // Detectar ano
      const matchAno = linha.match(/\b(19|20)\d{2}\b/);
      if (matchAno && tccAtual && !tccAtual.ano) {
        const anoNum = parseInt(matchAno[0]);
        if (anoNum >= 1990 && anoNum <= new Date().getFullYear()) {
          tccAtual.ano = anoNum;
        }
      }
      
      // Detectar instituição
      if (linha.match(/universidade|faculdade|instituto|usp|unicamp|ufrj|ufmg|puc|fgv/i)) {
        const matchInst = linha.match(/(Universidade[^,.\n]+|Faculdade[^,.\n]+|Instituto[^,.\n]+|USP|UNICAMP|UFRJ|UFMG|PUC[^,.\n]*|FGV[^,.\n]*)/i);
        if (matchInst && tccAtual) {
          tccAtual.instituicao = matchInst[1].trim();
        }
      }
    }
    
    // Salvar último TCC
    if (tccAtual && tccAtual.titulo) {
      resultados.push({
        titulo: tccAtual.titulo,
        autor: tccAtual.autor || 'Autor não identificado',
        ano: tccAtual.ano || null,
        instituicao: tccAtual.instituicao || 'Instituição não identificada',
        tipo: classificarTipo(tccAtual.titulo),
        area_direito: classificarArea(tccAtual.titulo) || areaDireito,
        link_acesso: tccAtual.link_acesso || '',
        resumo_original: tccAtual.resumo_original || null,
        fonte: 'oasisbr',
        relevancia: calcularRelevancia(tccAtual.titulo, palavraChave),
      });
    }
    
  } catch (error) {
    console.error("Erro ao buscar OASIS BR:", error);
  }
  
  return resultados;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { palavraChave, tipo, areaDireito, ano, instituicao, pagina = 1 } = await req.json();
    
    if (!palavraChave || palavraChave.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Palavra-chave deve ter pelo menos 3 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Buscando TCCs: "${palavraChave}", tipo: ${tipo}, área: ${areaDireito}, ano: ${ano}`);
    
    // Buscar em paralelo nas duas fontes
    const [resultadosBDTD, resultadosOASIS] = await Promise.all([
      buscarBDTD(palavraChave, tipo, areaDireito, ano, firecrawlApiKey),
      buscarOASISBR(palavraChave, tipo, areaDireito, ano, firecrawlApiKey),
    ]);
    
    // Combinar resultados
    let todosResultados = [...resultadosBDTD, ...resultadosOASIS];
    
    // Filtrar por ano se especificado
    if (ano) {
      todosResultados = todosResultados.filter(r => r.ano === ano || r.ano === null);
    }
    
    // Filtrar por instituição se especificado
    if (instituicao) {
      todosResultados = todosResultados.filter(r => 
        r.instituicao.toLowerCase().includes(instituicao.toLowerCase())
      );
    }
    
    // Remover duplicatas por título similar
    const titulosVistos = new Set<string>();
    todosResultados = todosResultados.filter(r => {
      const tituloNorm = r.titulo.toLowerCase().substring(0, 50);
      if (titulosVistos.has(tituloNorm)) return false;
      titulosVistos.add(tituloNorm);
      return true;
    });
    
    // Ordenar por relevância
    todosResultados.sort((a, b) => {
      const ordem = { alta: 0, media: 1, baixa: 2 };
      return ordem[a.relevancia] - ordem[b.relevancia];
    });
    
    // Paginação
    const porPagina = 10;
    const inicio = (pagina - 1) * porPagina;
    const resultadosPaginados = todosResultados.slice(inicio, inicio + porPagina);
    
    return new Response(
      JSON.stringify({
        success: true,
        resultados: resultadosPaginados,
        total: todosResultados.length,
        pagina,
        totalPaginas: Math.ceil(todosResultados.length / porPagina),
        fontes: {
          bdtd: resultadosBDTD.length,
          oasisbr: resultadosOASIS.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro na busca de TCCs:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
