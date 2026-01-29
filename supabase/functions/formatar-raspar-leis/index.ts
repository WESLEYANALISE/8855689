import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

// ============================================================
// LISTA COMPLETA DE PRESIDENTES DO BRASIL
// Usada para validar e garantir que assinaturas não sejam perdidas
// ============================================================
const PRESIDENTES_BRASIL: { nome: string; variantes: string[] }[] = [
  // República Velha (1889-1930)
  { nome: "Deodoro da Fonseca", variantes: ["DEODORO DA FONSECA", "MANOEL DEODORO DA FONSECA", "M. DEODORO DA FONSECA"] },
  { nome: "Floriano Peixoto", variantes: ["FLORIANO PEIXOTO", "FLORIANO VIEIRA PEIXOTO"] },
  { nome: "Prudente de Morais", variantes: ["PRUDENTE DE MORAIS", "PRUDENTE J. DE MORAIS BARROS", "PRUDENTE DE MORAES"] },
  { nome: "Campos Sales", variantes: ["CAMPOS SALES", "MANOEL FERRAZ DE CAMPOS SALLES", "CAMPOS SALLES"] },
  { nome: "Rodrigues Alves", variantes: ["RODRIGUES ALVES", "FRANCISCO DE PAULA RODRIGUES ALVES", "F. RODRIGUES ALVES"] },
  { nome: "Afonso Pena", variantes: ["AFFONSO PENNA", "AFONSO PENA", "AFFONSO AUGUSTO MOREIRA PENNA"] },
  { nome: "Nilo Peçanha", variantes: ["NILO PEÇANHA", "NILO PROCÓPIO PEÇANHA"] },
  { nome: "Hermes da Fonseca", variantes: ["HERMES DA FONSECA", "HERMES RODRIGUES DA FONSECA"] },
  { nome: "Venceslau Brás", variantes: ["WENCESLAU BRAZ", "VENCESLAU BRÁS", "WENCESLAU BRAZ PEREIRA GOMES"] },
  { nome: "Delfim Moreira", variantes: ["DELFIM MOREIRA", "DELFIM MOREIRA DA COSTA RIBEIRO"] },
  { nome: "Epitácio Pessoa", variantes: ["EPITACIO PESSOA", "EPITÁCIO PESSOA", "EPITACIO DA SILVA PESSOA"] },
  { nome: "Artur Bernardes", variantes: ["ARTHUR BERNARDES", "ARTUR BERNARDES", "ARTHUR DA SILVA BERNARDES"] },
  { nome: "Washington Luís", variantes: ["WASHINGTON LUIS", "WASHINGTON LUÍS", "WASHINGTON LUIZ PEREIRA DE SOUSA"] },
  
  // Era Vargas (1930-1945)
  { nome: "Getúlio Vargas", variantes: ["GETULIO VARGAS", "GETÚLIO VARGAS", "GETULIO DORNELLES VARGAS", "G. VARGAS"] },
  
  // República Populista (1945-1964)
  { nome: "José Linhares", variantes: ["JOSÉ LINHARES", "JOSE LINHARES"] },
  { nome: "Eurico Gaspar Dutra", variantes: ["EURICO G. DUTRA", "EURICO GASPAR DUTRA", "E. G. DUTRA", "DUTRA"] },
  { nome: "Café Filho", variantes: ["CAFÉ FILHO", "CAFE FILHO", "JOÃO CAFÉ FILHO"] },
  { nome: "Carlos Luz", variantes: ["CARLOS LUZ", "CARLOS COIMBRA DA LUZ"] },
  { nome: "Nereu Ramos", variantes: ["NEREU RAMOS", "NEREU DE OLIVEIRA RAMOS"] },
  { nome: "Juscelino Kubitschek", variantes: ["JUSCELINO KUBITSCHEK", "JUSCELINO KUBITSCHECK", "JK", "J. KUBITSCHEK"] },
  { nome: "Jânio Quadros", variantes: ["JÂNIO QUADROS", "JANIO QUADROS", "JÂNIO DA SILVA QUADROS"] },
  { nome: "Ranieri Mazzilli", variantes: ["RANIERI MAZZILLI", "PASCOAL RANIERI MAZZILLI"] },
  { nome: "João Goulart", variantes: ["JOÃO GOULART", "JOAO GOULART", "JANGO", "JOÃO BELCHIOR MARQUES GOULART"] },
  
  // Ditadura Militar (1964-1985)
  { nome: "Castelo Branco", variantes: ["CASTELLO BRANCO", "CASTELO BRANCO", "H. CASTELLO BRANCO", "HUMBERTO CASTELLO BRANCO", "HUMBERTO DE ALENCAR CASTELLO BRANCO", "H. CASTELO BRANCO", "H.A. CASTELLO BRANCO"] },
  { nome: "Costa e Silva", variantes: ["COSTA E SILVA", "A. COSTA E SILVA", "ARTUR COSTA E SILVA", "ARTHUR COSTA E SILVA", "ARTUR DA COSTA E SILVA"] },
  { nome: "Emílio Médici", variantes: ["EMÍLIO G. MÉDICI", "EMILIO MEDICI", "EMÍLIO GARRASTAZU MÉDICI", "E. G. MÉDICI", "MÉDICI"] },
  { nome: "Ernesto Geisel", variantes: ["ERNESTO GEISEL", "E. GEISEL", "GEISEL"] },
  { nome: "João Figueiredo", variantes: ["JOÃO FIGUEIREDO", "JOAO FIGUEIREDO", "JOÃO BAPTISTA FIGUEIREDO", "J. FIGUEIREDO", "JOÃO B. FIGUEIREDO"] },
  
  // Nova República (1985-presente)
  { nome: "José Sarney", variantes: ["JOSÉ SARNEY", "JOSE SARNEY", "SARNEY"] },
  { nome: "Fernando Collor", variantes: ["FERNANDO COLLOR", "FERNANDO COLLOR DE MELLO", "F. COLLOR"] },
  { nome: "Itamar Franco", variantes: ["ITAMAR FRANCO", "ITAMAR AUGUSTO CAUTIERO FRANCO"] },
  { nome: "Fernando Henrique Cardoso", variantes: ["FERNANDO HENRIQUE CARDOSO", "FHC", "F. H. CARDOSO"] },
  { nome: "Luiz Inácio Lula da Silva", variantes: ["LUIZ INÁCIO LULA DA SILVA", "LUIZ INACIO LULA DA SILVA", "LULA", "L. I. LULA DA SILVA"] },
  { nome: "Dilma Rousseff", variantes: ["DILMA ROUSSEFF", "DILMA VANA ROUSSEFF"] },
  { nome: "Michel Temer", variantes: ["MICHEL TEMER", "MICHEL MIGUEL ELIAS TEMER LULIA"] },
  { nome: "Jair Bolsonaro", variantes: ["JAIR BOLSONARO", "JAIR MESSIAS BOLSONARO", "J. M. BOLSONARO"] },
  { nome: "Luiz Inácio Lula da Silva", variantes: ["LUIZ INÁCIO LULA DA SILVA", "LUIZ INACIO LULA DA SILVA", "LULA"] }, // 2023+
];

// ============================================================
// FUNÇÃO: Detectar e validar assinatura de presidente
// Retorna o nome encontrado ou null se não for presidente
// ============================================================
function detectarPresidente(texto: string): { encontrado: boolean; nome: string; nomeOriginal: string } | null {
  const textoNormalizado = texto.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos para comparação
    .replace(/\s+/g, ' ');
  
  for (const presidente of PRESIDENTES_BRASIL) {
    for (const variante of presidente.variantes) {
      const varianteNormalizada = variante
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
      
      if (textoNormalizado === varianteNormalizada || 
          textoNormalizado.includes(varianteNormalizada) ||
          varianteNormalizada.includes(textoNormalizado)) {
        return {
          encontrado: true,
          nome: presidente.nome,
          nomeOriginal: texto.trim()
        };
      }
    }
  }
  
  return null;
}

// ============================================================
// FUNÇÃO: Extrair seção de assinaturas do texto
// Detecta assinaturas após "Brasília, X de Y de Z"
// ============================================================
function extrairAssinaturas(texto: string): { 
  textoSemAssinaturas: string; 
  assinaturas: string[]; 
  presidente: string | null;
  dataAssinatura: string | null;
} {
  const linhas = texto.split('\n');
  const resultado: string[] = [];
  const assinaturas: string[] = [];
  let presidente: string | null = null;
  let dataAssinatura: string | null = null;
  let emSecaoAssinaturas = false;
  
  const regexDataAssinatura = /^Brasília,?\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i;
  const regexNomeAutoridade = /^((?:[A-Z]\.?\s+)?[A-Z]{2,}(?:\s+[A-Z]+)+|[A-Z][a-záàâãéèêíïóôõöúçñ]+(?:\s+(?:de\s+|da\s+|do\s+)?[A-Z][a-záàâãéèêíïóôõöúçñ]+)+)$/;
  
  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa) continue;
    
    // Detectar início da seção de assinaturas
    if (regexDataAssinatura.test(linhaLimpa)) {
      emSecaoAssinaturas = true;
      dataAssinatura = linhaLimpa;
      assinaturas.push(linhaLimpa);
      continue;
    }
    
    if (emSecaoAssinaturas) {
      // Verificar se é nome de autoridade
      if (regexNomeAutoridade.test(linhaLimpa) && linhaLimpa.length >= 5 && linhaLimpa.length < 80) {
        assinaturas.push(linhaLimpa);
        
        // Verificar se é o presidente
        const presidenteDetectado = detectarPresidente(linhaLimpa);
        if (presidenteDetectado && !presidente) {
          presidente = presidenteDetectado.nomeOriginal;
          console.log(`✓ Presidente detectado: ${presidente} (${presidenteDetectado.nome})`);
        }
        continue;
      }
      
      // Verificar se saímos da seção (novo artigo, etc)
      if (/^(Art\.?\s*\d|§|TÍTULO|CAPÍTULO|SEÇÃO)/i.test(linhaLimpa)) {
        emSecaoAssinaturas = false;
        resultado.push(linhaLimpa);
        continue;
      }
      
      // Outros textos na seção de assinaturas (ex: "Este texto não substitui...")
      assinaturas.push(linhaLimpa);
    } else {
      resultado.push(linhaLimpa);
    }
  }
  
  return {
    textoSemAssinaturas: resultado.join('\n'),
    assinaturas,
    presidente,
    dataAssinatura
  };
}

// ============================================================
// FUNÇÃO: Garantir que o presidente está nas assinaturas
// Se não encontrado, tenta extrair do texto original
// ============================================================
function garantirPresidenteNaAssinatura(
  textoOriginal: string, 
  textoFormatado: string
): string {
  // Primeiro, verificar se já há um presidente nas assinaturas
  const { assinaturas, presidente, dataAssinatura } = extrairAssinaturas(textoFormatado);
  
  if (presidente) {
    console.log(`✓ Presidente já presente nas assinaturas: ${presidente}`);
    return textoFormatado;
  }
  
  // Se não encontrou, tentar extrair do texto original
  console.log('⚠ Presidente não encontrado nas assinaturas, buscando no texto original...');
  
  const { presidente: presidenteOriginal, dataAssinatura: dataOriginal } = extrairAssinaturas(textoOriginal);
  
  if (presidenteOriginal) {
    console.log(`✓ Presidente encontrado no texto original: ${presidenteOriginal}`);
    
    // Inserir o presidente logo após a data de assinatura
    if (dataAssinatura) {
      const linhas = textoFormatado.split('\n');
      const novasLinhas: string[] = [];
      
      for (const linha of linhas) {
        novasLinhas.push(linha);
        if (linha.trim() === dataAssinatura) {
          novasLinhas.push(presidenteOriginal);
        }
      }
      
      return novasLinhas.join('\n');
    }
  }
  
  // Última tentativa: buscar padrões de nome de presidente no texto original
  for (const presidente of PRESIDENTES_BRASIL) {
    for (const variante of presidente.variantes) {
      if (textoOriginal.includes(variante)) {
        console.log(`✓ Presidente encontrado por padrão: ${variante}`);
        
        // Se temos data de assinatura, inserir após ela
        if (dataAssinatura) {
          const linhas = textoFormatado.split('\n');
          const novasLinhas: string[] = [];
          
          for (const linha of linhas) {
            novasLinhas.push(linha);
            if (linha.trim() === dataAssinatura) {
              novasLinhas.push(variante);
            }
          }
          
          return novasLinhas.join('\n');
        }
        break;
      }
    }
  }
  
  console.log('⚠ Não foi possível encontrar o presidente');
  return textoFormatado;
}

// ============================================================
// FUNÇÃO: Corrigir pontuação e caracteres faltantes com Gemini
// Usa IA para identificar e completar pontos, parênteses, etc.
// ============================================================
async function corrigirPontuacaoComGemini(texto: string): Promise<string> {
  if (GEMINI_KEYS.length === 0) {
    console.log('[CORRIGIR] ⚠️ Sem chaves Gemini disponíveis, pulando correção');
    return texto;
  }
  
  console.log(`[CORRIGIR] Iniciando correção de pontuação (${texto.length} chars)...`);
  
  // Dividir em chunks menores se o texto for muito grande
  const MAX_CHUNK_CORRECAO = 20000;
  
  if (texto.length > MAX_CHUNK_CORRECAO) {
    // Processar em partes
    const partes = texto.split(/(?=\n\nArt\.\s*\d)/gi);
    const partesCorrigidas: string[] = [];
    
    let chunkAtual = '';
    for (const parte of partes) {
      if ((chunkAtual + parte).length > MAX_CHUNK_CORRECAO && chunkAtual) {
        const corrigido = await executarCorrecaoGemini(chunkAtual);
        partesCorrigidas.push(corrigido);
        chunkAtual = parte;
      } else {
        chunkAtual += parte;
      }
    }
    
    if (chunkAtual) {
      const corrigido = await executarCorrecaoGemini(chunkAtual);
      partesCorrigidas.push(corrigido);
    }
    
    return partesCorrigidas.join('\n\n');
  }
  
  return await executarCorrecaoGemini(texto);
}

// ============================================================
// FUNÇÃO AUXILIAR: Executar correção de um trecho com Gemini
// ============================================================
async function executarCorrecaoGemini(texto: string): Promise<string> {
  const prompt = `REVISE este texto legal e CORRIJA APENAS problemas de pontuação e caracteres faltantes.

INSTRUÇÕES CRÍTICAS:
1. NÃO altere o conteúdo, estrutura ou ordem do texto
2. NÃO adicione ou remova palavras ou frases
3. NÃO reformate ou reorganize o texto
4. APENAS corrija:
   - Pontos finais faltando no fim de frases/artigos
   - Parênteses não fechados ou não abertos
   - Colchetes não fechados ou não abertos
   - Aspas não fechadas ou não abertas
   - Dois-pontos faltando antes de enumerações
   - Ponto-e-vírgula faltando entre itens de lista
   - Vírgulas claramente faltantes em enumerações

EXEMPLOS DE CORREÇÕES:
- "Art. 1º O texto da lei" → "Art. 1º O texto da lei."
- "inciso (I do artigo" → "inciso (I) do artigo"
- "conforme alínea "a" → "conforme alínea "a""
- "incluindo:" sem dois-pontos → manter como está se não houver lista

MANTENHA:
- Todos os artigos, parágrafos, incisos, alíneas na ordem original
- Toda a estrutura de TÍTULOS, CAPÍTULOS, SEÇÕES
- Todos os nomes e assinaturas exatamente como estão
- Numerações e referências a outros artigos

TEXTO PARA REVISAR:
${texto}

RETORNE O TEXTO CORRIGIDO, SEM EXPLICAÇÕES OU COMENTÁRIOS.`;

  for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1, // Baixa para precisão, mas não zero para raciocínio
              maxOutputTokens: 65536,
            },
          }),
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const resultado = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (resultado) {
          const textoCorrigido = resultado.trim();
          
          // Validação: verificar se o texto não foi drasticamente alterado
          const diferencaTamanho = Math.abs(textoCorrigido.length - texto.length);
          const percentualDiferenca = (diferencaTamanho / texto.length) * 100;
          
          if (percentualDiferenca > 15) {
            console.warn(`[CORRIGIR] ⚠️ Texto alterado demais (${percentualDiferenca.toFixed(1)}%), mantendo original`);
            return texto;
          }
          
          console.log(`[CORRIGIR] ✅ Texto corrigido (diferença: ${percentualDiferenca.toFixed(1)}%)`);
          return textoCorrigido;
        }
      } else {
        const errorText = await response.text();
        console.error(`[CORRIGIR] Erro ${response.status}: ${errorText.substring(0, 200)}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[CORRIGIR] Timeout na correção');
      } else {
        console.error('[CORRIGIR] Erro:', error.message);
      }
    }
  }
  
  console.log('[CORRIGIR] Fallback: retornando texto original');
  return texto;
}

// ============================================================
// PROMPT SIMPLES: Apenas transcrever HTML/Markdown para texto puro
// Não reorganizar, não formatar - apenas limpar e transcrever
// ============================================================
const PROMPT_CONVERTER = (chunk: string) => `TRANSCREVA este texto de HTML/Markdown para TEXTO PURO.

INSTRUÇÕES:
1. REMOVA todas as tags HTML e Markdown - apenas extraia o texto
2. PRESERVE TODOS os textos entre parênteses - são anotações legislativas importantes como:
   - (Incluído pela Lei nº...)
   - (Redação dada pela Lei nº...)
   - (Vigência)
   - (Vide...)
   - (VETADO)
   - (Revogado)
   NÃO remova nenhum texto entre parênteses
3. MANTENHA a estrutura e quebras de linha EXATAMENTE como estão no original
4. NÃO reorganize, NÃO reordene, NÃO altere a ordem do conteúdo
5. PRESERVE maiúsculas e minúsculas originais

REGRA CRÍTICA - CABEÇALHO DA LEI:
- SEMPRE preserve o cabeçalho institucional: "Presidência da República", "Casa Civil", "Subchefia para Assuntos Jurídicos"
- SEMPRE preserve o número da lei (ex: "LEI Nº 5.197, DE 3 DE JANEIRO DE 1967")
- SEMPRE preserve a ementa (ex: "Dispõe sobre a proteção à fauna...")
- O cabeçalho vem ANTES do preâmbulo "O PRESIDENTE DA REPÚBLICA..."

REGRA CRÍTICA - PREÂMBULO:
- O preâmbulo (O PRESIDENTE DA REPÚBLICA... Faço saber...) deve ficar em linha SEPARADA do Art. 1º

REGRA CRÍTICA - ARTIGOS CITADOS ENTRE ASPAS:
- Quando um artigo introduz OUTRO artigo entre ASPAS (ex: Art. 24 que diz "passa a vigorar acrescida do seguinte art. 34-A:" seguido de "Art. 34-A. ..."), 
  o artigo citado entre aspas NÃO é um artigo separado - é CONTEÚDO do artigo citante.
- MANTENHA artigos citados entre aspas NA MESMA LINHA ou imediatamente abaixo do artigo que os introduz

REGRA CRÍTICA - DUPLICATAS:
- Quando há DUPLICATAS (mesmo número aparecendo 2+ vezes), SEMPRE use apenas o ÚLTIMO
- Texto antigo/revogado aparece primeiro, texto válido aparece por último

REGRA CRÍTICA - ASSINATURAS:
- TODA LEI TEM O NOME DO PRESIDENTE DA REPÚBLICA na assinatura (ex: "H. CASTELLO BRANCO", "DILMA ROUSSEFF")
- A assinatura vem após a data (Brasília, X de Y de Z) e ANTES dos nomes dos ministros
- NUNCA omita o nome do presidente na transcrição - é obrigatório

TEXTO:
${chunk}

RETORNE APENAS O TEXTO TRANSCRITO, SEM EXPLICAÇÕES.`;

// ============================================================
// PRÉ-LIMPEZA ROBUSTA DE HTML (ANTES DE QUALQUER PROCESSAMENTO)
// ============================================================
function preLimparHTML(texto: string): string {
  let r = texto;
  
  // 1. Remover scripts, styles, comments
  r = r.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  r = r.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  r = r.replace(/<!--[\s\S]*?-->/g, '');
  
  // 2. Remover imagens, iframes, embeds
  r = r.replace(/<img[^>]*>/gi, '');
  r = r.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  r = r.replace(/<embed[^>]*>/gi, '');
  r = r.replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '');
  
  // 3. Converter <br> e </p> em quebras de linha ANTES de remover tags
  r = r.replace(/<br\s*\/?>/gi, '\n');
  r = r.replace(/<\/p>/gi, '\n');
  r = r.replace(/<\/div>/gi, '\n');
  r = r.replace(/<\/tr>/gi, '\n');
  r = r.replace(/<\/li>/gi, '\n');
  
  // 4. REMOVER TODAS AS TAGS HTML (incluindo <u>, <sup>, <sub>, <span>, etc.)
  r = r.replace(/<[^>]+>/g, '');
  
  // 5. Converter entidades HTML
  r = r.replace(/&nbsp;/gi, ' ');
  r = r.replace(/&amp;/gi, '&');
  r = r.replace(/&lt;/gi, '<');
  r = r.replace(/&gt;/gi, '>');
  r = r.replace(/&quot;/gi, '"');
  r = r.replace(/&apos;/gi, "'");
  r = r.replace(/&#(\d+);/gi, (_, num) => String.fromCharCode(parseInt(num)));
  r = r.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  r = r.replace(/&[a-z]+;/gi, ' '); // Outras entidades = espaço
  
  // 6. PRESERVAR TODOS os textos entre parênteses (anotações legislativas)
  // NÃO remover nada - manter (Incluído pela...), (Redação dada pela...), etc.
  // Apenas normalizar espaços dentro dos parênteses
  r = r.replace(/\(\s+/g, '('); // "( texto" -> "(texto"
  r = r.replace(/\s+\)/g, ')'); // "texto )" -> "texto)"
  
  // 7. Normalizar espaços múltiplos (mas preservar quebras)
  r = r.replace(/[ \t]+/g, ' ');
  
  // 8. Normalizar quebras de linha múltiplas
  r = r.replace(/\n[ \t]+/g, '\n');
  r = r.replace(/[ \t]+\n/g, '\n');
  r = r.replace(/\n{3,}/g, '\n\n');
  
  return r.trim();
}

// ============================================================
// PÓS-LIMPEZA: Juntar linhas que foram fragmentadas incorretamente
// Cada inciso/alínea/parágrafo deve ser UMA LINHA CONTÍNUA
// LIVRO/TÍTULO/CAPÍTULO devem ter o tema em LINHA SEPARADA
// ============================================================
function posLimparQuebrasFragmentadas(texto: string): string {
  const linhas = texto.split('\n');
  const resultado: string[] = [];
  let linhaAtual = '';
  let emSecaoAssinaturas = false;
  
  // Regex para identificar início de elementos legais REAIS (não referências no meio do texto)
  // REMOVIDO: LEI\s+N e DECRETO\s+N pois aparecem como referências no meio de frases
  const regexInicioElemento = /^(Art\.?\s*\d|§\s*\d|Parágrafo\s+único|[IVXLCDM]+\s*[–-]|[a-z]\)|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO|LIVRO|PARTE|Presidência|Casa Civil|Subchefia|O\s+PRESIDENTE|A\s+PRESIDENT|Dispõe|Institui|Altera|Regulamenta|Estabelece)/i;
  
  // Regex para "LEI Nº" ou "DECRETO Nº" que SÓ são elementos novos se no início absoluto (cabeçalho da lei)
  const regexCabecalhoLei = /^(LEI\s+N[ºo°]?|DECRETO\s+N[ºo°]?|LEI\s+COMPLEMENTAR\s+N[ºo°]?)\s*[\d.]+/i;
  
  // Regex para detectar se linha anterior termina com preposição/artigo/palavra incompleta
  const regexTerminaIncompleta = /(pela|na|da|do|no|de|à|ao|com|sem|sob|sobre|entre|para|por|em|a|o|as|os|e|ou|que|conforme|segundo|nos|termos|previsto|disposto|estabelecido|inciso|artigo|art\.|§|caput|dos|das|qualquer)\s*$/i;
  
  // Regex para detectar linha que é claramente fragmento (não termina com pontuação final)
  const regexTerminaComPontuacaoFinal = /[.;:!?]\s*$/;
  const regexTerminaComVirgula = /,\s*$/;

  // Regex para LIVRO/TÍTULO/CAPÍTULO com numeração romana
  const regexEstrutura = /^(LIVRO|TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO|PARTE)\s+([IVXLCDM]+|[0-9]+)/i;
  
  // Regex para data de assinatura (marca início da seção de assinaturas)
  const regexDataAssinatura = /^Brasília,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}/i;
  
  // Regex para nome de autoridade (MAIÚSCULAS ou Nome Capitalizado)
  const regexNomeAutoridade = /^((?:[A-Z]\.?\s+)?[A-Z]{2,}(?:\s+[A-Z]+)+|[A-Z][a-záàâãéèêíïóôõöúçñ]+(?:\s+(?:de\s+|da\s+|do\s+)?[A-Z][a-záàâãéèêíïóôõöúçñ]+)+)$/;
  
  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa) continue;
    
    // Verificar se é data de assinatura (marca início da seção)
    if (regexDataAssinatura.test(linhaLimpa)) {
      if (linhaAtual) {
        resultado.push(linhaAtual.trim());
        linhaAtual = '';
      }
      emSecaoAssinaturas = true;
      resultado.push(linhaLimpa);
      continue;
    }
    
    // Se estamos na seção de assinaturas, cada nome é uma linha separada
    if (emSecaoAssinaturas) {
      if (regexNomeAutoridade.test(linhaLimpa) && 
          linhaLimpa.length >= 5 && 
          linhaLimpa.length < 60 &&
          !linhaLimpa.startsWith('Art.') &&
          !linhaLimpa.match(/^(TÍTULO|CAPÍTULO|SEÇÃO)/i)) {
        resultado.push(linhaLimpa);
        continue;
      }
      if (regexInicioElemento.test(linhaLimpa)) {
        emSecaoAssinaturas = false;
      }
    }
    
    // Verificar se é início de elemento legal
    const ehInicioElementoRegex = regexInicioElemento.test(linhaLimpa);
    const ehCabecalhoLei = regexCabecalhoLei.test(linhaLimpa) && !linhaAtual;
    
    // Verificar características da linha atual e anterior
    const linhaAnteriorTerminaIncompleta = regexTerminaIncompleta.test(linhaAtual);
    const linhaAnteriorTerminaComVirgula = regexTerminaComVirgula.test(linhaAtual);
    const linhaAnteriorNaoTerminou = linhaAtual && !regexTerminaComPontuacaoFinal.test(linhaAtual);
    
    // Linha curta que não é elemento estrutural = provavelmente é fragmento
    const ehLinhaFragmento = linhaLimpa.length < 40 && 
                              !ehInicioElementoRegex && 
                              !ehCabecalhoLei &&
                              !regexEstrutura.test(linhaLimpa);
    
    // Decidir se é novo elemento ou continuação
    let ehInicioElemento = ehInicioElementoRegex || ehCabecalhoLei;
    
    // FORÇAR JUNÇÃO se:
    // 1. Linha anterior termina com preposição/palavra incompleta
    // 2. Linha anterior termina com vírgula (lista)
    // 3. Linha atual é fragmento curto E linha anterior não terminou com pontuação final
    if (linhaAnteriorTerminaIncompleta || 
        linhaAnteriorTerminaComVirgula || 
        (ehLinhaFragmento && linhaAnteriorNaoTerminou)) {
      ehInicioElemento = false;
    }
    
    if (ehInicioElemento) {
      if (linhaAtual) {
        resultado.push(linhaAtual.trim());
      }
      linhaAtual = linhaLimpa;
    } else {
      linhaAtual = linhaAtual ? (linhaAtual + ' ' + linhaLimpa) : linhaLimpa;
    }
  }
  
  // Adicionar última linha
  if (linhaAtual) {
    resultado.push(linhaAtual.trim());
  }
  
  console.log(`[POS-LIMPAR] Juntou ${linhas.length} linhas em ${resultado.length} linhas`);
  
  // SEPARAR LIVRO/TÍTULO/CAPÍTULO DO SEU TEMA
  const resultadoFinal: string[] = [];
  for (const linha of resultado) {
    const matchEstrutura = linha.match(regexEstrutura);
    if (matchEstrutura) {
      // Ex: "LIVRO I Águas em geral e sua propriedade" -> "LIVRO I" + "Águas em geral e sua propriedade"
      const estrutura = matchEstrutura[0]; // "LIVRO I" ou "TÍTULO I" etc.
      const tema = linha.slice(estrutura.length).trim();
      
      resultadoFinal.push(estrutura);
      if (tema) {
        resultadoFinal.push(tema);
      }
    } else {
      resultadoFinal.push(linha);
    }
  }
  
  // JUNTAR com quebras apropriadas:
  // - Alíneas (a), b), c)...) usam quebra SIMPLES
  // - Estruturas (TÍTULO, CAPÍTULO, etc.) usam quebra DUPLA antes delas
  // - Demais elementos usam quebra SIMPLES
  const regexAlinea = /^[a-z]\)/;
  const regexEstruturaDupla = /^(TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO|LIVRO|PARTE)\s/i;
  const linhasFinais: string[] = [];
  
  for (let i = 0; i < resultadoFinal.length; i++) {
    linhasFinais.push(resultadoFinal[i]);
    
    // Verificar próxima linha para decidir tipo de quebra
    if (i < resultadoFinal.length - 1) {
      const proximaLinha = resultadoFinal[i + 1];
      if (regexEstruturaDupla.test(proximaLinha)) {
        // Próxima linha é estrutura (TÍTULO, CAPÍTULO, etc.): quebra dupla
        linhasFinais.push('');
        linhasFinais.push('');
      } else {
        // Alíneas e demais elementos: quebra simples
        linhasFinais.push('');
      }
    }
  }
  
  return linhasFinais.join('\n');
}

// ============================================================
// DIVIDIR TEXTO EM CHUNKS INTELIGENTES
// ============================================================
function dividirEmChunks(texto: string): string[] {
  const MAX_CHUNK = 15000; // ~15k chars por chunk (seguro para Gemini)
  const chunks: string[] = [];
  
  // Primeiro, aplicar pré-limpeza para remover TODO o HTML
  const textoLimpo = preLimparHTML(texto);
  
  console.log(`[DIVISAO] Texto após pré-limpeza: ${textoLimpo.length} chars (original: ${texto.length})`);
  
  // Tentar dividir por "Art." para manter artigos inteiros
  const partes = textoLimpo.split(/(?=Art\.\s*\d)/gi);
  
  let chunkAtual = '';
  
  for (const parte of partes) {
    if ((chunkAtual + parte).length > MAX_CHUNK && chunkAtual.length > 0) {
      chunks.push(chunkAtual.trim());
      chunkAtual = parte;
    } else {
      chunkAtual += parte;
    }
  }
  
  if (chunkAtual.trim()) {
    chunks.push(chunkAtual.trim());
  }
  
  // Se não conseguiu dividir bem, dividir por tamanho fixo
  if (chunks.length === 0 || (chunks.length === 1 && chunks[0].length > MAX_CHUNK * 1.5)) {
    const chunksFixos: string[] = [];
    for (let i = 0; i < textoLimpo.length; i += MAX_CHUNK) {
      chunksFixos.push(textoLimpo.slice(i, i + MAX_CHUNK));
    }
    return chunksFixos;
  }
  
  return chunks;
}

// ============================================================
// CHAMAR GEMINI PARA UM CHUNK
// ============================================================
async function processarChunkComGemini(chunk: string, chunkNum: number): Promise<string> {
  console.log(`[CHUNK ${chunkNum}] Processando ${chunk.length} caracteres...`);
  
  if (GEMINI_KEYS.length === 0) {
    console.warn(`[CHUNK ${chunkNum}] ⚠️ Sem chaves Gemini, usando limpeza básica`);
    return limparChunkBasico(chunk);
  }
  
  for (let keyIndex = 0; keyIndex < GEMINI_KEYS.length; keyIndex++) {
    const apiKey = GEMINI_KEYS[keyIndex];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout por chunk
      
      const startTime = Date.now();
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: PROMPT_CONVERTER(chunk) }] }],
            generationConfig: {
              temperature: 0.0, // Máxima precisão
              maxOutputTokens: 32768,
            },
          }),
        }
      );
      
      clearTimeout(timeoutId);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (response.ok) {
        const data = await response.json();
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (result) {
          console.log(`[CHUNK ${chunkNum}] ✅ Processado em ${elapsed}s: ${result.length} chars`);
          return result.trim();
        }
      } else {
        const errorText = await response.text();
        console.error(`[CHUNK ${chunkNum}] Erro ${response.status}: ${errorText.substring(0, 200)}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error(`[CHUNK ${chunkNum}] Timeout`);
      } else {
        console.error(`[CHUNK ${chunkNum}] Erro:`, error.message);
      }
    }
  }
  
  // Fallback: limpeza básica
  console.warn(`[CHUNK ${chunkNum}] Fallback: limpeza básica`);
  return limparChunkBasico(chunk);
}

// ============================================================
// LIMPEZA BÁSICA (FALLBACK SEM GEMINI)
// ============================================================
function limparChunkBasico(texto: string): string {
  let r = texto;
  
  // Remover tags HTML
  r = r.replace(/<[^>]+>/g, ' ');
  
  // Remover entidades HTML
  r = r.replace(/&nbsp;/gi, ' ');
  r = r.replace(/&amp;/gi, '&');
  r = r.replace(/&lt;/gi, '<');
  r = r.replace(/&gt;/gi, '>');
  r = r.replace(/&quot;/gi, '"');
  r = r.replace(/&#\d+;/gi, '');
  
  // Remover texto entre parênteses (exceto VETADO/Revogado)
  r = r.replace(/\([^)]*\)/g, (match) => {
    const upper = match.toUpperCase();
    if (upper.includes('VETADO') || upper.includes('REVOGAD')) {
      return match;
    }
    return '';
  });
  
  // Tratar parênteses incompletos
  r = r.replace(/\([^)]*$/gm, (match) => {
    const upper = match.toUpperCase();
    if (upper.includes('VETADO') || upper.includes('REVOGAD')) {
      return match + ')';
    }
    return '';
  });
  r = r.replace(/^[^(]*\)/gm, (match) => {
    const upper = match.toUpperCase();
    if (upper.includes('VETADO') || upper.includes('REVOGAD')) {
      return '(' + match;
    }
    return '';
  });
  
  // Normalizar espaços
  r = r.replace(/\s+/g, ' ');
  
// Quebras de linha antes de artigos - MAS NÃO quando estiver entre aspas
  // Primeiro, proteger artigos entre aspas substituindo temporariamente
  const placeholders: string[] = [];
  r = r.replace(/"Art\.?\s*\d+[^"]*"/gi, (match) => {
    placeholders.push(match);
    return `__ARTIGO_ASPAS_${placeholders.length - 1}__`;
  });
  
  // Agora aplicar quebras de linha
  r = r.replace(/\s+(Art\.\s*\d)/gi, '\n\n$1');
  r = r.replace(/\s+(§\s*\d)/g, '\n\n$1');
  r = r.replace(/\s+(Parágrafo\s+único)/gi, '\n\n$1');
  r = r.replace(/\s+(TÍTULO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  r = r.replace(/\s+(CAPÍTULO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  r = r.replace(/\s+(SEÇÃO\s+[IVXLCDM]+)/gi, '\n\n\n$1');
  
  // Restaurar artigos entre aspas
  placeholders.forEach((original, index) => {
    r = r.replace(`__ARTIGO_ASPAS_${index}__`, original);
  });
  
  // Corrigir numeração: artigos 10+ não devem ter símbolo ordinal (º)
  // Art. 10º → Art. 10, Art. 11º → Art. 11, mas Art. 1º fica Art. 1º
  r = r.replace(/Art\.\s*(\d{2,})[ºª°]/gi, 'Art. $1');
  r = r.replace(/Art\.\s*(\d{2,})\s*[ºª°]/gi, 'Art. $1');
  
  return r.trim();
}

// ============================================================
// REMOVER DUPLICATAS (MANTER SEMPRE O ÚLTIMO)
// Quando há parágrafos, incisos, alíneas OU ARTIGOS duplicados,
// os anteriores foram revogados - manter apenas o último
// ============================================================
function removerDuplicatas(texto: string): string {
  const linhas = texto.split('\n').filter(l => l.trim().length > 0);
  
  console.log(`[DUPLICATAS] Analisando ${linhas.length} linhas para duplicatas...`);
  
  // Regex para identificar elementos legais
  const regexParagrafo = /^(§\s*\d+[ºª°]?|Parágrafo\s+único)/i;
  const regexInciso = /^([IVXLCDM]+)\s*[–-]/;
  const regexAlinea = /^([a-z])\)/i;
  const regexArtigo = /^Art\.?\s*(\d+(?:-[A-Z])?)[ºª°]?/i;
  
  // Função para extrair identificador único de um elemento
  const extrairIdentificador = (linha: string): { tipo: string; id: string } | null => {
    const linhaLimpa = linha.trim();
    
    // Verificar artigo PRIMEIRO (prioridade mais alta)
    const matchArtigo = linhaLimpa.match(regexArtigo);
    if (matchArtigo) {
      return { tipo: 'artigo', id: `Art. ${matchArtigo[1]}` };
    }
    
    // Verificar parágrafo
    const matchParagrafo = linhaLimpa.match(regexParagrafo);
    if (matchParagrafo) {
      const numMatch = matchParagrafo[1].match(/\d+/);
      if (numMatch) {
        return { tipo: 'paragrafo', id: `§ ${numMatch[0]}º` };
      }
      if (matchParagrafo[1].toLowerCase().includes('único')) {
        return { tipo: 'paragrafo', id: 'Parágrafo único' };
      }
    }
    
    // Verificar inciso
    const matchInciso = linhaLimpa.match(regexInciso);
    if (matchInciso) {
      return { tipo: 'inciso', id: `${matchInciso[1]} –` };
    }
    
    // Verificar alínea
    const matchAlinea = linhaLimpa.match(regexAlinea);
    if (matchAlinea) {
      return { tipo: 'alinea', id: `${matchAlinea[1].toLowerCase()})` };
    }
    
    return null;
  };
  
  // PRIMEIRA PASSAGEM: Identificar TODAS as ocorrências de cada elemento
  // e guardar apenas o ÍNDICE DA ÚLTIMA
  const ultimaOcorrencia: Map<string, number> = new Map();
  let artigoAtual: string | null = null;
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    
    const identificado = extrairIdentificador(linha);
    
    if (identificado) {
      if (identificado.tipo === 'artigo') {
        // Artigo: chave global (sem contexto de artigo pai)
        artigoAtual = identificado.id;
        ultimaOcorrencia.set(identificado.id, i);
        console.log(`[DUPLICATAS] Art. encontrado: ${identificado.id} na linha ${i + 1}`);
      } else if (artigoAtual) {
        // Parágrafo/inciso/alínea: chave com contexto do artigo pai
        const chaveUnica = `${artigoAtual}:${identificado.id}`;
        ultimaOcorrencia.set(chaveUnica, i);
      }
    }
  }
  
  // SEGUNDA PASSAGEM: Marcar para remoção todas as linhas que NÃO são a última ocorrência
  const linhasParaRemover: Set<number> = new Set();
  artigoAtual = null;
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;
    
    const identificado = extrairIdentificador(linha);
    
    if (identificado) {
      if (identificado.tipo === 'artigo') {
        artigoAtual = identificado.id;
        const ultimaPos = ultimaOcorrencia.get(identificado.id);
        
        // Se NÃO é a última ocorrência, marcar para remoção
        if (ultimaPos !== undefined && ultimaPos !== i) {
          linhasParaRemover.add(i);
          console.log(`[DUPLICATAS] ❌ REMOVENDO ${identificado.id} (linha ${i + 1}) - última é linha ${ultimaPos + 1}`);
        }
      } else if (artigoAtual) {
        const chaveUnica = `${artigoAtual}:${identificado.id}`;
        const ultimaPos = ultimaOcorrencia.get(chaveUnica);
        
        if (ultimaPos !== undefined && ultimaPos !== i) {
          linhasParaRemover.add(i);
          console.log(`[DUPLICATAS] ❌ REMOVENDO ${identificado.id} do ${artigoAtual} (linha ${i + 1}) - última é linha ${ultimaPos + 1}`);
        }
      }
    }
  }
  
  // TERCEIRA PASSAGEM: Construir texto sem duplicatas
  const linhasFiltradas: string[] = [];
  for (let i = 0; i < linhas.length; i++) {
    if (!linhasParaRemover.has(i)) {
      linhasFiltradas.push(linhas[i]);
    }
  }
  
  console.log(`[DUPLICATAS] ✅ Removidas ${linhasParaRemover.size} linhas duplicadas de ${linhas.length} linhas`);
  
  return linhasFiltradas.join('\n');
}

// ============================================================
// MANTER ARTIGOS CITADOS ENTRE ASPAS JUNTO DO ARTIGO CITANTE
// Quando Art. 24-A introduz "Art. 34-A. ...", o Art. 34-A deve
// ficar na mesma linha, não separado como artigo independente
// ============================================================

// Regex para detectar QUALQUER tipo de aspas (retas, curvas, angulares, simples, duplas)
const REGEX_ASPAS_ABERTURA = /["''""\u0022\u0027\u00AB\u2018\u201C\u2039]/;
const REGEX_ASPAS_FECHAMENTO = /["''""\u0022\u0027\u00BB\u2019\u201D\u203A]/;
const ASPAS_TODAS = '["\'\'""«»‹›]';

function manterArtigosCitadosJuntos(texto: string): string {
  let resultado = texto;
  
  console.log('[ARTIGOS-CITADOS] Verificando artigos entre aspas (detectando todos tipos de aspas)...');
  
  // Padrão 1: Artigo que introduz outro artigo com QUALQUER TIPO de aspas
  // "Art. 24. A Lei nº X passa a vigorar acrescida do seguinte art. 34-A:
  //  "Art. 34-A. Nas regiões metropolitanas..."
  // O "Art. 34-A deve ficar JUNTO do Art. 24, não separado
  
  // Regex para detectar artigo citado que está na linha seguinte com aspas
  // Suporta: " " ' ' « » ‹ › e aspas ASCII normais " '
  const regexArtigoCitado = new RegExp(
    `(\\n\\n)(${ASPAS_TODAS}?\\s*Art\\.?\\s*\\d+(?:-[A-Z])?[ºª°]?\\.?\\s*[^\\n]+${ASPAS_TODAS}?\\.?)\\s*\\n\\n`,
    'gi'
  );
  
  resultado = resultado.replace(
    regexArtigoCitado,
    (match, quebraAntes, artigoComAspas) => {
      // Verificar se é um artigo citado (tem aspas no início)
      const temAspasInicio = REGEX_ASPAS_ABERTURA.test(artigoComAspas.trim().charAt(0));
      if (temAspasInicio) {
        console.log(`[ARTIGOS-CITADOS] ✅ Mantendo artigo citado junto: ${artigoComAspas.substring(0, 50)}...`);
        return `\n${artigoComAspas}\n\n`;
      }
      return match;
    }
  );
  
  // Padrão 2: Artigo citado que começa com qualquer tipo de aspas
  // "Art. 34-A. Nas regiões metropolitanas..." - isso deve ficar junto do artigo anterior
  const regexCitacao = new RegExp(
    `(\\n\\n)(${ASPAS_TODAS}[^\\n]+Art\\.?\\s*\\d+(?:-[A-Z])?[ºª°]?\\.?[^\\n]+${ASPAS_TODAS})`,
    'gi'
  );
  
  resultado = resultado.replace(
    regexCitacao,
    (match, quebraAntes, citacao) => {
      console.log(`[ARTIGOS-CITADOS] ✅ Ajustando citação: ${citacao.substring(0, 50)}...`);
      return `\n${citacao}`;
    }
  );
  
  // Padrão 3: Não separar linhas que começam com qualquer tipo de aspas (são continuação)
  const regexLinhaAspas = new RegExp(`\\n\\n(${ASPAS_TODAS}[^\\n]+)`, 'g');
  
  resultado = resultado.replace(
    regexLinhaAspas,
    (match, linhaComAspas) => {
      console.log(`[ARTIGOS-CITADOS] ✅ Linha com aspas é continuação: ${linhaComAspas.substring(0, 50)}...`);
      return `\n${linhaComAspas}`;
    }
  );
  
  // Padrão 4: Identificar artigos entre aspas que foram separados incorretamente
  // Se temos "Art. 24-A" que menciona outro artigo e na próxima linha vem um artigo entre aspas
  // Ex: "passa a vigorar acrescida do seguinte art. 34-A:" seguido de "Art. 34-A. texto..."
  const linhas = resultado.split('\n');
  const linhasResultado: string[] = [];
  let juntarComAnterior = false;
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    const linhaAnterior = i > 0 ? linhas[i - 1].trim() : '';
    
    // Verificar se a linha anterior termina com ":" e menciona "art."
    const anteriorIntroduzArtigo = /art\.?\s*\d+[^:]*:\s*$/i.test(linhaAnterior);
    
    // Verificar se a linha atual começa com aspas seguidas de "Art."
    const linhaEhCitacaoArtigo = new RegExp(`^${ASPAS_TODAS}\\s*Art\\.?\\s*\\d+`, 'i').test(linha);
    
    if (anteriorIntroduzArtigo && linhaEhCitacaoArtigo) {
      console.log(`[ARTIGOS-CITADOS] ✅ Juntando linha citada com anterior: ${linha.substring(0, 40)}...`);
      // Juntar com linha anterior (remover quebra dupla)
      if (linhasResultado.length > 0) {
        linhasResultado[linhasResultado.length - 1] += '\n' + linha;
        continue;
      }
    }
    
    linhasResultado.push(linha);
  }
  
  return linhasResultado.join('\n\n');
}

// ============================================================
// SEPARAR ASSINATURAS DO ÚLTIMO ARTIGO
// Nomes de autoridades devem vir em linhas separadas
// ============================================================
function separarAssinaturas(texto: string): string {
  const linhas = texto.split('\n');
  const linhasResultado: string[] = [];
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const linhaLimpa = linha.trim();
    
    // Verificar se a linha contém "Brasília," seguido de mais texto (assinaturas)
    // Padrão: "Art. 25. Esta lei entra em vigor na data de sua publicação. Brasília, 12 de janeiro..."
    const matchBrasilia = linhaLimpa.match(/(.*?)(Brasília,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}.*)/i);
    if (matchBrasilia) {
      const antesAssinatura = matchBrasilia[1].trim();
      const assinaturaEDemais = matchBrasilia[2].trim();
      
      // Adicionar o conteúdo antes da assinatura (se houver)
      if (antesAssinatura) {
        linhasResultado.push(antesAssinatura);
      }
      
      // Separar a linha de data das assinaturas
      // Padrão: "Brasília, 12 de janeiro de 2015; 194º da Independência e 127º da República. DILMA ROUSSEFF"
      // Regex para encontrar onde termina a data (após "República." ou similar) e começam os nomes
      const matchDataENomes = assinaturaEDemais.match(
        /(Brasília,\s*\d{1,2}\s+de\s+\w+\s+de\s+\d{4}[^A-Z]*(?:República|Independência)[^A-Z]*\.?)\s*(.*)/i
      );
      
      if (matchDataENomes) {
        const dataCompleta = matchDataENomes[1].trim();
        const nomes = matchDataENomes[2].trim();
        
        // Adicionar linha de data em linha separada
        linhasResultado.push('');
        linhasResultado.push(dataCompleta);
        
        // Separar cada nome em sua própria linha
        if (nomes) {
          // Estratégia: separar nomes que estão em MAIÚSCULAS (ex: DILMA ROUSSEFF)
          // e nomes normais (ex: Joaquim Levy)
          const partesNomes: string[] = [];
          
          // Encontrar nomes em MAIÚSCULAS (2+ palavras todas em maiúscula)
          // Aceita iniciais com ponto como "H. CASTELLO BRANCO", "A. COSTA E SILVA"
          let restante = nomes;
          const regexNomeMaiuscula = /((?:[A-Z]\.?\s+)?[A-Z]{2,}(?:\s+[A-Z]+)+)/g;
          const nomesMaiusculos = nomes.match(regexNomeMaiuscula) || [];
          
          for (const nomeMaiusculo of nomesMaiusculos) {
            partesNomes.push(nomeMaiusculo.trim());
            restante = restante.replace(nomeMaiusculo, '|||');
          }
          
          // Processar o restante (nomes com inicial maiúscula)
          const partesRestantes = restante.split('|||').filter(p => p.trim().length > 2);
          for (const parte of partesRestantes) {
            // Separar por padrão de nome (Nome Sobrenome)
            const nomesNormais = parte.trim().split(/(?<=\w)\s+(?=[A-Z][a-z])/);
            for (const nome of nomesNormais) {
              if (nome.trim().length > 2) {
                partesNomes.push(nome.trim());
              }
            }
          }
          
          // Adicionar cada nome em linha separada
          for (const nome of partesNomes) {
            linhasResultado.push('');
            linhasResultado.push(nome);
          }
        }
      } else {
        // Fallback: apenas separar data do resto
        linhasResultado.push('');
        linhasResultado.push(assinaturaEDemais);
      }
      continue;
    }
    
    // Verificar se a linha tem nomes colados (ex: "NOME1 Nome2 Nome3")
    // Isso acontece quando o Gemini não separou corretamente
    if (linhaLimpa.match(/^[A-Z]{2,}/) && linhaLimpa.match(/[a-z]\s+[A-Z]/)) {
      // Separar nomes
      const partes = linhaLimpa
        .replace(/([A-Z]{2,}(?:\s+[A-Z]+)+)\s+(?=[A-Z])/g, '$1\n')
        .replace(/([a-z])\s+([A-Z])/g, '$1\n$2')
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 2);
      
      for (const parte of partes) {
        linhasResultado.push(parte);
      }
      continue;
    }
    
    linhasResultado.push(linha);
  }
  
  return linhasResultado.join('\n');
}

// ============================================================
// JUNTAR PREÂMBULO: "A PRESIDENTA DA REPÚBLICA" + "Faço saber..."
// Devem ficar na mesma linha
// ============================================================
function juntarPreambulo(texto: string): string {
  let resultado = texto;
  
  // Padrões para juntar
  // "A PRESIDENTA DA REPÚBLICA" ou "O PRESIDENTE DA REPÚBLICA" seguido de "Faço saber..."
  resultado = resultado.replace(
    /((?:A\s+PRESIDENTA|O\s+PRESIDENTE)\s+DA\s+REPÚBLICA)\s*\n+\s*(Faço saber que o Congresso Nacional decreta e eu (?:sanciono|sancionei) a seguinte (?:Lei|Emenda|Medida)[^:]*:?)/gi,
    '$1 $2'
  );
  
  // Também juntar variações
  resultado = resultado.replace(
    /((?:A\s+PRESIDENTA|O\s+PRESIDENTE)\s+DA\s+REPÚBLICA)\s*\n+\s*(Faço saber[^:]+:?)/gi,
    '$1 $2'
  );
  
  return resultado;
}

// ============================================================
// SEPARAR PREÂMBULO DO ART. 1º
// Quando "...seguinte Lei: Art. 1º" estão colados, separar com quebras
// ============================================================
function separarPreambulo(texto: string): string {
  let r = texto;
  
  console.log('[SEPARAR-PREAMBULO] Verificando se preâmbulo está colado ao Art. 1º...');
  console.log('[SEPARAR-PREAMBULO] Primeiros 500 chars:', r.substring(0, 500));
  
  // Padrão 1: Preâmbulo completo em uma linha, seguido de Art. 1º
  // Captura: "O PRESIDENTE DA REPÚBLICA Faço saber...Lei: Art. 1º..."
  const antes1 = r;
  r = r.replace(
    /((?:O\s+PRESIDENTE|A\s+PRESIDENTA)\s+DA\s+REPÚBLICA\s+Faço\s+saber[^:]+:)\s*(Art\.?\s*1[ºª°]?\.?)/gi,
    (match, preambulo, art1) => {
      console.log('[SEPARAR-PREAMBULO] ✅ Padrão 1: Separando preâmbulo completo do Art. 1º');
      return `${preambulo.trim()}\n\n${art1}`;
    }
  );
  if (antes1 !== r) console.log('[SEPARAR-PREAMBULO] Padrão 1 aplicado com sucesso');
  
  // Padrão 2: Só "Faço saber...: Art. 1º"
  const antes2 = r;
  r = r.replace(
    /(Faço\s+saber[^:]+:)\s*(Art\.?\s*1[ºª°]?\.?)/gi,
    (match, facosaber, art1) => {
      if (match.includes('\n\n')) return match;
      console.log('[SEPARAR-PREAMBULO] ✅ Padrão 2: Separando "Faço saber..." do Art. 1º');
      return `${facosaber.trim()}\n\n${art1}`;
    }
  );
  if (antes2 !== r) console.log('[SEPARAR-PREAMBULO] Padrão 2 aplicado com sucesso');
  
  // Padrão 3: "seguinte Lei: Art." ou "seguinte Decreto: Art."
  const antes3 = r;
  r = r.replace(
    /(seguinte\s+(?:Lei|Decreto|Medida)[^:]*:)\s*(Art\.?\s*1[ºª°]?\.?)/gi,
    (match, final, art1) => {
      if (match.includes('\n\n')) return match;
      console.log('[SEPARAR-PREAMBULO] ✅ Padrão 3: Separando "seguinte Lei:" do Art. 1º');
      return `${final.trim()}\n\n${art1}`;
    }
  );
  if (antes3 !== r) console.log('[SEPARAR-PREAMBULO] Padrão 3 aplicado com sucesso');
  
  // Padrão 4: Genérico - qualquer ":" seguido de "Art. 1" na mesma linha
  const antes4 = r;
  r = r.replace(
    /(:)\s+(Art\.?\s*1[ºª°]?\.?\s)/gi,
    (match, doispontos, art1) => {
      if (match.includes('\n')) return match;
      console.log('[SEPARAR-PREAMBULO] ✅ Padrão 4: Adicionando quebra após ":" antes do Art. 1º');
      return `${doispontos}\n\n${art1}`;
    }
  );
  if (antes4 !== r) console.log('[SEPARAR-PREAMBULO] Padrão 4 aplicado com sucesso');
  
  // Padrão 5: ÚLTIMA LINHA DE DEFESA - se ainda tiver "Lei:" + espaços + "Art"
  const antes5 = r;
  r = r.replace(
    /(Lei:)(\s*)(Art\.)/gi,
    (match, lei, espacos, art) => {
      if (espacos.includes('\n\n')) return match;
      console.log('[SEPARAR-PREAMBULO] ✅ Padrão 5: Forçando quebra entre "Lei:" e "Art."');
      return `${lei}\n\n${art}`;
    }
  );
  if (antes5 !== r) console.log('[SEPARAR-PREAMBULO] Padrão 5 aplicado com sucesso');
  
  console.log('[SEPARAR-PREAMBULO] Primeiros 500 chars APÓS:', r.substring(0, 500));
  
  return r;
}

// ============================================================
// SEPARAR ELEMENTOS LEGAIS (§, Art., incisos, alíneas) que estão colados
// ============================================================
function separarElementosLegais(texto: string): string {
  let r = texto;
  
  console.log('[SEPARAR-ELEMENTOS] Separando parágrafos, artigos, incisos que estão colados...');
  
  // Separar parágrafos (§) que estão colados ao texto anterior
  // Exemplo: "...do Estado. § 1º Se peculiaridades..." → quebra antes do §
  r = r.replace(
    /([.;:!?])\s*(§\s*\d+[ºª°]?)/gi,
    '$1\n\n$2'
  );
  
  // Separar "Parágrafo único" que está colado
  r = r.replace(
    /([.;:!?])\s*(Parágrafo\s+único)/gi,
    '$1\n\n$2'
  );
  
  // Separar artigos (Art.) que estão colados ao texto anterior
  // Exemplo: "...publicação. Art. 2º Define-se..." → quebra antes do Art.
  r = r.replace(
    /([.;:!?])\s*(Art\.?\s*\d+[ºª°]?\.?)/gi,
    '$1\n\n$2'
  );
  
  // Separar incisos romanos (I –, II –, etc.) que estão colados
  r = r.replace(
    /([.;:])\s*([IVXLCDM]+\s*[–-])/g,
    '$1\n\n$2'
  );
  
  // Separar alíneas (a), b), c)) que estão coladas
  r = r.replace(
    /([.;:])\s*([a-z]\))/gi,
    '$1\n\n$2'
  );
  
  // Remover quebras de linha duplicadas que podem ter sido criadas
  r = r.replace(/\n{3,}/g, '\n\n');
  
  console.log('[SEPARAR-ELEMENTOS] Separação concluída');
  
  return r;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { textoBruto, htmlBruto } = await req.json();

    if (!textoBruto && !htmlBruto) {
      return new Response(
        JSON.stringify({ success: false, error: 'textoBruto ou htmlBruto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('[FORMATAR-RASPAR-LEIS] Nova abordagem: Chunks + Streaming');
    console.log(`[ENTRADA] textoBruto: ${textoBruto?.length || 0} chars, htmlBruto: ${htmlBruto?.length || 0} chars`);
    console.log(`[GEMINI] Chaves disponíveis: ${GEMINI_KEYS.length}`);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const textoEntrada = htmlBruto || textoBruto;
          
          // ========================================
          // ETAPA 1: DIVIDIR EM CHUNKS
          // ========================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            message: 'Dividindo texto em partes...',
            progress: 5
          })}\n\n`));
          
          const chunks = dividirEmChunks(textoEntrada);
          const totalChunks = chunks.length;
          
          console.log(`[DIVISAO] Texto dividido em ${totalChunks} chunks`);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'info', 
            message: `Texto dividido em ${totalChunks} partes`,
            totalChunks
          })}\n\n`));
          
          // ========================================
          // ETAPA 2: PROCESSAR CADA CHUNK
          // ========================================
          let textoCompleto = '';
          
          for (let i = 0; i < chunks.length; i++) {
            const chunkNum = i + 1;
            const chunk = chunks[i];
            
            // Enviar progresso
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'chunk_start', 
              message: `Processando parte ${chunkNum}/${totalChunks}...`,
              chunk: chunkNum,
              totalChunks,
              progress: Math.round((chunkNum / totalChunks) * 80) + 10
            })}\n\n`));
            
            // Processar chunk com Gemini
            const chunkFormatado = await processarChunkComGemini(chunk, chunkNum);
            
            // Adicionar ao texto completo
            if (textoCompleto && chunkFormatado) {
              textoCompleto += '\n\n';
            }
            textoCompleto += chunkFormatado;
            
            // ENVIAR CHUNK FORMATADO EM TEMPO REAL
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'chunk', 
              texto: chunkFormatado,
              chunkNumero: chunkNum,
              totalChunks
            })}\n\n`));
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'chunk_complete', 
              message: `Parte ${chunkNum}/${totalChunks} concluída`,
              chunk: chunkNum,
              totalChunks,
              progress: Math.round((chunkNum / totalChunks) * 80) + 10
            })}\n\n`));
          }
          
          // ========================================
          // ETAPA 3: PÓS-PROCESSAMENTO
          // ========================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            message: 'Finalizando formatação...',
            progress: 90
          })}\n\n`));
          
          // Limpeza final
          let textoFinal = textoCompleto;
          
          // JUNTAR LINHAS FRAGMENTADAS (incisos/alíneas quebrados no meio)
          textoFinal = posLimparQuebrasFragmentadas(textoFinal);
          
          // REMOVER DUPLICATAS (artigos, parágrafos, incisos, alíneas)
          // Quando há Art. 4º ou § 2º duplicado, manter apenas o último
          textoFinal = removerDuplicatas(textoFinal);
          
          // MANTER ARTIGOS CITADOS ENTRE ASPAS JUNTO DO ARTIGO CITANTE
          // Art. 34-A citado dentro do Art. 24-A não deve ser separado
          textoFinal = manterArtigosCitadosJuntos(textoFinal);
          
          // JUNTAR PREÂMBULO: "A PRESIDENTA DA REPÚBLICA" + "Faço saber..."
          textoFinal = juntarPreambulo(textoFinal);
          
          // SEPARAR PREÂMBULO DO ART. 1º (garantir que não ficam colados)
          textoFinal = separarPreambulo(textoFinal);
          
          // SEPARAR PARÁGRAFOS E INCISOS que estão colados
          textoFinal = separarElementosLegais(textoFinal);
          
          // SEPARAR ASSINATURAS do último artigo
          textoFinal = separarAssinaturas(textoFinal);
          
          // ========================================
          // ETAPA 4: CORREÇÃO DE PONTUAÇÃO COM IA
          // ========================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            message: 'Corrigindo pontuação com IA...',
            progress: 93
          })}\n\n`));
          
          // CORRIGIR PONTUAÇÃO FALTANTE (pontos, parênteses, etc.)
          textoFinal = await corrigirPontuacaoComGemini(textoFinal);
          
          // ========================================
          // ETAPA 5: VALIDAÇÃO FINAL DO PRESIDENTE
          // ========================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'progress', 
            message: 'Validando assinaturas...',
            progress: 97
          })}\n\n`));
          
          // GARANTIR PRESIDENTE NA ASSINATURA (DEPOIS de todas as correções)
          // Validar que o nome do presidente foi preservado
          textoFinal = garantirPresidenteNaAssinatura(textoEntrada, textoFinal);
          
          // Remover linhas em branco excessivas
          textoFinal = textoFinal.replace(/\n{4,}/g, '\n\n\n');
          
          // Remover espaços duplos
          textoFinal = textoFinal.replace(/  +/g, ' ');
          
          // Trim de cada linha
          textoFinal = textoFinal.split('\n').map(l => l.trim()).join('\n');
          
          textoFinal = textoFinal.trim();
          
          console.log(`[RESULTADO] Texto final: ${textoFinal.length} caracteres`);
          
          // ========================================
          // RESULTADO FINAL
          // ========================================
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'complete', 
            texto: textoFinal,
            chunksProcessados: totalChunks,
            artigos: [],
            areasIdentificadas: []
          })}\n\n`));
          
          controller.close();
          
        } catch (error: any) {
          console.error('[STREAM ERROR]', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            error: error.message || 'Erro desconhecido'
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('[MAIN ERROR]', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
