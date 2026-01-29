import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Total de páginas esperadas no novo formato V3 (era 9, agora 8 sem cronologia)
const TOTAL_PAGINAS_V3 = 8;

// Tipos das páginas novas que podem estar faltando (removido cronologia)
const PAGINAS_NOVAS = ["correspondencias"];

function isConteudoGeradoV3(conteudo: unknown): boolean {
  if (!conteudo || typeof conteudo !== "object") return false;
  const c = conteudo as any;
  return (
    Array.isArray(c.paginas) &&
    c.paginas.length >= TOTAL_PAGINAS_V3 &&
    c.paginas.every(
      (p: any) =>
        p && typeof p === "object" && typeof p.titulo === "string" && typeof p.markdown === "string"
    )
  );
}

// Verifica se tem as 7 páginas antigas (para upgrade)
function isConteudoGeradoV2(conteudo: unknown): boolean {
  if (!conteudo || typeof conteudo !== "object") return false;
  const c = conteudo as any;
  return (
    Array.isArray(c.paginas) &&
    c.paginas.length >= 6 &&
    c.paginas.every(
      (p: any) =>
        p && typeof p === "object" && typeof p.titulo === "string" && typeof p.markdown === "string"
    )
  );
}

// Verifica quais páginas estão faltando no conteúdo existente
function getPaginasFaltantes(conteudo: any): string[] {
  if (!conteudo || !Array.isArray(conteudo.paginas)) return PAGINAS_NOVAS;
  
  const tiposExistentes = conteudo.paginas.map((p: any) => p.tipo);
  return PAGINAS_NOVAS.filter(tipo => !tiposExistentes.includes(tipo));
}

const GEMINI_KEYS = [
  Deno.env.get("GEMINI_KEY_1"),
  Deno.env.get("GEMINI_KEY_2"),
  Deno.env.get("GEMINI_KEY_3"),
].filter(Boolean) as string[];

// Função para extrair artigos mencionados no conteúdo base
function extrairArtigosDoConteudo(conteudo: string): string[] {
  const regex = /Art\.?\s*\d+[°ºª]?(\s*,?\s*(§|par[aá]grafo|inciso|al[ií]nea)?\s*[\dIVXivx]+)?/gi;
  const matches = conteudo.match(regex) || [];
  return [...new Set(matches)];
}

// Função para extrair citações de leis do conteúdo
function extrairLeisDoConteudo(conteudo: string): string[] {
  const regexLeis = /(Lei\s*n?[°º]?\s*[\d\.]+\/?\d*|Decreto\s*n?[°º]?\s*[\d\.]+|C[óo]digo\s+(Civil|Penal|Processo|Trabalho|Consumidor|Tributário|El[ae]itoral)|(CF|Constitui[çc][ãa]o\s+Federal)|CLT|CDC|CP|CC|CPC|CPP)/gi;
  const matches = conteudo.match(regexLeis) || [];
  return [...new Set(matches)];
}

async function chamarGemini(prompt: string, maxTokens: number = 65000): Promise<string> {
  for (let attempt = 0; attempt < GEMINI_KEYS.length * 2; attempt++) {
    const keyIndex = attempt % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log(`Rate limit na key ${keyIndex + 1}, tentando próxima...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (response.status === 400) {
        console.log(`Erro 400 na key ${keyIndex + 1}, tentando próxima...`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Erro Gemini: ${response.status}`);
      }

      const data = await response.json();
      let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Verificar se o conteúdo foi truncado (não termina com pontuação final ou fecha JSON)
      const trimmed = content.trim();
      const pareceCompleto = trimmed.endsWith('.') || trimmed.endsWith('!') || trimmed.endsWith('?') || 
                            trimmed.endsWith('}') || trimmed.endsWith(']') || trimmed.endsWith('"');
      
      // Se parece truncado e tem tamanho significativo, tentar continuar
      if (!pareceCompleto && content.length > 1000) {
        console.log(`[Gemini] Conteúdo possivelmente truncado (${content.length} chars). Solicitando continuação...`);
        
        const promptContinuacao = `Continue EXATAMENTE de onde parou o texto abaixo. NÃO repita o que já foi escrito. 
Continue diretamente a partir da última palavra:

${content.slice(-1500)}

Continue o texto de forma natural e complete o conteúdo.`;

        try {
          const contResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptContinuacao }] }],
                generationConfig: {
                  temperature: 0.7,
                  topP: 0.95,
                  maxOutputTokens: 30000,
                },
              }),
            }
          );
          
          if (contResponse.ok) {
            const contData = await contResponse.json();
            const continuacao = contData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (continuacao.length > 100) {
              content = content + " " + continuacao;
              console.log(`[Gemini] Continuação adicionada (+${continuacao.length} chars). Total: ${content.length}`);
            }
          }
        } catch (contError) {
          console.warn("[Gemini] Erro ao obter continuação:", contError);
        }
      }
      
      return content;
    } catch (error) {
      console.error(`Erro na tentativa ${attempt + 1}:`, error);
      if (attempt === GEMINI_KEYS.length * 2 - 1) throw error;
    }
  }
  throw new Error("Todas as tentativas falharam");
}

async function buscarContextoBaseOAB(supabase: any, area: string, tema: string): Promise<string> {
  try {
    const areasRelacionadas = [area];
    
    // Buscar páginas relevantes da Base de Conhecimento OAB
    const { data: paginas } = await supabase
      .from("oab_base_conhecimento")
      .select("conteudo, pagina, area")
      .in("area", areasRelacionadas)
      .limit(8);

    if (paginas && paginas.length > 0) {
      return paginas
        .map((p: any) => `[Base OAB - ${p.area}, p.${p.pagina}]\n${p.conteudo?.substring(0, 2000)}`)
        .join("\n\n");
    }
    return "";
  } catch (error) {
    console.error("Erro ao buscar contexto da base OAB:", error);
    return "";
  }
}

// ============ BUSCAR TEMPLATES E REGRAS DO BANCO ============
interface Template {
  id: number;
  ordem: number;
  tipo: string;
  titulo: string;
  instrucoes: string;
  palavras_minimas: number;
}

interface Regra {
  id: number;
  categoria: string;
  regra: string;
  prioridade: number;
}

async function buscarTemplatesERegras(supabase: any): Promise<{ templates: Template[]; regras: Regra[] }> {
  console.log("[Templates] Buscando templates e regras do banco de dados...");
  
  // Buscar templates ativos ordenados por ordem
  const { data: templates, error: templatesError } = await supabase
    .from("oab_geracao_templates")
    .select("id, ordem, tipo, titulo, instrucoes, palavras_minimas")
    .eq("ativo", true)
    .order("ordem");

  if (templatesError) {
    console.error("[Templates] Erro ao buscar templates:", templatesError);
  }

  // Buscar regras ativas ordenadas por prioridade
  const { data: regras, error: regrasError } = await supabase
    .from("oab_geracao_regras")
    .select("id, categoria, regra, prioridade")
    .eq("ativo", true)
    .order("prioridade");

  if (regrasError) {
    console.error("[Templates] Erro ao buscar regras:", regrasError);
  }

  console.log(`[Templates] Carregados: ${templates?.length || 0} templates, ${regras?.length || 0} regras`);
  
  return {
    templates: templates || [],
    regras: regras || []
  };
}

// ============ MONTAR PROMPT DINÂMICO ============
function montarPromptDinamico(
  templates: Template[],
  regras: Regra[],
  subtema: string,
  area: string,
  conteudoOriginal: string,
  listaArtigos: string,
  listaLeis: string,
  contextoOAB: string
): string {
  // Agrupar regras por categoria
  const regrasPorCategoria: Record<string, string[]> = {};
  for (const r of regras) {
    if (!regrasPorCategoria[r.categoria]) {
      regrasPorCategoria[r.categoria] = [];
    }
    regrasPorCategoria[r.categoria].push(r.regra);
  }

  // Montar seção de regras globais
  const secaoRegras = Object.entries(regrasPorCategoria)
    .map(([categoria, listaRegras]) => {
      const titulo = categoria.charAt(0).toUpperCase() + categoria.slice(1);
      return `### ${titulo}\n${listaRegras.map(r => `- ${r}`).join('\n')}`;
    })
    .join('\n\n');

  // Montar seção de templates (páginas)
  const secaoTemplates = templates
    .map((t, index) => {
      const palavrasInfo = t.palavras_minimas > 0 ? `\n- Tamanho mínimo: ${t.palavras_minimas} palavras` : '';
      return `### PÁGINA ${index + 1} - ${t.titulo.toUpperCase()}
- Tipo: "${t.tipo}"${palavrasInfo}
- Instruções: ${t.instrucoes}`;
    })
    .join('\n\n');

  // Montar estrutura JSON esperada
  const estruturaJson = templates.map(t => 
    `    { "titulo": "${t.titulo}", "tipo": "${t.tipo}", "markdown": "..." }`
  ).join(',\n');

  // Calcular palavras no conteúdo fonte para validação
  const palavrasFonte = conteudoOriginal.trim().split(/\s+/).filter(w => w.length > 0).length;
  const fonteEhCurto = palavrasFonte < 500;
  
  // Instrução de adaptação baseada no tamanho do fonte
  const instrucaoAdaptacao = fonteEhCurto 
    ? `\n\n## ⚠️ ALERTA: CONTEÚDO FONTE CURTO (${palavrasFonte} palavras)
O conteúdo fonte tem menos de 500 palavras. Você DEVE:
1. Adaptar proporcionalmente - NÃO force 4000 palavras se o fonte tem poucas informações
2. RECUSAR inventar conceitos para "preencher" o material
3. Focar em explicar MUITO BEM o que está no fonte, sem adicionar tópicos externos
4. É MELHOR um material curto e fiel do que longo e inventado`
    : '';

  // Montar prompt final
  const prompt = `Você é um professor especialista em Direito para o Exame da OAB.

TAREFA: Gerar material de estudo didático sobre "${subtema}" (área: ${area}).

## ⚠️ REGRAS GLOBAIS DE GERAÇÃO

${secaoRegras}
${instrucaoAdaptacao}

## ❌ PROIBIÇÕES ABSOLUTAS:
- **NUNCA USE EMOJIS NO TEXTO** (proibido qualquer emoji como 😊, 🎯, 📚, ⚖️, 📌, ✅, ❌, etc.)
- Mantenha o texto 100% profissional e textual, sem símbolos decorativos

## CONTEÚDO FONTE (extraído do PDF) - USE SOMENTE ISTO:
📊 ESTATÍSTICA: O conteúdo fonte tem ${palavrasFonte} palavras.
📌 REGRA ABSOLUTA: Você SÓ pode usar conceitos que estejam EXPLICITAMENTE no texto abaixo.

"""
${conteudoOriginal}
"""

## LEGISLAÇÃO ENCONTRADA NO PDF (USE APENAS ESTAS):
${listaArtigos}
${listaLeis}

${contextoOAB ? `## CONTEXTO TÉCNICO ADICIONAL:\n${contextoOAB}\n` : ""}

## ESTRUTURA OBRIGATÓRIA - ${templates.length} PÁGINAS

${secaoTemplates}

## ⚠️ PÁGINA "LIGAR TERMOS" - REGRA ESPECIAL:
A página do tipo "correspondencias" DEVE incluir um campo "dados_interativos" com EXATAMENTE 8-10 pares termo/definição:
{
  "titulo": "Exercício: Ligar Termos",
  "tipo": "correspondencias",
  "markdown": "Texto explicativo...",
  "dados_interativos": {
    "pares": [
      { "termo": "Termo jurídico", "definicao": "Definição clara e concisa" }
    ],
    "dica_estudo": "Dica para memorizar os conceitos"
  }
}

## FORMATO JSON OBRIGATÓRIO:
{
  "paginas": [
${estruturaJson}
  ]
}

## REGRAS DE FORMATAÇÃO FINAIS:
- Escape aspas duplas como \\"
- Use \\n para quebras de linha
- Markdown rico: títulos ##, listas -, tabelas |, negrito **, itálico *
- **ZERO EMOJIS** - texto puro apenas

Retorne APENAS o JSON válido, sem texto adicional.`;

  return prompt;
}

function parseJsonSafely(rawText: string, fallbackArray: boolean = true): any {
  try {
    // Remove markdown code blocks
    let cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Tenta extrair array JSON
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const fixedJson = jsonMatch[0]
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        .replace(/\n/g, ' ')
        .replace(/\t/g, ' ');
      return JSON.parse(fixedJson);
    }
    
    return fallbackArray ? [] : {};
  } catch (e) {
    console.error("Erro ao parsear JSON:", e);
    return fallbackArray ? [] : {};
  }
}

async function processarGeracaoConteudo(resumo_id: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Buscar dados do RESUMO
    const { data: resumo, error: resumoError } = await supabase
      .from("RESUMO")
      .select("*")
      .eq("id", resumo_id)
      .single();

    if (resumoError || !resumo) {
      console.error(`[Background] Resumo ${resumo_id} não encontrado`);
      return;
    }

    const area = resumo.area || "";
    const tema = resumo.tema || "";
    const subtema = resumo.subtema || "";
    const conteudoOriginal = resumo.conteudo || "";

    // ============ BUSCAR TEMPLATES E REGRAS DO BANCO ============
    const { templates, regras } = await buscarTemplatesERegras(supabase);

    // Fallback se não houver templates no banco
    if (templates.length === 0) {
      console.error("[Background] ALERTA: Nenhum template encontrado no banco. Usando fallback hardcoded.");
    }

    // Extrair artigos e leis do conteúdo base
    const artigosPermitidos = extrairArtigosDoConteudo(conteudoOriginal);
    const leisPermitidas = extrairLeisDoConteudo(conteudoOriginal);
    
    const listaArtigos = artigosPermitidos.length > 0 
      ? `ARTIGOS ENCONTRADOS NO CONTEÚDO BASE (USE APENAS ESTES): ${artigosPermitidos.join(', ')}`
      : 'NENHUM ARTIGO ESPECÍFICO ENCONTRADO NO CONTEÚDO BASE - NÃO CITE ARTIGOS DE LEI';
      
    const listaLeis = leisPermitidas.length > 0
      ? `LEIS/CÓDIGOS MENCIONADOS: ${leisPermitidas.join(', ')}`
      : 'NENHUMA LEI ESPECÍFICA MENCIONADA NO CONTEÚDO BASE';

    console.log(`[Background] Artigos encontrados: ${artigosPermitidos.length}, Leis: ${leisPermitidas.length}`);

    // Buscar contexto adicional da Base de Conhecimento OAB
    const contextoOAB = await buscarContextoBaseOAB(supabase, area, tema);

    // ============ VALIDAÇÃO CRÍTICA: BLOQUEAR SE NÃO HOUVER CONTEÚDO FONTE ============
    if (!conteudoOriginal || conteudoOriginal.trim().length < 100) {
      console.error(`[Background] BLOQUEADO: Conteúdo fonte vazio ou muito curto para resumo ${resumo_id}`);
      console.log(`[Background] Tamanho do conteúdo: ${conteudoOriginal?.length || 0} caracteres`);
      
      // Salvar mensagem de erro no banco
      const erroMensagem = JSON.stringify({
        erro: true,
        mensagem: "Conteúdo fonte não disponível. Por favor, reprocesse o PDF do tópico.",
        detalhe: `O texto extraído do PDF para este subtema está vazio ou tem menos de 100 caracteres (${conteudoOriginal?.length || 0} chars).`,
        acao: "Volte ao tópico e faça o upload/extração do PDF novamente."
      });
      
      await supabase
        .from("RESUMO")
        .update({ 
          conteudo_gerado: erroMensagem,
          ultima_atualizacao: new Date().toISOString()
        })
        .eq("id", resumo_id);
      
      console.log(`[Background] Status de erro salvo para resumo ${resumo_id}`);
      return; // ABORTAR a geração
    }

    // ============ MONTAR PROMPT DINÂMICO ============
    const promptConteudo = templates.length > 0 && regras.length > 0
      ? montarPromptDinamico(templates, regras, subtema, area, conteudoOriginal, listaArtigos, listaLeis, contextoOAB)
      : montarPromptFallback(subtema, area, conteudoOriginal, listaArtigos, listaLeis, contextoOAB, artigosPermitidos, leisPermitidas);

    console.log(`[Background] Gerando conteúdo para resumo ${resumo_id}...`);
    console.log(`[Background] Usando ${templates.length > 0 ? 'templates do banco' : 'prompt fallback'}`);
    
    const conteudoRaw = await chamarGemini(promptConteudo, 65000);
    
    // Parsear o JSON com as 6 páginas
    let paginasConteudo: Array<{ titulo: string; tipo: string; markdown: string }> = [];

    const tryParsePaginas = (raw: string) => {
      const cleaned = raw
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*"paginas"[\s\S]*\}/);
      if (!jsonMatch) return null;
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const paginas = Array.isArray(parsed?.paginas) ? parsed.paginas : [];
        return paginas;
      } catch {
        return null;
      }
    };

    const parsedPaginas1 = tryParsePaginas(conteudoRaw);
    if (parsedPaginas1) paginasConteudo = parsedPaginas1;

    // Se não veio exatamente no formato esperado, pedir 1 reparo ao Gemini
    if (!isConteudoGeradoV2({ paginas: paginasConteudo })) {
      console.log(
        `[Background] Formato de páginas inválido (len=${paginasConteudo.length}). Tentando reparo de JSON...`
      );
      
      // Montar estrutura esperada baseada nos templates
      const estruturaReparo = templates.length > 0
        ? templates.map(t => `    { "titulo": "${t.titulo}", "tipo": "${t.tipo}", "markdown": "..." }`).join(',\n')
        : `    { "titulo": "Introdução", "tipo": "introducao", "markdown": "..." },
    { "titulo": "Conteúdo Completo", "tipo": "conteudo_principal", "markdown": "..." },
    { "titulo": "Entendendo na Prática", "tipo": "entendendo_na_pratica", "markdown": "..." },
    { "titulo": "Quadro Comparativo", "tipo": "quadro_comparativo", "markdown": "..." },
    { "titulo": "Dicas de Provas", "tipo": "dicas_provas", "markdown": "..." },
    { "titulo": "Síntese Final", "tipo": "sintese_final", "markdown": "..." }`;

      const promptReparo = `O JSON abaixo está malformado. Corrija-o para que seja um JSON válido com a estrutura:
{
  "paginas": [
${estruturaReparo}
  ]
}

JSON malformado:
${conteudoRaw.substring(0, 8000)}

Retorne APENAS o JSON corrigido.`;

      const reparoRaw = await chamarGemini(promptReparo, 20000);
      const parsedPaginas2 = tryParsePaginas(reparoRaw);
      if (parsedPaginas2) paginasConteudo = parsedPaginas2;
    }

    // Fallback final: garantir páginas mínimas para não quebrar o reader
    if (!isConteudoGeradoV2({ paginas: paginasConteudo })) {
      console.error(
        `[Background] Ainda não foi possível obter páginas válidas. Usando fallback básico.`
      );
      paginasConteudo = [
        {
          titulo: "Introdução",
          tipo: "introducao",
          markdown: `# Introdução\n\nNeste tema, vamos estudar ${subtema}, um assunto importante na área de ${area} para o Exame da OAB.`
        },
        {
          titulo: "Conteúdo Completo",
          tipo: "conteudo_principal",
          markdown: conteudoRaw.length > 100 ? conteudoRaw : `# ${subtema}\n\nConteúdo sobre ${subtema} na área de ${area}.`
        },
        {
          titulo: "Entendendo na Prática",
          tipo: "entendendo_na_pratica",
          markdown: "## Entendendo na Prática\n\n### Analogia 1\n**Analogia:** Imagine que...\n**Aplicação no Direito:** Isso se aplica quando...\n**Por que isso importa na OAB:** A prova cobra isso porque..."
        },
        {
          titulo: "Quadro Comparativo",
          tipo: "quadro_comparativo",
          markdown: "| Aspecto | Descrição |\n|---------|----------|\n| - | Conteúdo será gerado em breve |"
        },
        {
          titulo: "Dicas de Provas",
          tipo: "dicas_provas",
          markdown: "## Dicas de Provas\n\n- Fique atento às pegadinhas sobre " + subtema
        },
        {
          titulo: "Síntese Final",
          tipo: "sintese_final",
          markdown: "## Resumo\n\n- Ponto principal sobre " + subtema
        }
      ];
    }

    // ============ NORMALIZAR TIPOS E FILTRAR DUPLICATAS ============
    console.log(`[Background] Normalizando tipos e validando páginas...`);

    // Normalizar o campo 'tipo' baseado no título (para páginas que vêm sem tipo)
    paginasConteudo = paginasConteudo.map((pagina) => {
      const tituloLower = (pagina.titulo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Normalizar tipo se estiver faltando ou incorreto
      if (!pagina.tipo || pagina.tipo === '') {
        if (tituloLower.includes('introducao') || tituloLower.includes('introdução')) {
          pagina.tipo = 'introducao';
        } else if (tituloLower.includes('conteudo completo') || tituloLower.includes('conteúdo completo')) {
          pagina.tipo = 'conteudo_principal';
        } else if (tituloLower.includes('desmembrando')) {
          pagina.tipo = 'desmembrando';
        } else if (tituloLower.includes('pratica') || tituloLower.includes('prática')) {
          pagina.tipo = 'entendendo_na_pratica';
        } else if (tituloLower.includes('quadro') || tituloLower.includes('comparativo')) {
          pagina.tipo = 'quadro_comparativo';
        } else if (tituloLower.includes('dica') || tituloLower.includes('memorizar')) {
          pagina.tipo = 'dicas_memorizar';
        } else if (tituloLower.includes('ligar') || tituloLower.includes('correspondencia') || tituloLower.includes('termos')) {
          pagina.tipo = 'correspondencias';
        } else if (tituloLower.includes('sintese') || tituloLower.includes('síntese')) {
          pagina.tipo = 'sintese_final';
        }
      }
      
      // Forçar tipo para "Ligar Termos" mesmo que tenha outro tipo
      if (tituloLower.includes('ligar termos')) {
        pagina.tipo = 'correspondencias';
      }
      
      return pagina;
    });

    // Remover páginas duplicadas de correspondências (mantém apenas a PRIMEIRA)
    const tiposDeCorrespondenciasVistos = new Set<string>();
    paginasConteudo = paginasConteudo.filter((pagina) => {
      const tipo = pagina.tipo;
      const tituloLower = (pagina.titulo || '').toLowerCase();
      
      // Identificar se é página de correspondências por tipo OU título
      const isCorrespondencias = tipo === 'correspondencias' || 
        tituloLower.includes('ligar termos') || 
        tituloLower.includes('correspondência') ||
        tituloLower.includes('correspondencias');
      
      if (isCorrespondencias) {
        if (tiposDeCorrespondenciasVistos.has('correspondencias')) {
          console.log(`[Background] Removendo página duplicada de correspondencias: "${pagina.titulo}"`);
          return false;
        }
        tiposDeCorrespondenciasVistos.add('correspondencias');
        // Garantir que o tipo está correto
        pagina.tipo = 'correspondencias';
      }
      return true;
    });

    console.log(`[Background] Após remoção de duplicatas: ${paginasConteudo.length} páginas`);

    // Se correspondências existe mas sem dados_interativos, gerar
    const paginaCorr = paginasConteudo.find(p => p.tipo === 'correspondencias') as any;
    if (paginaCorr && !paginaCorr.dados_interativos) {
      console.log(`[Background] Correspondências sem dados_interativos. Gerando dados...`);
      
      try {
        const promptExtrair = `Extraia os pares termo/definição do texto abaixo e retorne como JSON:

${paginaCorr.markdown?.substring(0, 2000) || conteudoOriginal.substring(0, 2000)}

Retorne APENAS JSON válido:
{
  "pares": [{ "termo": "...", "definicao": "..." }],
  "dica_estudo": "..."
}`;
        
        const extrairRaw = await chamarGemini(promptExtrair, 5000);
        const cleaned = extrairRaw.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          paginaCorr.dados_interativos = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn("[Background] Não foi possível extrair dados_interativos:", e);
        // Fallback básico
        paginaCorr.dados_interativos = {
          pares: [
            { termo: "Conceito 1", definicao: "Definição básica de " + subtema },
            { termo: "Conceito 2", definicao: "Segunda definição importante" },
            { termo: "Conceito 3", definicao: "Terceira definição" }
          ],
          dica_estudo: "Revise os conceitos principais."
        };
      }
    }

    // ============ GARANTIR EXATAMENTE 8 PÁGINAS ============
    if (paginasConteudo.length > TOTAL_PAGINAS_V3) {
      console.warn(`[Background] ${paginasConteudo.length} páginas geradas, limitando a ${TOTAL_PAGINAS_V3}`);
      paginasConteudo = paginasConteudo.slice(0, TOTAL_PAGINAS_V3);
    } else if (paginasConteudo.length < TOTAL_PAGINAS_V3) {
      console.warn(`[Background] Apenas ${paginasConteudo.length} páginas geradas (esperado: ${TOTAL_PAGINAS_V3})`);
    }

    console.log(`[Background] Páginas finais: ${paginasConteudo.length}`);

    // ============ PROMPT DE EXEMPLOS ============
    const promptExemplos = `Você é um professor preparando alunos para OAB.

⚠️ REGRAS CRÍTICAS:
- Use APENAS conceitos do conteúdo base. NÃO invente artigos de lei ou citações.
- **NUNCA USE EMOJIS** (proibido qualquer emoji como 😊, 🎯, 📚, ⚖️, etc.)

Para o tema "${subtema}" (${area}), crie 5 EXEMPLOS PRÁTICOS ELABORADOS baseados APENAS no conteúdo abaixo:

CONTEÚDO BASE:
${conteudoOriginal.substring(0, 3000)}

${listaArtigos}

Responda APENAS em JSON válido (sem texto antes ou depois):
[
  {
    "titulo": "Título descritivo do caso prático",
    "situacao": "Descrição detalhada da situação fática (4-5 frases, com nomes fictícios e contexto)",
    "analise": "Análise jurídica aplicando conceitos do conteúdo base - NÃO cite artigos que não estejam no conteúdo",
    "conclusao": "Solução jurídica e lição a ser aprendida para a OAB"
  }
]

IMPORTANTE:
- NÃO invente artigos de lei que não estejam no conteúdo base
- Use apenas conceitos e fundamentos presentes no texto fornecido
- Para temas históricos, foque no contexto da época
- ZERO EMOJIS em qualquer texto

Apenas o JSON, sem markdown.`;

    console.log(`[Background] Gerando exemplos...`);
    const exemplosRaw = await chamarGemini(promptExemplos, 15000);
    const exemplos = parseJsonSafely(exemplosRaw);

    // ============ PROMPT DE TERMOS (usado para Ligar Termos) ============
    const promptTermos = `Você é um professor de Direito especialista em OAB.

⚠️ REGRA CRÍTICA: **NUNCA USE EMOJIS** (proibido qualquer emoji como 😊, 🎯, 📚, ⚖️, etc.)

Para o tema "${subtema}" (${area}), liste 10-12 TERMOS JURÍDICOS TÉCNICOS que aparecem ou são relevantes ao CONTEÚDO BASE abaixo:

CONTEÚDO BASE:
${conteudoOriginal.substring(0, 2000)}

Responda APENAS em JSON válido:
{
  "correspondencias": [
    {
      "termo": "Nome do termo técnico em latim ou português jurídico",
      "definicao": "Definição jurídica precisa e concisa (1-2 frases)"
    }
  ],
  "termos_detalhados": [
    {
      "termo": "Nome do termo técnico",
      "definicao": "Definição jurídica precisa em 3-4 frases",
      "origem": "Origem etimológica ou histórica"
    }
  ]
}

IMPORTANTE:
- O array "correspondencias" será usado para o jogo de ligar termos - precisa ter EXATAMENTE 8-10 pares
- Cada definição em "correspondencias" deve ser curta (máximo 15 palavras) para caber na tela
- ZERO EMOJIS em qualquer texto

Apenas o JSON, sem markdown.`;

    console.log(`[Background] Gerando termos...`);
    const termosRaw = await chamarGemini(promptTermos, 10000);
    const termos = parseJsonSafely(termosRaw, false);

    // ============ PROMPT DE FLASHCARDS ============
    const promptFlashcards = `Você é um professor preparando alunos para OAB.

⚠️ REGRAS CRÍTICAS:
- Use APENAS conceitos do conteúdo base. NÃO invente artigos de lei.
- **NUNCA USE EMOJIS** (proibido qualquer emoji como 😊, 🎯, 📚, ⚖️, etc.)

Para o tema "${subtema}" (${area}), crie EXATAMENTE 20 FLASHCARDS baseados no CONTEÚDO BASE:

CONTEÚDO BASE:
${conteudoOriginal.substring(0, 3000)}

${listaArtigos}

Responda APENAS em JSON válido:
[
  {
    "frente": "Pergunta clara e objetiva baseada no conteúdo",
    "verso": "Resposta completa e precisa - SEM inventar artigos",
    "exemplo": "Exemplo prático curto (1-2 frases)"
  }
]

IMPORTANTE:
- NÃO mencione artigos de lei que não estejam no conteúdo base
- ZERO EMOJIS em qualquer texto

Apenas o JSON.`;

    console.log(`[Background] Gerando flashcards...`);
    const flashcardsRaw = await chamarGemini(promptFlashcards, 15000);
    const flashcards = parseJsonSafely(flashcardsRaw);

    // ============ PROMPT DE QUESTÕES ============
    const promptQuestoes = `Você é um elaborador de questões da OAB (FGV).

⚠️ REGRAS CRÍTICAS:
- Use APENAS conceitos do conteúdo base. NÃO invente fundamentos legais nas explicações.
- **NUNCA USE EMOJIS** (proibido qualquer emoji como 😊, 🎯, 📚, ⚖️, etc.)

Para o tema "${subtema}" (${area}), crie 15 QUESTÕES estilo OAB baseadas no CONTEÚDO BASE:

CONTEÚDO BASE:
${conteudoOriginal.substring(0, 4000)}

${listaArtigos}

Responda APENAS em JSON válido:
[
  {
    "enunciado": "Texto completo da questão com situação-problema",
    "opcoes": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
    "correta": 0,
    "explicacao": "Explicação detalhada de TODAS as alternativas - SEM inventar fundamentos legais que não estejam no conteúdo",
    "dificuldade": "facil|medio|dificil"
  }
]

IMPORTANTE:
- O campo "correta" é o índice (0=A, 1=B, 2=C, 3=D)
- NÃO cite artigos de lei que não estejam no conteúdo base
- Para questões históricas, foque em contexto e conceitos, não em legislação
- ZERO EMOJIS em qualquer texto

Apenas o JSON.`;

    console.log(`[Background] Gerando questões...`);
    const questoesRaw = await chamarGemini(promptQuestoes, 20000);
    const questoes = parseJsonSafely(questoesRaw);

    // Validar que arrays foram parseados corretamente
    const validExemplos = Array.isArray(exemplos) ? exemplos : [];
    
    // Termos pode vir como objeto { correspondencias: [], termos_detalhados: [] } ou array
    // Precisamos garantir que o campo correspondencias tenha os 8-10 pares para o jogo Ligar Termos
    let validTermos: any = termos;
    if (!validTermos || typeof validTermos !== 'object') {
      validTermos = { correspondencias: [], termos_detalhados: [] };
    }
    // Se veio como array, converter para objeto com correspondencias
    if (Array.isArray(validTermos)) {
      validTermos = { 
        correspondencias: validTermos.filter((t: any) => t.termo && t.definicao).slice(0, 10),
        termos_detalhados: validTermos 
      };
    }
    // Garantir que correspondencias existe e tem pelo menos alguns itens
    if (!validTermos.correspondencias || !Array.isArray(validTermos.correspondencias)) {
      validTermos.correspondencias = [];
    }
    if (!validTermos.termos_detalhados) {
      validTermos.termos_detalhados = [];
    }
    
    console.log(`[Background] Termos gerados: ${validTermos.correspondencias?.length || 0} correspondências, ${validTermos.termos_detalhados?.length || 0} detalhados`);
    
    // ============ SINCRONIZAR CORRESPONDÊNCIAS DE dados_interativos PARA termos ============
    // Garante que os pares do jogo "Ligar Termos" também estejam em termos.correspondencias
    const paginaCorrespondencias = paginasConteudo.find((p: any) => p.tipo === 'correspondencias') as any;
    if (paginaCorrespondencias?.dados_interativos?.pares && Array.isArray(paginaCorrespondencias.dados_interativos.pares)) {
      const paresInterativos = paginaCorrespondencias.dados_interativos.pares;
      console.log(`[Background] Sincronizando ${paresInterativos.length} pares de dados_interativos para termos.correspondencias`);
      
      // Se termos.correspondencias está vazio ou tem menos itens, usar dados_interativos.pares
      if (!validTermos.correspondencias || validTermos.correspondencias.length < paresInterativos.length) {
        validTermos.correspondencias = paresInterativos.map((p: any) => ({
          termo: p.termo,
          definicao: p.definicao
        }));
        console.log(`[Background] termos.correspondencias atualizado com ${validTermos.correspondencias.length} pares`);
      }
    }
    
    const validFlashcards = Array.isArray(flashcards) ? flashcards : [];
    const validQuestoes = Array.isArray(questoes) ? questoes : [];

    // Salvar conteúdo gerado com novo formato de páginas
    const conteudoGerado = {
      paginas: paginasConteudo,
      exemplos: validExemplos,
      termos: validTermos,
      flashcards: validFlashcards,
      questoes: validQuestoes
    };

    // ============ VALIDAÇÃO DE TAXA DE EXPANSÃO ============
    const palavrasFonte = conteudoOriginal.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
    const conteudoPaginasTexto = paginasConteudo.map((p: { titulo: string; tipo: string; markdown: string }) => p.markdown).join(' ');
    const palavrasGeradas = conteudoPaginasTexto.split(/\s+/).filter((w: string) => w.length > 0).length;
    const taxaExpansao = palavrasFonte > 0 ? palavrasGeradas / palavrasFonte : 0;

    console.log(`[Background] 📊 VALIDAÇÃO DE FIDELIDADE:`);
    console.log(`[Background]    - Palavras no fonte (PDF): ${palavrasFonte}`);
    console.log(`[Background]    - Palavras geradas: ${palavrasGeradas}`);
    console.log(`[Background]    - Taxa de expansão: ${taxaExpansao.toFixed(1)}x`);

    if (taxaExpansao > 15) {
      console.warn(`[Background] ⚠️ ALERTA: Taxa de expansão muito alta (${taxaExpansao.toFixed(1)}x). Possível conteúdo inventado!`);
    }
    if (palavrasFonte < 500 && palavrasGeradas > 3000) {
      console.warn(`[Background] ⚠️ ALERTA: Fonte curto (${palavrasFonte}) mas geração longa (${palavrasGeradas}). Verificar fidelidade!`);
    }

    console.log(`[Background] Salvando conteúdo do resumo ${resumo_id}...`);
    console.log(`[Background] Stats: ${validExemplos.length} exemplos, ${validTermos.correspondencias?.length || 0} correspondências, ${validFlashcards.length} flashcards, ${validQuestoes.length} questões`);
    
    const { error: updateError } = await supabase
      .from("RESUMO")
      .update({
        conteudo_gerado: conteudoGerado,
        ultima_atualizacao: new Date().toISOString()
      })
      .eq("id", resumo_id);

    if (updateError) {
      throw new Error(`Erro ao atualizar resumo: ${updateError.message}`);
    }

    console.log(`[Background] Conteúdo do resumo ${resumo_id} salvo com sucesso!`);

    // Gerar capa em background (SEM GERAR ÁUDIO AUTOMATICAMENTE)
    try {
      console.log(`[Capa] Iniciando geração de capa para resumo ${resumo_id}...`);
      
      const capaResponse = await fetch(
        `${supabaseUrl}/functions/v1/gerar-capa-subtema-resumo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            resumo_id,
            titulo: subtema,
            area 
          })
        }
      );
      
      if (capaResponse.ok) {
        console.log("[Capa] Capa gerada com sucesso!");
      } else {
        console.error("[Capa] Erro ao gerar capa:", await capaResponse.text());
      }
    } catch (capaError) {
      console.error("[Capa] Erro ao iniciar geração de capa:", capaError);
    }

    console.log(`[Background] ✅ Geração completa do resumo ${resumo_id} finalizada!`);
  } catch (error) {
    console.error(`[Background] ❌ Erro na geração do resumo ${resumo_id}:`, error);
  }
}

// ============ UPGRADE PARA V3 (adicionar páginas faltantes) ============
async function upgradeParaV3(resumo_id: number, conteudoAtual: any, paginasFaltantes: string[]) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`[Upgrade V3] Iniciando upgrade do resumo ${resumo_id}. Páginas faltantes: ${paginasFaltantes.join(', ')}`);

    // Buscar dados do RESUMO para contexto
    const { data: resumo, error: resumoError } = await supabase
      .from("RESUMO")
      .select("subtema, area, conteudo")
      .eq("id", resumo_id)
      .single();

    if (resumoError || !resumo) {
      console.error(`[Upgrade V3] Resumo ${resumo_id} não encontrado`);
      return;
    }

    const subtema = resumo.subtema || "";
    const area = resumo.area || "";
    const conteudoOriginal = resumo.conteudo || "";
    
    // Cópia das páginas existentes
    let paginasAtualizadas = [...(conteudoAtual.paginas || [])];

    // Verificar se já tem correspondências (por tipo ou título)
    const jaTemCorrespondencias = paginasAtualizadas.some(p => 
      p.tipo === 'correspondencias' || 
      (p.titulo || '').toLowerCase().includes('ligar termos') ||
      (p.titulo || '').toLowerCase().includes('correspondência')
    );

    // Gerar apenas páginas que realmente faltam
    for (const tipoFaltante of paginasFaltantes) {
      // Pular correspondências se já existir
      if (tipoFaltante === "correspondencias" && jaTemCorrespondencias) {
        console.log(`[Upgrade V3] Correspondências já existe, pulando...`);
        continue;
      }

      console.log(`[Upgrade V3] Gerando página: ${tipoFaltante}...`);

      if (tipoFaltante === "correspondencias") {
        const promptCorrespondencias = `Você é um professor de Direito especialista em OAB.

Para o tema "${subtema}" (${area}), crie um EXERCÍCIO DE CORRESPONDÊNCIAS para memorização ativa.

CONTEÚDO BASE:
${conteudoOriginal.substring(0, 3000)}

Crie entre 6 e 10 pares de TERMO → DEFINIÇÃO extraídos do conteúdo base.

Responda APENAS em JSON válido:
{
  "pares": [
    {
      "termo": "Nome do conceito",
      "definicao": "Definição clara em 1-2 frases"
    }
  ],
  "dica_estudo": "Uma dica de memorização"
}

Apenas o JSON.`;

        let correspondenciasData = { pares: [] as Array<{termo: string; definicao: string}>, dica_estudo: "" };
        try {
          const correspondenciasRaw = await chamarGemini(promptCorrespondencias, 8000);
          const cleaned = correspondenciasRaw.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '').trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            correspondenciasData = JSON.parse(jsonMatch[0]);
          }
          if (!correspondenciasData.pares || correspondenciasData.pares.length < 3) {
            throw new Error("Poucos pares");
          }
        } catch (e) {
          console.error("[Upgrade V3] Erro ao gerar correspondências:", e);
          correspondenciasData = {
            pares: [
              { termo: "Conceito 1", definicao: "Definição básica de " + subtema },
              { termo: "Conceito 2", definicao: "Segunda definição importante" },
              { termo: "Conceito 3", definicao: "Terceira definição" }
            ],
            dica_estudo: "Revise os conceitos principais."
          };
        }

        const correspondenciasMarkdown = `Hora de testar o que você aprendeu! Conecte cada termo à sua definição correta.

💡 **Dica de Estudo:** ${correspondenciasData.dica_estudo || "Pratique associando os termos às definições."}`;

        paginasAtualizadas.push({
          titulo: "Ligar Termos",
          tipo: "correspondencias",
          markdown: correspondenciasMarkdown,
          dados_interativos: correspondenciasData
        });
      }
    }

    // Garantir no máximo 8 páginas
    if (paginasAtualizadas.length > TOTAL_PAGINAS_V3) {
      console.warn(`[Upgrade V3] ${paginasAtualizadas.length} páginas, limitando a ${TOTAL_PAGINAS_V3}`);
      paginasAtualizadas = paginasAtualizadas.slice(0, TOTAL_PAGINAS_V3);
    }

    // Atualizar o conteúdo com as novas páginas
    const conteudoAtualizado = {
      ...conteudoAtual,
      paginas: paginasAtualizadas
    };

    const { error: updateError } = await supabase
      .from("RESUMO")
      .update({
        conteudo_gerado: conteudoAtualizado,
        ultima_atualizacao: new Date().toISOString()
      })
      .eq("id", resumo_id);

    if (updateError) {
      throw new Error(`Erro ao atualizar resumo: ${updateError.message}`);
    }

    console.log(`[Upgrade V3] ✅ Upgrade do resumo ${resumo_id} concluído! Total de páginas: ${paginasAtualizadas.length}`);
  } catch (error) {
    console.error(`[Upgrade V3] ❌ Erro no upgrade do resumo ${resumo_id}:`, error);
  }
}

// ============ PROMPT FALLBACK (caso não haja templates no banco) ============
function montarPromptFallback(
  subtema: string,
  area: string,
  conteudoOriginal: string,
  listaArtigos: string,
  listaLeis: string,
  contextoOAB: string,
  artigosPermitidos: string[],
  leisPermitidas: string[]
): string {
  return `Você é um professor especialista em Direito para o Exame da OAB.

TAREFA: Gerar material de estudo didático sobre "${subtema}" (área: ${area}).

## ⚠️ REGRA CRÍTICA ABSOLUTA - FIDELIDADE 100% AO PDF ⚠️
- O conteúdo fonte fornecido abaixo é TODO o material que você deve usar
- NUNCA adicione conceitos, tópicos ou temas que NÃO estejam no conteúdo fonte
- Se o PDF fala APENAS de "Constitucionalismo", você escreve APENAS sobre constitucionalismo
- NÃO crie seções sobre "Poder Constituinte", "Eficácia das Normas", "Princípios Fundamentais" se esses termos NÃO aparecem no PDF
- PROIBIDO inventar, expandir ou "completar" com conhecimento externo
- Seu trabalho é REFORMULAR e DIDATIZAR o que está no PDF, não criar conteúdo novo

## CONTEÚDO FONTE (extraído do PDF) - USE SOMENTE ISTO:
"""
${conteudoOriginal}
"""

## LEGISLAÇÃO ENCONTRADA NO PDF (USE APENAS ESTAS):
${listaArtigos}
${listaLeis}
${artigosPermitidos.length === 0 && leisPermitidas.length === 0 
  ? '⚠️ NENHUMA LEGISLAÇÃO ESPECÍFICA ENCONTRADA NO PDF - NÃO INVENTE ARTIGOS!' 
  : ''}

${contextoOAB ? `CONTEXTO TÉCNICO ADICIONAL:\n${contextoOAB}\n` : ""}

## ESTRUTURA OBRIGATÓRIA - 6 PÁGINAS

### PÁGINA 1 - INTRODUÇÃO
- Tipo: "introducao"
- Tamanho: 1-2 parágrafos (máximo 300 palavras)
- Linguagem: 100% sem juridiquês, clara e acolhedora

### PÁGINA 2 - CONTEÚDO COMPLETO
- Tipo: "conteudo_principal"
- Tamanho: MÍNIMO 4000 palavras desenvolvendo TODO o PDF
- ⚠️ CRÍTICO: Expanda e explique APENAS o que está no conteúdo fonte

### PÁGINA 3 - ENTENDENDO NA PRÁTICA
- Tipo: "entendendo_na_pratica"
- 2-3 analogias/exemplos APENAS sobre conceitos do PDF

### PÁGINA 4 - QUADRO COMPARATIVO
- Tipo: "quadro_comparativo"
- Tabelas Markdown comparando APENAS conceitos do PDF

### PÁGINA 5 - DICAS DE PROVAS
- Tipo: "dicas_provas"
- Como os conceitos DO PDF são cobrados na OAB

### PÁGINA 6 - SÍNTESE FINAL
- Tipo: "sintese_final"
- Texto de síntese + Checklist com ◆

## FORMATO JSON OBRIGATÓRIO:
{
  "paginas": [
    { "titulo": "Introdução", "tipo": "introducao", "markdown": "..." },
    { "titulo": "Conteúdo Completo", "tipo": "conteudo_principal", "markdown": "..." },
    { "titulo": "Entendendo na Prática", "tipo": "entendendo_na_pratica", "markdown": "..." },
    { "titulo": "Quadro Comparativo", "tipo": "quadro_comparativo", "markdown": "..." },
    { "titulo": "Dicas de Provas", "tipo": "dicas_provas", "markdown": "..." },
    { "titulo": "Síntese Final", "tipo": "sintese_final", "markdown": "..." }
  ]
}

## REGRAS DE FORMATAÇÃO:
- Escape aspas duplas como \\"
- Use \\n para quebras de linha
- ⚠️ PROIBIDO usar numeração decimal (1.1, 1.2, 2.1.1)

Retorne APENAS o JSON válido, sem texto adicional.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumo_id } = await req.json();
    
    if (!resumo_id) {
      return new Response(
        JSON.stringify({ error: "resumo_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar se o resumo existe
    const { data: resumo, error: resumoError } = await supabase
      .from("RESUMO")
      .select("id, subtema, conteudo_gerado")
      .eq("id", resumo_id)
      .single();

    if (resumoError || !resumo) {
      return new Response(
        JSON.stringify({ error: "Resumo não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const conteudoAtual = resumo.conteudo_gerado as unknown;
    const jaTemV3 = isConteudoGeradoV3(conteudoAtual);
    const jaTemV2 = isConteudoGeradoV2(conteudoAtual);

    // Se já tem conteúdo no formato V3 completo (9 páginas), retornar
    if (conteudoAtual && jaTemV3) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Conteúdo já existe (v3 completo)",
          resumo_id,
          status: "concluido",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Se tem V2 (6-8 páginas), verificar se precisa de upgrade para V3
    if (conteudoAtual && jaTemV2 && !jaTemV3) {
      const paginasFaltantes = getPaginasFaltantes(conteudoAtual as any);
      
      if (paginasFaltantes.length > 0) {
        console.log(`[Main] Conteúdo V2 detectado. Faltam páginas: ${paginasFaltantes.join(', ')}. Iniciando upgrade para V3...`);
        EdgeRuntime.waitUntil(upgradeParaV3(resumo_id, conteudoAtual as any, paginasFaltantes));
        
        return new Response(
          JSON.stringify({
            success: true,
            message: `Atualizando conteúdo: gerando ${paginasFaltantes.join(', ')}`,
            resumo_id,
            status: "atualizando",
            paginas_faltantes: paginasFaltantes
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Se existe conteúdo antigo (não é V2 nem V3), zera para regenerar
    if (conteudoAtual && !jaTemV2) {
      console.log(`[Main] Conteúdo muito antigo detectado. Forçando regeneração completa no resumo ${resumo_id}`);
      await supabase
        .from("RESUMO")
        .update({ conteudo_gerado: null, ultima_atualizacao: new Date().toISOString() })
        .eq("id", resumo_id);
    }

    // Iniciar geração em background
    console.log(`[Main] Iniciando geração em background para resumo ${resumo_id}`);
    EdgeRuntime.waitUntil(processarGeracaoConteudo(resumo_id));

    return new Response(
      JSON.stringify({
        success: true,
        message: conteudoAtual ? "Atualizando para o novo formato" : "Geração iniciada em segundo plano",
        resumo_id,
        status: "gerando",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
