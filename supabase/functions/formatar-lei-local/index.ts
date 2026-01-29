import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const REVISION = "v1.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex patterns para identificar elementos da lei
const PATTERNS = {
  // Cabeçalho da lei (LEI Nº, DECRETO, etc.) - mais específico
  cabecalho: /^(LEI(?:\s+COMPLEMENTAR)?|DECRETO(?:-LEI)?|MEDIDA PROVISÓRIA|EMENDA CONSTITUCIONAL|RESOLUÇÃO|PORTARIA)\s*(?:N[ºo°]?\s*)?[\d.,]+(?:-[A-Z])?\s*,?\s*DE\s+\d+\s+DE\s+\w+\s+DE\s+\d{4}\.?$/im,
  
  // Estrutura hierárquica
  titulo: /^TÍTULO\s+([IVXLC]+)(?:\s*[-–]\s*|\s+)(.*)/i,
  capitulo: /^CAPÍTULO\s+([IVXLC]+)(?:\s*[-–]\s*|\s+)(.*)/i,
  secao: /^Seção\s+([IVXLC]+)(?:\s*[-–]\s*|\s+)(.*)/i,
  subsecao: /^Subseção\s+([IVXLC]+)(?:\s*[-–]\s*|\s+)(.*)/i,
  
  // Artigos
  artigo: /^Art\.?\s*(\d+)(?:[º°o])?(?:-([A-Z]))?\.?\s*/i,
  
  // Parágrafos
  paragrafoUnico: /^Parágrafo\s+único\.?\s*/i,
  paragrafo: /^§\s*(\d+)[º°o]?\.?\s*/i,
  
  // Incisos (números romanos) - deve começar com romano seguido de hífen
  inciso: /^([IVXLCDM]+)\s*[-–]\s*/,
  
  // Alíneas
  alinea: /^([a-z])\)\s*/i,
  
  // Assinaturas e notas finais
  assinatura: /^(Brasília|Este texto não substitui|Publicado|DOU de|Em exercício|\*)/i,
  
  // Preâmbulo
  preambulo: /^(O PRESIDENTE DA REPÚBLICA|O CONGRESSO NACIONAL|O VICE-PRESIDENTE|Faço saber)/i,
  
  // Ementa real (começa com verbos específicos e é longa)
  ementaReal: /^(Dispõe sobre|Institui|Altera|Acrescenta|Revoga|Regulamenta|Estabelece|Cria|Define|Dá nova redação)/i,
};

// Linhas que devem ser ignoradas (cabeçalho do site, não da lei)
const LINHAS_IGNORAR = [
  /^Presidência da República$/i,
  /^Casa Civil$/i,
  /^Subchefia para Assuntos Jurídicos$/i,
  /^Secretaria-Geral$/i,
  /^Mensagem de veto$/i,
  /^Vigência$/i,
  /^Regulamento$/i,
  /^Texto compilado$/i,
  /^\|.*\|$/, // Linhas de tabela markdown
  /^-{3,}$/, // Separadores
  /^L\d+$/, // Códigos como L11959
];

// Normalizar ordinais (1o -> 1º)
function normalizarOrdinal(texto: string): string {
  return texto
    .replace(/(\d+)o(?=\s|\.|\,|\)|$)/g, '$1º')
    .replace(/(\d+)O(?=\s|\.|\,|\)|$)/g, '$1º')
    .replace(/§\s*(\d+)o/g, '§ $1º')
    .replace(/Art\.?\s*(\d+)o/gi, 'Art. $1º');
}

// Limpar texto de caracteres problemáticos
function limparTexto(texto: string): string {
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/  +/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}

// Verificar se é um número romano válido
function isRomanoValido(texto: string): boolean {
  // Deve ser um número romano válido (não apenas letras aleatórias)
  const romanoRegex = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i;
  return romanoRegex.test(texto) && texto.length > 0;
}

interface ElementoLei {
  tipo: string;
  conteudo: string;
  numero?: string;
}

function formatarLeiLocal(textoBruto: string): { formatado: string; elementos: ElementoLei[] } {
  console.log(`📋 [formatar-lei-local ${REVISION}] Processando ${textoBruto.length} caracteres`);
  
  const texto = limparTexto(normalizarOrdinal(textoBruto));
  const linhas = texto.split('\n');
  const elementos: ElementoLei[] = [];
  const saida: string[] = [];
  
  let ultimoArtigo = '';
  let ultimoInciso = '';
  let ultimaAlinea = '';
  let elementoAnterior: ElementoLei | null = null;
  let encontrouPrimeiroArtigo = false;
  let bufferEmenta: string[] = [];
  let encontrouCabecalho = false;
  
  // Conjunto para rastrear duplicatas
  const artigosVistos = new Set<string>();
  const incisosVistos = new Map<string, Set<string>>(); // artigo -> set de incisos
  const alineasVistas = new Map<string, Set<string>>(); // artigo+inciso -> set de alíneas
  
  for (let i = 0; i < linhas.length; i++) {
    let linha = linhas[i].trim();
    if (!linha) continue;
    
    // Verificar se deve ignorar esta linha
    if (LINHAS_IGNORAR.some(pattern => pattern.test(linha))) {
      console.log(`🚫 Ignorando linha: ${linha.substring(0, 50)}...`);
      continue;
    }
    
    // Verificar cabeçalho da lei (LEI Nº X, DE Y DE Z DE ANO)
    const matchCabecalho = linha.match(PATTERNS.cabecalho);
    if (matchCabecalho && !encontrouCabecalho) {
      encontrouCabecalho = true;
      saida.push(`[CABECALHO]: ${linha}`);
      elementos.push({ tipo: 'CABECALHO', conteudo: linha });
      continue;
    }
    
    // Verificar título
    const matchTitulo = linha.match(PATTERNS.titulo);
    if (matchTitulo) {
      // Flush buffer de ementa se houver
      if (bufferEmenta.length > 0 && !encontrouPrimeiroArtigo) {
        const ementaCompleta = bufferEmenta.join(' ');
        saida.push(`[EMENTA]: ${ementaCompleta}`);
        elementos.push({ tipo: 'EMENTA', conteudo: ementaCompleta });
        bufferEmenta = [];
      }
      saida.push(`[TITULO]: ${linha}`);
      elementos.push({ tipo: 'TITULO', conteudo: linha, numero: matchTitulo[1] });
      continue;
    }
    
    // Verificar capítulo
    const matchCapitulo = linha.match(PATTERNS.capitulo);
    if (matchCapitulo) {
      // Flush buffer de ementa se houver
      if (bufferEmenta.length > 0 && !encontrouPrimeiroArtigo) {
        const ementaCompleta = bufferEmenta.join(' ');
        saida.push(`[EMENTA]: ${ementaCompleta}`);
        elementos.push({ tipo: 'EMENTA', conteudo: ementaCompleta });
        bufferEmenta = [];
      }
      saida.push(`[CAPITULO]: ${linha}`);
      elementos.push({ tipo: 'CAPITULO', conteudo: linha, numero: matchCapitulo[1] });
      continue;
    }
    
    // Verificar seção
    const matchSecao = linha.match(PATTERNS.secao);
    if (matchSecao) {
      saida.push(`[SECAO]: ${linha}`);
      elementos.push({ tipo: 'SECAO', conteudo: linha, numero: matchSecao[1] });
      continue;
    }
    
    // Verificar subseção
    const matchSubsecao = linha.match(PATTERNS.subsecao);
    if (matchSubsecao) {
      saida.push(`[SUBSECAO]: ${linha}`);
      elementos.push({ tipo: 'SUBSECAO', conteudo: linha, numero: matchSubsecao[1] });
      continue;
    }
    
    // Verificar preâmbulo
    if (PATTERNS.preambulo.test(linha) && !encontrouPrimeiroArtigo) {
      // Flush buffer de ementa primeiro
      if (bufferEmenta.length > 0) {
        const ementaCompleta = bufferEmenta.join(' ');
        saida.push(`[EMENTA]: ${ementaCompleta}`);
        elementos.push({ tipo: 'EMENTA', conteudo: ementaCompleta });
        bufferEmenta = [];
      }
      saida.push(`[PREAMBULO]: ${linha}`);
      elementos.push({ tipo: 'PREAMBULO', conteudo: linha });
      elementoAnterior = elementos[elementos.length - 1];
      continue;
    }
    
    // Verificar artigo - IMPORTANTE: só considerar como novo artigo se:
    // 1. A linha COMEÇA com "Art." (não é uma referência no meio do texto)
    // 2. NÃO é uma referência como "art. 165 da Constituição" (geralmente minúsculo)
    // 3. Tem texto significativo após o número do artigo
    const matchArtigo = linha.match(PATTERNS.artigo);
    if (matchArtigo) {
      // Verificar se é uma referência a artigo (minúsculo) e não um artigo real
      // Artigos reais começam com "Art." maiúsculo e têm conteúdo próprio
      const artigoPrefix = linha.substring(0, matchArtigo[0].length);
      const textoAposArtigo = linha.substring(matchArtigo[0].length).trim();
      
      // Se começa com "art." minúsculo, é uma referência, não um artigo novo
      if (artigoPrefix.startsWith('art.')) {
        // Tratar como continuação do elemento anterior
        if (elementoAnterior && saida.length > 0) {
          const ultimoIndex = saida.length - 1;
          saida[ultimoIndex] += ' ' + linha;
          elementoAnterior.conteudo += ' ' + linha;
        }
        continue;
      }
      
      // Se é muito curto (só "Art. 165" ou "Art. 165,") provavelmente é referência
      // Artigos reais têm conteúdo descritivo após o número
      if (textoAposArtigo.length < 10 && (textoAposArtigo.endsWith(',') || textoAposArtigo.endsWith('da') || textoAposArtigo.endsWith('do') || textoAposArtigo === '')) {
        // Verificar se a próxima linha NÃO começa com marcador estrutural
        // Se não começa, provavelmente é continuação de referência
        const proxLinha = (i + 1 < linhas.length) ? linhas[i + 1].trim() : '';
        const proxLinhaEhMarcador = PATTERNS.artigo.test(proxLinha) || 
                                     PATTERNS.paragrafo.test(proxLinha) || 
                                     PATTERNS.inciso.test(proxLinha) ||
                                     PATTERNS.titulo.test(proxLinha) ||
                                     PATTERNS.capitulo.test(proxLinha);
        
        if (!proxLinhaEhMarcador && proxLinha && !proxLinha.startsWith('§')) {
          // É uma referência quebrada, juntar com próxima linha
          if (elementoAnterior && saida.length > 0) {
            const ultimoIndex = saida.length - 1;
            saida[ultimoIndex] += ' ' + linha;
            elementoAnterior.conteudo += ' ' + linha;
          }
          continue;
        }
      }
      
      // Flush buffer de ementa se ainda tiver
      if (bufferEmenta.length > 0 && !encontrouPrimeiroArtigo) {
        const ementaCompleta = bufferEmenta.join(' ');
        saida.push(`[EMENTA]: ${ementaCompleta}`);
        elementos.push({ tipo: 'EMENTA', conteudo: ementaCompleta });
        bufferEmenta = [];
      }
      
      encontrouPrimeiroArtigo = true;
      const numArtigo = matchArtigo[1] + (matchArtigo[2] || '');
      
      // Verificar duplicata
      if (artigosVistos.has(numArtigo)) {
        console.log(`⚠️ Artigo duplicado ignorado: Art. ${numArtigo}`);
        continue; // Ignorar duplicata
      }
      
      artigosVistos.add(numArtigo);
      ultimoArtigo = numArtigo;
      incisosVistos.set(numArtigo, new Set());
      
      saida.push(`[ARTIGO]: ${linha}`);
      elementos.push({ tipo: 'ARTIGO', conteudo: linha, numero: numArtigo });
      elementoAnterior = elementos[elementos.length - 1];
      continue;
    }
    
    // Verificar parágrafo único
    if (PATTERNS.paragrafoUnico.test(linha)) {
      saida.push(`[PARAGRAFO]: ${linha}`);
      elementos.push({ tipo: 'PARAGRAFO', conteudo: linha, numero: 'único' });
      elementoAnterior = elementos[elementos.length - 1];
      continue;
    }
    
    // Verificar parágrafo numerado
    const matchParagrafo = linha.match(PATTERNS.paragrafo);
    if (matchParagrafo) {
      saida.push(`[PARAGRAFO]: ${linha}`);
      elementos.push({ tipo: 'PARAGRAFO', conteudo: linha, numero: matchParagrafo[1] });
      elementoAnterior = elementos[elementos.length - 1];
      continue;
    }
    
    // Verificar inciso (somente após primeiro artigo e com romano válido)
    const matchInciso = linha.match(PATTERNS.inciso);
    if (matchInciso && encontrouPrimeiroArtigo) {
      const numInciso = matchInciso[1];
      
      // Verificar se é um número romano válido
      if (!isRomanoValido(numInciso)) {
        // Não é romano válido, tratar como continuação
        if (elementoAnterior && saida.length > 0) {
          const ultimoIndex = saida.length - 1;
          saida[ultimoIndex] += ' ' + linha;
          elementoAnterior.conteudo += ' ' + linha;
        }
        continue;
      }
      
      // Verificar duplicata de inciso dentro do mesmo artigo
      const incisosDoArtigo = incisosVistos.get(ultimoArtigo) || new Set();
      if (incisosDoArtigo.has(numInciso)) {
        console.log(`⚠️ Inciso duplicado ignorado: ${numInciso} do Art. ${ultimoArtigo}`);
        continue;
      }
      
      incisosDoArtigo.add(numInciso);
      incisosVistos.set(ultimoArtigo, incisosDoArtigo);
      ultimoInciso = numInciso;
      alineasVistas.set(`${ultimoArtigo}-${numInciso}`, new Set());
      
      saida.push(`[INCISO]: ${linha}`);
      elementos.push({ tipo: 'INCISO', conteudo: linha, numero: numInciso });
      elementoAnterior = elementos[elementos.length - 1];
      continue;
    }
    
    // Verificar alínea (somente após primeiro artigo)
    const matchAlinea = linha.match(PATTERNS.alinea);
    if (matchAlinea && encontrouPrimeiroArtigo) {
      const letra = matchAlinea[1].toLowerCase();
      const chaveAlinea = `${ultimoArtigo}-${ultimoInciso}`;
      
      // Verificar duplicata de alínea
      const alineasDoInciso = alineasVistas.get(chaveAlinea) || new Set();
      if (alineasDoInciso.has(letra)) {
        console.log(`⚠️ Alínea duplicada ignorada: ${letra}) do inciso ${ultimoInciso} Art. ${ultimoArtigo}`);
        continue;
      }
      
      alineasDoInciso.add(letra);
      alineasVistas.set(chaveAlinea, alineasDoInciso);
      ultimaAlinea = letra;
      
      saida.push(`[ALINEA]: ${linha}`);
      elementos.push({ tipo: 'ALINEA', conteudo: linha, numero: letra });
      elementoAnterior = elementos[elementos.length - 1];
      continue;
    }
    
    // Verificar assinatura/nota (geralmente no final)
    if (PATTERNS.assinatura.test(linha)) {
      saida.push(`[ASSINATURA]: ${linha}`);
      elementos.push({ tipo: 'ASSINATURA', conteudo: linha });
      elementoAnterior = null; // Reset para não concatenar assinaturas
      continue;
    }
    
    // Se ainda não encontrou artigo, é parte da ementa ou preâmbulo
    if (!encontrouPrimeiroArtigo && encontrouCabecalho) {
      // Acumular no buffer de ementa
      bufferEmenta.push(linha);
      continue;
    }
    
    // Continuação do elemento anterior (texto que não começa com marcador)
    if (elementoAnterior && saida.length > 0 && encontrouPrimeiroArtigo) {
      // Anexar ao último elemento
      const ultimoIndex = saida.length - 1;
      saida[ultimoIndex] += ' ' + linha;
      elementoAnterior.conteudo += ' ' + linha;
    }
  }
  
  // Flush final do buffer de ementa (se não encontrou artigos)
  if (bufferEmenta.length > 0) {
    const ementaCompleta = bufferEmenta.join(' ');
    saida.push(`[EMENTA]: ${ementaCompleta}`);
    elementos.push({ tipo: 'EMENTA', conteudo: ementaCompleta });
  }
  
  const formatado = saida.join('\n');
  console.log(`✅ Formatação local concluída: ${elementos.length} elementos, ${formatado.length} caracteres`);
  
  return { formatado, elementos };
}

serve(async (req) => {
  console.log(`🚀 [formatar-lei-local ${REVISION}] Iniciando...`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoBruto } = await req.json();
    
    if (!textoBruto) {
      return new Response(
        JSON.stringify({ success: false, error: "Texto bruto é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📄 Texto bruto: ${textoBruto.length} caracteres`);
    
    const inicio = Date.now();
    const { formatado, elementos } = formatarLeiLocal(textoBruto);
    const tempoMs = Date.now() - inicio;
    
    console.log(`⏱️ Tempo de processamento: ${tempoMs}ms`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        formatado,
        elementos,
        estatisticas: {
          caracteresEntrada: textoBruto.length,
          caracteresSaida: formatado.length,
          totalElementos: elementos.length,
          tempoMs
        },
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
