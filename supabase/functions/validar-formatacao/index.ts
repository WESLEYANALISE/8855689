import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v1.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Problema {
  tipo: 'duplicata' | 'truncado' | 'quebra_linha' | 'sequencia' | 'orfao' | 'vazio';
  local: string;
  descricao: string;
  linha?: number;
  conteudo?: string;
}

interface ResultadoValidacao {
  valido: boolean;
  problemas: Problema[];
  estatisticas: {
    totalArtigos: number;
    totalParagrafos: number;
    totalIncisos: number;
    totalAlineas: number;
    problemasEncontrados: number;
  };
}

function validarFormatacao(textoFormatado: string): ResultadoValidacao {
  console.log(`🔍 [validar-formatacao ${REVISION}] Validando ${textoFormatado.length} caracteres`);
  
  const linhas = textoFormatado.split('\n');
  const problemas: Problema[] = [];
  
  // Contadores
  let totalArtigos = 0;
  let totalParagrafos = 0;
  let totalIncisos = 0;
  let totalAlineas = 0;
  
  // Rastreadores para detectar duplicatas e sequência
  const artigosVistos = new Map<string, number>(); // numero -> linha
  const sequenciaArtigos: number[] = [];
  let ultimoArtigo = '';
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const numLinha = i + 1;
    
    // Verificar truncamento (...)
    if (linha.includes('...') && !linha.includes('[TABELA]')) {
      // Verificar se é reticência real ou parte do texto legal
      const contemArtigo = linha.match(/\[ARTIGO\]:|Art\.\s*\d+/i);
      const contemInciso = linha.match(/\[INCISO\]:|^[IVXLC]+\s*[-–]/);
      const contemAlinea = linha.match(/\[ALINEA\]:|^[a-z]\)/i);
      
      if (contemArtigo || contemInciso || contemAlinea) {
        problemas.push({
          tipo: 'truncado',
          local: `Linha ${numLinha}`,
          descricao: 'Elemento truncado com reticências (...)',
          linha: numLinha,
          conteudo: linha.substring(0, 100)
        });
      }
    }
    
    // Verificar quebra de linha dupla dentro de elementos
    if (i > 0 && linhas[i - 1] === '' && linha.startsWith('  ')) {
      // Linha anterior vazia e atual com indentação pode indicar quebra indevida
      const elementoAnterior = linhas.slice(0, i).reverse().find(l => l.match(/^\[/));
      if (elementoAnterior && !elementoAnterior.includes('[TABELA]')) {
        problemas.push({
          tipo: 'quebra_linha',
          local: `Linha ${numLinha}`,
          descricao: 'Possível quebra de linha dupla dentro de elemento',
          linha: numLinha,
          conteudo: linha.substring(0, 100)
        });
      }
    }
    
    // Extrair e validar artigos
    const matchArtigo = linha.match(/\[ARTIGO\]:\s*Art\.?\s*(\d+)(?:[º°o])?(?:-([A-Z]))?/i);
    if (matchArtigo) {
      totalArtigos++;
      const numArtigo = matchArtigo[1] + (matchArtigo[2] || '');
      const numArtigoInt = parseInt(matchArtigo[1]);
      
      // Verificar duplicata
      if (artigosVistos.has(numArtigo)) {
        const linhaAnterior = artigosVistos.get(numArtigo);
        problemas.push({
          tipo: 'duplicata',
          local: `Art. ${numArtigo}`,
          descricao: `Artigo duplicado (primeira ocorrência na linha ${linhaAnterior})`,
          linha: numLinha,
          conteudo: linha.substring(0, 100)
        });
      } else {
        artigosVistos.set(numArtigo, numLinha);
        if (!matchArtigo[2]) { // Só verificar sequência para artigos sem letra
          sequenciaArtigos.push(numArtigoInt);
        }
      }
      
      ultimoArtigo = numArtigo;
      
      // Verificar artigo vazio
      const textoArtigo = linha.replace(/\[ARTIGO\]:\s*Art\.?\s*\d+[º°o]?(?:-[A-Z])?\.?\s*/i, '').trim();
      if (textoArtigo.length < 10) {
        problemas.push({
          tipo: 'vazio',
          local: `Art. ${numArtigo}`,
          descricao: 'Artigo com pouco ou nenhum conteúdo',
          linha: numLinha,
          conteudo: linha
        });
      }
    }
    
    // Contar parágrafos
    if (linha.match(/\[PARAGRAFO\]:/)) {
      totalParagrafos++;
    }
    
    // Contar e validar incisos
    const matchInciso = linha.match(/\[INCISO\]:\s*([IVXLC]+)\s*[-–]/);
    if (matchInciso) {
      totalIncisos++;
      
      // Verificar inciso vazio
      const textoInciso = linha.replace(/\[INCISO\]:\s*[IVXLC]+\s*[-–]\s*/i, '').trim();
      if (textoInciso.length < 5) {
        problemas.push({
          tipo: 'vazio',
          local: `Inciso ${matchInciso[1]} do Art. ${ultimoArtigo}`,
          descricao: 'Inciso com pouco ou nenhum conteúdo',
          linha: numLinha,
          conteudo: linha
        });
      }
    }
    
    // Contar alíneas
    if (linha.match(/\[ALINEA\]:/)) {
      totalAlineas++;
    }
  }
  
  // Verificar sequência de artigos (lacunas)
  sequenciaArtigos.sort((a, b) => a - b);
  for (let i = 1; i < sequenciaArtigos.length; i++) {
    const anterior = sequenciaArtigos[i - 1];
    const atual = sequenciaArtigos[i];
    
    // Permitir lacunas de até 5 artigos (pode ter artigos revogados)
    if (atual - anterior > 5 && atual - anterior < 100) {
      problemas.push({
        tipo: 'sequencia',
        local: `Entre Art. ${anterior} e Art. ${atual}`,
        descricao: `Possível lacuna na sequência (${atual - anterior - 1} artigos faltando)`,
      });
    }
  }
  
  const resultado: ResultadoValidacao = {
    valido: problemas.length === 0,
    problemas,
    estatisticas: {
      totalArtigos,
      totalParagrafos,
      totalIncisos,
      totalAlineas,
      problemasEncontrados: problemas.length
    }
  };
  
  console.log(`✅ Validação concluída: ${problemas.length} problemas encontrados`);
  if (problemas.length > 0) {
    console.log(`📋 Problemas:`);
    problemas.forEach((p, i) => {
      console.log(`  ${i + 1}. [${p.tipo}] ${p.local}: ${p.descricao}`);
    });
  }
  
  return resultado;
}

serve(async (req) => {
  console.log(`🚀 [validar-formatacao ${REVISION}] Iniciando...`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoFormatado } = await req.json();
    
    if (!textoFormatado) {
      return new Response(
        JSON.stringify({ success: false, error: "Texto formatado é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 Texto formatado: ${textoFormatado.length} caracteres`);
    
    const inicio = Date.now();
    const resultado = validarFormatacao(textoFormatado);
    const tempoMs = Date.now() - inicio;
    
    console.log(`⏱️ Tempo de validação: ${tempoMs}ms`);

    return new Response(
      JSON.stringify({ 
        success: true,
        ...resultado,
        tempoMs,
        revisao: REVISION
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Erro: ${msg}`);
    return new Response(
      JSON.stringify({ success: false, error: msg, revisao: REVISION }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
