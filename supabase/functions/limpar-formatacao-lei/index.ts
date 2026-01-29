import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para limpar formatação de texto
function limparFormatacao(texto: string): string {
  if (!texto) return '';
  
  return texto
    // Corrigir "Art. 1 **º**" para "Art. 1º"
    .replace(/Art\.\s*(\d+)\s*\*\*º\*\*/gi, 'Art. $1º')
    // Corrigir "Art. 1 **º-A**" para "Art. 1º-A"
    .replace(/Art\.\s*(\d+)\s*\*\*º-([A-Z])\*\*/gi, 'Art. $1º-$2')
    // Remover links markdown com texto entre parênteses [(texto)](url)
    .replace(/\[\(([^\]]+)\)\]\([^)]+\)/g, '($1)')
    // Remover links markdown simples [texto](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remover hífens escapados
    .replace(/\\-/g, '-')
    // Remover barras invertidas duplas
    .replace(/\\\\/g, '')
    // Remover barras invertidas simples
    .replace(/\\/g, '')
    // Remover asteriscos de negrito **texto**
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Normalizar múltiplas quebras de linha (mais de 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remover espaços extras antes de quebras de linha
    .replace(/[ \t]+\n/g, '\n')
    // Remover espaços extras múltiplos
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// Função para extrair título do final do artigo
function extrairTituloDoFinal(texto: string): { textoLimpo: string; titulo: string | null } {
  if (!texto) return { textoLimpo: '', titulo: null };
  
  // Padrão: título em negrito no final, possivelmente seguido de link
  // Ex: **Lei penal no tempo** ou **Lei penal no tempo**[(Incluído...)](url)
  const tituloRegex = /\*\*([^*\n]+)\*\*\s*(?:\[\([^\]]*\)\]\([^)]*\))?\s*$/;
  
  const match = texto.match(tituloRegex);
  
  if (match) {
    const titulo = match[1].trim();
    
    // Verificar se NÃO é um parágrafo, inciso ou alínea (esses não são títulos)
    if (
      titulo.startsWith('§') ||
      titulo.match(/^[IVXLC]+\s*[-–]/) || // Incisos romanos
      titulo.match(/^[a-z]\)/) || // Alíneas
      titulo.match(/^\d+[ºª]?\s*[-–]/) || // Artigos
      titulo.includes('Redação') ||
      titulo.includes('Incluído') ||
      titulo.includes('Revogado') ||
      titulo.includes('Vide') ||
      titulo.length > 100 // Títulos são curtos
    ) {
      return { textoLimpo: texto, titulo: null };
    }
    
    // Remover o título do final do texto
    const textoLimpo = texto.replace(tituloRegex, '').trim();
    return { textoLimpo, titulo };
  }
  
  return { textoLimpo: texto, titulo: null };
}

// Títulos conhecidos do primeiro artigo de cada lei
const primeirosTitulos: Record<string, string> = {
  'CP - Código Penal': 'Anterioridade da Lei',
  'CC - Código Civil': 'Vigência',
  'CF - Constituição Federal': 'Título I - Dos Princípios Fundamentais',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { tableName = 'CP - Código Penal', dryRun = false, atualizarArtigo1 = false } = body;
    
    // Modo para atualizar apenas o Art. 1 com o título correto
    if (atualizarArtigo1) {
      const tituloPrimeiroArtigo = primeirosTitulos[tableName];
      if (!tituloPrimeiroArtigo) {
        return new Response(JSON.stringify({
          success: false,
          message: `Título do primeiro artigo não configurado para: ${tableName}`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Buscar Art. 1
      const { data: art1, error: fetchErr } = await supabase
        .from(tableName)
        .select('id, Artigo')
        .eq('Número do Artigo', '1')
        .single();
      
      if (fetchErr || !art1) {
        return new Response(JSON.stringify({
          success: false,
          message: `Erro ao buscar Art. 1: ${fetchErr?.message}`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Verificar se já tem título
      const artigoAtual = art1.Artigo || '';
      if (artigoAtual.startsWith(tituloPrimeiroArtigo)) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Art. 1 já possui o título correto'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Adicionar título
      const novoConteudo = `${tituloPrimeiroArtigo}\n\n${limparFormatacao(artigoAtual)}`;
      
      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from(tableName)
          .update({ Artigo: novoConteudo })
          .eq('id', art1.id);
        
        if (updateErr) {
          return new Response(JSON.stringify({
            success: false,
            message: `Erro ao atualizar Art. 1: ${updateErr.message}`
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        dryRun,
        message: 'Art. 1 atualizado com título',
        antes: artigoAtual.substring(0, 200),
        depois: novoConteudo.substring(0, 200)
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`🧹 Iniciando limpeza da tabela: ${tableName}`);
    console.log(`🔍 Modo: ${dryRun ? 'DRY RUN (sem alterações)' : 'EXECUTAR'}`);

    // Buscar todos os artigos ordenados
    const { data: artigos, error: fetchError } = await supabase
      .from(tableName)
      .select('id, "Número do Artigo", Artigo, ordem_artigo')
      .order('ordem_artigo', { ascending: true });

    if (fetchError) {
      throw new Error(`Erro ao buscar artigos: ${fetchError.message}`);
    }

    if (!artigos || artigos.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Nenhum artigo encontrado na tabela'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`📊 Total de artigos encontrados: ${artigos.length}`);

    // Processar artigos e extrair títulos
    const artigosProcessados: Array<{
      id: number;
      numero: string;
      artigoOriginal: string;
      artigoLimpo: string;
      tituloExtraido: string | null;
      tituloParaAdicionar: string | null;
    }> = [];

    // Primeiro passo: extrair títulos do final de cada artigo
    for (let i = 0; i < artigos.length; i++) {
      const artigo = artigos[i];
      const { textoLimpo, titulo } = extrairTituloDoFinal(artigo.Artigo || '');
      
      artigosProcessados.push({
        id: artigo.id,
        numero: artigo['Número do Artigo'] || `${artigo.id}`,
        artigoOriginal: artigo.Artigo || '',
        artigoLimpo: textoLimpo,
        tituloExtraido: titulo,
        tituloParaAdicionar: null // Será preenchido no próximo passo
      });
    }

    // Segundo passo: atribuir títulos extraídos ao próximo artigo
    for (let i = 0; i < artigosProcessados.length - 1; i++) {
      if (artigosProcessados[i].tituloExtraido) {
        artigosProcessados[i + 1].tituloParaAdicionar = artigosProcessados[i].tituloExtraido;
      }
    }

    // Terceiro passo: limpar formatação e adicionar títulos
    const resultados = {
      total: artigos.length,
      limpos: 0,
      titulosMovidos: 0,
      erros: 0,
      exemplos: [] as Array<{ numero: string; antes: string; depois: string }>
    };

    for (const artigo of artigosProcessados) {
      try {
        // Limpar formatação
        let textoFinal = limparFormatacao(artigo.artigoLimpo);
        
        // Adicionar título no início se existir
        if (artigo.tituloParaAdicionar) {
          textoFinal = `${artigo.tituloParaAdicionar}\n\n${textoFinal}`;
          resultados.titulosMovidos++;
        }
        
        // Verificar se houve mudança
        const mudou = textoFinal !== artigo.artigoOriginal;
        
        if (mudou) {
          resultados.limpos++;
          
          // Guardar exemplos (primeiros 5)
          if (resultados.exemplos.length < 5) {
            resultados.exemplos.push({
              numero: artigo.numero,
              antes: artigo.artigoOriginal.substring(0, 300) + (artigo.artigoOriginal.length > 300 ? '...' : ''),
              depois: textoFinal.substring(0, 300) + (textoFinal.length > 300 ? '...' : '')
            });
          }
          
          // Atualizar no banco se não for dry run
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from(tableName)
              .update({ Artigo: textoFinal })
              .eq('id', artigo.id);
            
            if (updateError) {
              console.error(`❌ Erro ao atualizar Art. ${artigo.numero}: ${updateError.message}`);
              resultados.erros++;
            }
          }
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`❌ Erro no Art. ${artigo.numero}: ${errorMessage}`);
        resultados.erros++;
      }
    }

    console.log(`✅ Limpeza concluída!`);
    console.log(`📊 Artigos limpos: ${resultados.limpos}/${resultados.total}`);
    console.log(`🏷️ Títulos movidos: ${resultados.titulosMovidos}`);
    console.log(`❌ Erros: ${resultados.erros}`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      tableName,
      resultados
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro geral:', errorMessage);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
