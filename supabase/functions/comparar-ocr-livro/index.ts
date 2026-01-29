import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Calcular similaridade entre dois textos
function calcularSimilaridade(texto1: string, texto2: string): number {
  if (!texto1 || !texto2) return 0;
  
  const s1 = texto1.toLowerCase().replace(/\s+/g, ' ').trim();
  const s2 = texto2.toLowerCase().replace(/\s+/g, ' ').trim();
  
  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const palavras1 = new Set(s1.split(' '));
  const palavras2 = new Set(s2.split(' '));
  
  let intersecao = 0;
  palavras1.forEach(p => {
    if (palavras2.has(p)) intersecao++;
  });
  
  const uniao = palavras1.size + palavras2.size - intersecao;
  return Math.round((intersecao / uniao) * 100);
}

// Encontrar diferenças entre textos
function encontrarDiferencas(original: string, novo: string): string[] {
  const erros: string[] = [];
  
  if (!original || !novo) {
    erros.push('Um dos textos está vazio');
    return erros;
  }
  
  const palavrasOriginal = original.toLowerCase().split(/\s+/);
  const palavrasNovo = novo.toLowerCase().split(/\s+/);
  
  const faltandoNoOriginal = palavrasNovo.filter(p => 
    p.length > 3 && !palavrasOriginal.includes(p)
  ).slice(0, 10);
  
  if (faltandoNoOriginal.length > 0) {
    erros.push(`Palavras possivelmente faltando no original: ${faltandoNoOriginal.join(', ')}`);
  }
  
  const diffTamanho = Math.abs(palavrasOriginal.length - palavrasNovo.length);
  const percentualDiff = (diffTamanho / Math.max(palavrasOriginal.length, palavrasNovo.length)) * 100;
  
  if (percentualDiff > 20) {
    erros.push(`Diferença significativa de tamanho: ${diffTamanho} palavras (${percentualDiff.toFixed(1)}%)`);
  }
  
  return erros;
}

interface ConteudoOriginal {
  Pagina: number;
  Conteudo: string;
  TituloCapitulo: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { livroId, livroTitulo } = await req.json();
    
    if (!livroId && !livroTitulo) {
      return new Response(
        JSON.stringify({ error: 'livroId ou livroTitulo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase.from('BIBLIOTECA-CLASSICOS').select('id, livro');
    if (livroId) {
      query = query.eq('id', livroId);
    } else {
      query = query.ilike('livro', `%${livroTitulo}%`);
    }
    
    const { data: livro, error: livroError } = await query.single();

    if (livroError || !livro) {
      return new Response(
        JSON.stringify({ error: 'Livro não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Comparando OCR para: ${livro.livro}`);

    // Buscar conteúdo original
    const { data: conteudoOriginalRaw, error: originalError } = await supabase
      .from('BIBLIOTECA-LEITURA-DINAMICA')
      .select('*')
      .ilike('Titulo da Obra', `%${livro.livro.split(' ').slice(0, 3).join('%')}%`)
      .order('Pagina', { ascending: true });

    if (originalError) {
      console.error('Erro ao buscar conteúdo original:', originalError);
    }

    // Mapear para formato tipado
    const conteudoOriginal: ConteudoOriginal[] = (conteudoOriginalRaw || []).map((item: Record<string, unknown>) => ({
      Pagina: item['Pagina'] as number,
      Conteudo: item['Conteúdo'] as string || '',
      TituloCapitulo: item['Titulo do Capitulo'] as string || ''
    }));

    // Buscar OCR novo
    const { data: ocrNovo, error: ocrError } = await supabase
      .from('ocr_verificacao')
      .select('*')
      .eq('livro_id', livro.id)
      .order('pagina', { ascending: true });

    if (ocrError) {
      console.error('Erro ao buscar OCR novo:', ocrError);
    }

    const comparacoes: Array<{
      pagina: number;
      textoOriginal: string;
      textoOcr: string;
      similaridade: number;
      erros: string[];
      status: string;
    }> = [];

    if (ocrNovo && ocrNovo.length > 0) {
      for (const ocr of ocrNovo) {
        const paginaOriginal = conteudoOriginal.find(p => p.Pagina === ocr.pagina);
        const textoOriginal = paginaOriginal?.Conteudo || '';
        const textoOcr = ocr.texto_novo_ocr || '';
        
        const similaridade = calcularSimilaridade(textoOriginal, textoOcr);
        const erros = encontrarDiferencas(textoOriginal, textoOcr);
        
        await supabase
          .from('ocr_verificacao')
          .update({
            texto_original: textoOriginal,
            diferenca_percentual: 100 - similaridade,
            erros_detectados: erros,
            status: 'verificado'
          })
          .eq('id', ocr.id);

        comparacoes.push({
          pagina: ocr.pagina,
          textoOriginal: textoOriginal.substring(0, 300) + (textoOriginal.length > 300 ? '...' : ''),
          textoOcr: textoOcr.substring(0, 300) + (textoOcr.length > 300 ? '...' : ''),
          similaridade,
          erros,
          status: similaridade < 70 ? 'problema_detectado' : 'ok'
        });
      }
    }

    const totalPaginasOriginal = conteudoOriginal.length;
    const totalPaginasOcr = ocrNovo?.length || 0;
    const paginasComProblema = comparacoes.filter(c => c.similaridade < 70).length;
    const mediaSimiralidade = comparacoes.length > 0 
      ? comparacoes.reduce((sum, c) => sum + c.similaridade, 0) / comparacoes.length 
      : 0;

    return new Response(
      JSON.stringify({
        success: true,
        livro: livro.livro,
        livroId: livro.id,
        estatisticas: {
          totalPaginasOriginal,
          totalPaginasOcr,
          paginasComProblema,
          mediaSimilaridade: mediaSimiralidade.toFixed(1)
        },
        comparacoes: comparacoes.sort((a, b) => a.similaridade - b.similaridade)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro geral:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
