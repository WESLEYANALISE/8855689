import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================
// SEPARAR TÍTULOS EM CAIXA ALTA (LIVRO, SISTEMA, TÍTULO, etc.)
// ============================================================
function separarTitulosEmCaixaAlta(texto: string): string {
  let resultado = texto;
  
  // CAPÍTULO I/II/III + "DA/DO/DAS/DOS/DE" + TÍTULO DESCRITIVO
  resultado = resultado.replace(
    /(CAPÍTULO\s+[IVXLCDM]+)\s+(D[AEOA]S?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi,
    '$1\n\n$2'
  );
  
  // CAPÍTULO I/II/III + texto em caixa alta (sem preposição)
  resultado = resultado.replace(
    /(CAPÍTULO\s+[IVXLCDM]+)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})/g,
    '$1\n\n$2'
  );
  
  // TÍTULO I/II/III + "DA/DO/DAS/DOS/DE" + TÍTULO DESCRITIVO
  resultado = resultado.replace(
    /(TÍTULO\s+[IVXLCDM]+)\s+(D[AEOA]S?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi,
    '$1\n\n$2'
  );
  
  // TÍTULO I/II/III + texto em caixa alta (sem preposição)
  resultado = resultado.replace(
    /(TÍTULO\s+[IVXLCDM]+)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})/g,
    '$1\n\n$2'
  );
  
  // SEÇÃO I/II/III + "DA/DO/DAS/DOS/DE" + TÍTULO DESCRITIVO
  resultado = resultado.replace(
    /(SEÇÃO\s+[IVXLCDM]+)\s+(D[AEOA]S?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi,
    '$1\n\n$2'
  );
  
  // SEÇÃO I/II/III + texto em caixa alta (sem preposição)
  resultado = resultado.replace(
    /(SEÇÃO\s+[IVXLCDM]+)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})/g,
    '$1\n\n$2'
  );
  
  // SUBSEÇÃO I/II/III + "DA/DO/DAS/DOS/DE" + TÍTULO DESCRITIVO
  resultado = resultado.replace(
    /(SUBSEÇÃO\s+[IVXLCDM]+)\s+(D[AEOA]S?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi,
    '$1\n\n$2'
  );
  
  // LIVRO PRIMEIRO/SEGUNDO/I/II + "DA/DO/DAS/DOS/DE" + TÍTULO DESCRITIVO
  resultado = resultado.replace(
    /(LIVRO\s+(?:PRIMEIRO|SEGUNDO|TERCEIRO|QUARTO|QUINTO|[IVXLCDM]+))\s+(D[AEOA]S?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi,
    '$1\n\n$2'
  );
  
  // LIVRO + texto em caixa alta (sem preposição)
  resultado = resultado.replace(
    /(LIVRO\s+(?:PRIMEIRO|SEGUNDO|TERCEIRO|QUARTO|QUINTO|[IVXLCDM]+))\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})/g,
    '$1\n\n$2'
  );
  
  // PARTE I/II/GERAL/ESPECIAL + "DA/DO/DAS/DOS/DE" + TÍTULO DESCRITIVO
  resultado = resultado.replace(
    /(PARTE\s+(?:GERAL|ESPECIAL|PRIMEIRA|SEGUNDA|TERCEIRA|[IVXLCDM]+))\s+(D[AEOA]S?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi,
    '$1\n\n$2'
  );
  
  // Separar título em CAIXA ALTA completo de "TÍTULO/CAPÍTULO"
  resultado = resultado.replace(
    /([A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,})+)\s+(TÍTULO|CAPÍTULO|SEÇÃO|LIVRO|PARTE)/g,
    '$1\n\n$2'
  );
  
  console.log('[TITULOS CAIXA ALTA] Separação aplicada');
  
  return resultado;
}

// ============================================================
// JUNTAR MARCADOR COM SEU CONTEÚDO (Art. + texto na mesma linha)
// ============================================================
function juntarMarcadorComConteudo(texto: string): string {
  let resultado = texto;
  
  // Art. 12.\n texto → Art. 12. texto
  resultado = resultado.replace(/(Art\.?\s*\d+[º°.-]*\.?)\s*\n+\s*([a-záéíóúâêôãõçA-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi, '$1 $2');
  
  // § 1º\n texto → § 1º texto
  resultado = resultado.replace(/(§\s*\d+[º°]?\.?)\s*\n+\s*([a-záéíóúâêôãõçA-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi, '$1 $2');
  
  // Parágrafo único.\n texto → Parágrafo único. texto
  resultado = resultado.replace(/(Parágrafo\s+único\.?)\s*\n+\s*([a-záéíóúâêôãõçA-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi, '$1 $2');
  
  // I –\n texto → I – texto (incisos romanos)
  resultado = resultado.replace(/([IVXLCDM]+\s*[-–—])\s*\n+\s*([a-záéíóúâêôãõçA-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi, '$1 $2');
  
  // a)\n texto → a) texto (alíneas)
  resultado = resultado.replace(/([a-z]\))\s*\n+\s*([a-záéíóúâêôãõçA-ZÁÉÍÓÚÂÊÔÃÕÇ])/gi, '$1 $2');
  
  console.log('[JUNTAR MARCADOR] Marcadores unidos ao conteúdo');
  
  return resultado;
}

// ============================================================
// JUNTAR ANOTAÇÕES LEGISLATIVAS NA MESMA LINHA
// ============================================================
function juntarAnotacoesLegislativas(texto: string): string {
  let resultado = texto;
  
  const padraoAnotacao = /\n+\s*(\((?:Incluíd[oa]|Redação\s+dada|Revogad[oa]|Vide|Vigência|Produção\s+de\s+efeito|Regulamento)[^\)]+\))/gi;
  
  resultado = resultado.replace(padraoAnotacao, ' $1');
  
  // Também tratar múltiplas anotações em sequência
  resultado = resultado.replace(/\)\s*\n+\s*\(/g, ') (');
  
  console.log('[ANOTACOES] Anotações legislativas unidas ao texto');
  
  return resultado;
}

// ============================================================
// TRATAR ARTIGOS COMPLETAMENTE REVOGADOS E DUPLICATAS
// (Preserva linhas finais: data, assinaturas, presidente)
// ============================================================
function tratarRevogadosEDuplicatas(texto: string): string {
  let resultado = texto;
  const linhas = resultado.split('\n');
  const linhasFinais: string[] = [];
  
  const elementosVistos = new Map<string, { linha: string; indice: number }>();
  
  // Identificar onde começa o final da lei (assinaturas)
  // Procurar por padrões como "Brasília, X de Y de ZZZZ" ou nomes em CAIXA ALTA após o último Art.
  let indiceFinalLei = linhas.length;
  for (let i = linhas.length - 1; i >= 0; i--) {
    const linha = linhas[i].trim();
    if (linha.match(/^Art\.?\s*\d/i)) {
      // Encontrou o último artigo, tudo depois é o final
      indiceFinalLei = i + 1;
      break;
    }
  }
  
  // Processar linhas do corpo (artigos)
  for (let i = 0; i < indiceFinalLei; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    
    let chaveElemento = '';
    
    // Art. X
    const matchArt = linha.match(/^Art\.?\s*(\d+)[º°.-]*/i);
    if (matchArt) {
      chaveElemento = `art_${matchArt[1]}`;
    }
    
    // § X dentro de artigo
    const matchParagrafo = linha.match(/^§\s*(\d+)/i);
    if (matchParagrafo && linhasFinais.length > 0) {
      const ultimoArt = [...elementosVistos.keys()].filter(k => k.startsWith('art_')).pop();
      if (ultimoArt) {
        chaveElemento = `${ultimoArt}_par_${matchParagrafo[1]}`;
      }
    }
    
    // Inciso (I, II, III...)
    const matchInciso = linha.match(/^([IVXLCDM]+)\s*[-–—]/i);
    if (matchInciso) {
      const ultimoArt = [...elementosVistos.keys()].filter(k => k.startsWith('art_')).pop();
      if (ultimoArt) {
        chaveElemento = `${ultimoArt}_inc_${matchInciso[1]}`;
      }
    }
    
    // Alínea (a), b), c)...)
    const matchAlinea = linha.match(/^([a-z])\)/i);
    if (matchAlinea) {
      const ultimoArt = [...elementosVistos.keys()].filter(k => k.startsWith('art_')).pop();
      if (ultimoArt) {
        chaveElemento = `${ultimoArt}_ali_${matchAlinea[1]}`;
      }
    }
    
    // Se é um elemento estrutural, registrar
    if (chaveElemento) {
      if (elementosVistos.has(chaveElemento)) {
        const anterior = elementosVistos.get(chaveElemento)!;
        console.log(`[DUPLICATA] ${chaveElemento} - usando versão mais recente (linha ${i + 1})`);
        const indiceRemover = linhasFinais.indexOf(anterior.linha);
        if (indiceRemover > -1) {
          linhasFinais.splice(indiceRemover, 1);
        }
      }
      elementosVistos.set(chaveElemento, { linha, indice: i });
    }
    
    linhasFinais.push(linha);
  }
  
  // PRESERVAR linhas finais (data, assinaturas, presidente, mensagem final)
  // Estas NÃO devem ser processadas como artigos
  for (let i = indiceFinalLei; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (linha) {
      linhasFinais.push(linha);
    }
  }
  
  console.log(`[DUPLICATAS] Preservadas ${linhas.length - indiceFinalLei} linhas finais (assinaturas/data)`);
  
  return linhasFinais.join('\n');
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { chunksCorrigidos } = await req.json();
    
    if (!chunksCorrigidos || !Array.isArray(chunksCorrigidos) || chunksCorrigidos.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'chunksCorrigidos é obrigatório (array)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`[MONTAR] Recebidos ${chunksCorrigidos.length} chunks para montagem`);
    
    // ETAPA 1: Juntar chunks
    let textoFinal = chunksCorrigidos.join('\n\n');
    console.log(`[MONTAR] Texto juntado: ${textoFinal.length} chars`);
    
    // ETAPA 2: Juntar marcador com conteúdo (Art. + texto na mesma linha)
    textoFinal = juntarMarcadorComConteudo(textoFinal);
    
    // ETAPA 3: Juntar anotações legislativas
    textoFinal = juntarAnotacoesLegislativas(textoFinal);
    
    // ETAPA 4: Tratar duplicatas
    textoFinal = tratarRevogadosEDuplicatas(textoFinal);
    
    // ETAPA 5: Separar títulos em caixa alta
    textoFinal = separarTitulosEmCaixaAlta(textoFinal);
    
    // ETAPA 6: Limpeza final
    textoFinal = textoFinal.replace(/\[LINHA\s*EM\s*BRANCO\]/gi, '');
    textoFinal = textoFinal.replace(/\{LINHA\s*EM\s*BRANCO\}/gi, '');
    textoFinal = textoFinal.replace(/(Jurídicos)\s*(LEI)/gi, '$1\n\n$2');
    textoFinal = textoFinal.replace(/\n{3,}/g, '\n\n');
    textoFinal = textoFinal.replace(/  +/g, ' ');
    textoFinal = textoFinal.split('\n').map(l => l.trim()).filter(l => l).join('\n');
    textoFinal = textoFinal.trim();
    
    const quebrasFinais = (textoFinal.match(/\n/g) || []).length;
    console.log(`[MONTAR] Texto final: ${textoFinal.length} chars, ${quebrasFinais} quebras`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        textoCorrigido: textoFinal,
        chunksProcessados: chunksCorrigidos.length,
        quebrasFinais
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('[ERROR]', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
