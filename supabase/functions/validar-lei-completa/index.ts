import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Artigo {
  numero: string;
  texto: string;
}

interface Check {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string[];
}

function extrairArtigos(texto: string): Artigo[] {
  const artigos: Artigo[] = [];
  
  // Regex para encontrar artigos
  const regexArtigo = /Art\.\s*(\d+(?:-[A-Z])?(?:\.\d+)?)\s*[º°ª]?\s*[-–.]?\s*([\s\S]*?)(?=Art\.\s*\d|$)/gi;
  
  let match;
  while ((match = regexArtigo.exec(texto)) !== null) {
    const numero = match[1].trim();
    let conteudo = match[2].trim();
    
    // Limpa o conteúdo
    conteudo = conteudo.replace(/\n{3,}/g, '\n\n').trim();
    
    if (conteudo.length > 0) {
      artigos.push({ numero, texto: conteudo });
    }
  }
  
  return artigos;
}

function verificarCabecalho(texto: string): Check {
  const upper = texto.toUpperCase();
  const temPresidencia = upper.includes('PRESIDÊNCIA DA REPÚBLICA') || upper.includes('PRESIDENCIA DA REPUBLICA');
  const temCasaCivil = upper.includes('CASA CIVIL');
  const temSubchefia = upper.includes('SUBCHEFIA');
  
  if (temPresidencia && temCasaCivil) {
    return {
      name: 'Cabeçalho Institucional',
      status: 'success',
      message: 'Cabeçalho completo encontrado'
    };
  } else if (temPresidencia || temCasaCivil) {
    return {
      name: 'Cabeçalho Institucional',
      status: 'warning',
      message: 'Cabeçalho parcial encontrado',
      details: [
        temPresidencia ? '✓ Presidência da República' : '✗ Falta Presidência da República',
        temCasaCivil ? '✓ Casa Civil' : '✗ Falta Casa Civil'
      ]
    };
  }
  
  return {
    name: 'Cabeçalho Institucional',
    status: 'error',
    message: 'Cabeçalho não encontrado'
  };
}

function verificarNumeroLei(texto: string): Check {
  const regexLei = /(LEI|DECRETO|MEDIDA PROVISÓRIA|EMENDA CONSTITUCIONAL)\s*(N[ºO°]?\.?\s*)?\d+[\d\.]*\s*,?\s*DE\s*\d{1,2}\s*DE\s*[A-ZÇÃÕÁÉÍÓÚ]+\s*DE\s*\d{4}/i;
  const match = texto.match(regexLei);
  
  if (match) {
    return {
      name: 'Número da Lei',
      status: 'success',
      message: 'Identificação da lei encontrada',
      details: [match[0]]
    };
  }
  
  return {
    name: 'Número da Lei',
    status: 'warning',
    message: 'Número/identificação da lei não encontrado no formato padrão'
  };
}

function verificarEmenta(texto: string): Check {
  // Procura por texto que parece ementa (após o número da lei, antes do preâmbulo)
  const regexEmenta = /(Dispõe|Altera|Institui|Estabelece|Regulamenta|Dá nova redação|Acrescenta|Revoga)[^.]*\./i;
  const match = texto.match(regexEmenta);
  
  if (match) {
    return {
      name: 'Ementa',
      status: 'success',
      message: 'Ementa encontrada',
      details: [match[0].substring(0, 100) + (match[0].length > 100 ? '...' : '')]
    };
  }
  
  return {
    name: 'Ementa',
    status: 'warning',
    message: 'Ementa não identificada claramente'
  };
}

function verificarPreambulo(texto: string): Check {
  const upper = texto.toUpperCase();
  const temPresidente = upper.includes('O PRESIDENTE DA REPÚBLICA') || upper.includes('A PRESIDENTE DA REPÚBLICA');
  const temFacoSaber = upper.includes('FAÇO SABER') || upper.includes('FAZ SABER');
  
  if (temPresidente && temFacoSaber) {
    return {
      name: 'Preâmbulo',
      status: 'success',
      message: 'Preâmbulo completo encontrado'
    };
  } else if (temPresidente) {
    return {
      name: 'Preâmbulo',
      status: 'warning',
      message: 'Preâmbulo parcial - encontrado "O PRESIDENTE DA REPÚBLICA"'
    };
  }
  
  return {
    name: 'Preâmbulo',
    status: 'error',
    message: 'Preâmbulo não encontrado'
  };
}

function verificarAssinatura(texto: string): Check {
  const linhas = texto.split('\n').slice(-30); // Últimas 30 linhas
  const ultimasLinhas = linhas.join('\n').toUpperCase();
  
  // Padrões de nomes de presidentes conhecidos
  const presidentes = [
    'LULA', 'DILMA', 'TEMER', 'BOLSONARO', 'FERNANDO HENRIQUE',
    'CASTELLO BRANCO', 'COSTA E SILVA', 'MÉDICI', 'GEISEL', 'FIGUEIREDO',
    'SARNEY', 'COLLOR', 'ITAMAR'
  ];
  
  const presidenteEncontrado = presidentes.find(p => ultimasLinhas.includes(p));
  
  // Verifica se tem Brasília + data
  const temBrasilia = ultimasLinhas.includes('BRASÍLIA') || ultimasLinhas.includes('BRASILIA');
  
  if (presidenteEncontrado && temBrasilia) {
    return {
      name: 'Assinatura',
      status: 'success',
      message: 'Assinatura do presidente encontrada',
      details: [`Presidente identificado: contém "${presidenteEncontrado}"`]
    };
  } else if (temBrasilia) {
    return {
      name: 'Assinatura',
      status: 'warning',
      message: 'Local e data encontrados, mas nome do presidente não identificado'
    };
  }
  
  return {
    name: 'Assinatura',
    status: 'error',
    message: 'Assinatura não encontrada'
  };
}

function verificarSequenciaArtigos(artigos: Artigo[]): { check: Check; lacunas: string[]; duplicatas: string[] } {
  const lacunas: string[] = [];
  const duplicatas: string[] = [];
  const numerosVistos = new Map<string, number>();
  
  // Conta ocorrências
  for (const artigo of artigos) {
    const count = numerosVistos.get(artigo.numero) || 0;
    numerosVistos.set(artigo.numero, count + 1);
  }
  
  // Identifica duplicatas
  for (const [numero, count] of numerosVistos) {
    if (count > 1) {
      duplicatas.push(`Art. ${numero} aparece ${count} vezes`);
    }
  }
  
  // Verifica lacunas (apenas para números simples)
  const numerosSimples = artigos
    .map(a => parseInt(a.numero))
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);
  
  if (numerosSimples.length > 1) {
    for (let i = 1; i < numerosSimples.length; i++) {
      const diff = numerosSimples[i] - numerosSimples[i - 1];
      if (diff > 1) {
        for (let j = numerosSimples[i - 1] + 1; j < numerosSimples[i]; j++) {
          lacunas.push(`Art. ${j}`);
        }
      }
    }
  }
  
  let check: Check;
  
  if (duplicatas.length === 0 && lacunas.length === 0) {
    check = {
      name: 'Sequência de Artigos',
      status: 'success',
      message: `${artigos.length} artigos em sequência correta`
    };
  } else if (duplicatas.length > 0) {
    check = {
      name: 'Sequência de Artigos',
      status: 'error',
      message: `${duplicatas.length} artigo(s) duplicado(s)`,
      details: duplicatas
    };
  } else {
    check = {
      name: 'Sequência de Artigos',
      status: 'warning',
      message: `${lacunas.length} lacuna(s) na sequência`,
      details: lacunas.slice(0, 10)
    };
  }
  
  return { check, lacunas, duplicatas };
}

function verificarParagrafosIncisos(texto: string): Check {
  const problemas: string[] = [];
  
  // Verifica parágrafos
  const paragrafos = texto.match(/§\s*\d+[º°]?/g) || [];
  const uniqueParagrafos = new Set(paragrafos.map(p => p.replace(/\s+/g, '')));
  if (paragrafos.length !== uniqueParagrafos.size) {
    problemas.push('Possíveis parágrafos duplicados');
  }
  
  // Verifica incisos
  const incisos = texto.match(/^[IVX]+\s*[-–]/gm) || [];
  
  // Verifica alíneas
  const alineas = texto.match(/^[a-z]\)\s*/gm) || [];
  
  if (problemas.length === 0) {
    return {
      name: 'Parágrafos e Incisos',
      status: 'success',
      message: `${paragrafos.length} §, ${incisos.length} incisos, ${alineas.length} alíneas`
    };
  }
  
  return {
    name: 'Parágrafos e Incisos',
    status: 'warning',
    message: 'Possíveis problemas detectados',
    details: problemas
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto } = await req.json();

    if (!texto || texto.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Texto não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validando texto com ${texto.length} caracteres...`);

    // Extrai artigos
    const artigos = extrairArtigos(texto);
    console.log(`Encontrados ${artigos.length} artigos`);

    // Executa todas as verificações
    const checks: Check[] = [];
    
    checks.push(verificarCabecalho(texto));
    checks.push(verificarNumeroLei(texto));
    checks.push(verificarEmenta(texto));
    checks.push(verificarPreambulo(texto));
    checks.push(verificarAssinatura(texto));
    
    const { check: sequenciaCheck, lacunas, duplicatas } = verificarSequenciaArtigos(artigos);
    checks.push(sequenciaCheck);
    
    checks.push(verificarParagrafosIncisos(texto));

    // Calcula score
    let score = 0;
    let totalWeight = 0;
    
    for (const check of checks) {
      totalWeight += 1;
      if (check.status === 'success') score += 1;
      else if (check.status === 'warning') score += 0.5;
    }
    
    const scorePercentual = Math.round((score / totalWeight) * 100);
    
    // Determina se é válido (score >= 70% e sem erros críticos)
    const temErrosCriticos = checks.some(c => c.status === 'error');
    const isValid = scorePercentual >= 70 && !temErrosCriticos;

    const result = {
      isValid,
      score: scorePercentual,
      checks,
      artigos: artigos.map(a => ({ numero: a.numero, texto: a.texto.substring(0, 500) })),
      totalArtigos: artigos.length,
      duplicatas,
      lacunas
    };

    console.log(`Validação concluída: ${isValid ? 'APROVADO' : 'REPROVADO'} (${scorePercentual}%)`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro ao validar:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
