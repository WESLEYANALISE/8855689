import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { BLOCOS_BASE, EXTENSAO_CONFIG } from './prompt-templates.ts';
import { AULA_SYSTEM_PROMPT, AULA_USER_PROMPT } from './aula-prompts.ts';
import { detectarFAQ } from './faq-map.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
};

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages, files, mode, extractedText, deepMode = false, responseLevel = 'complete', linguagemMode = 'tecnico' }: any = await request.json();
    
    // Sistema de fallback com 3 chaves API
    const API_KEYS = [
      { name: 'GEMINI_KEY_1', key: Deno.env.get('GEMINI_KEY_1') },
      { name: 'GEMINI_KEY_2', key: Deno.env.get('GEMINI_KEY_2') },
      { name: 'GEMINI_KEY_3', key: Deno.env.get('GEMINI_KEY_3') },
      { name: 'DIREITO_PREMIUM_API_KEY', key: Deno.env.get('DIREITO_PREMIUM_API_KEY') }
    ].filter(k => k.key);
    
    console.log('📥 Requisição recebida:', {
      mode,
      messagesCount: messages?.length,
      filesCount: files?.length || 0,
      availableKeys: API_KEYS.map(k => k.name),
      totalKeys: API_KEYS.length
    });
    
    if (API_KEYS.length === 0) {
      console.error('❌ Nenhuma chave API configurada');
      return new Response(
        JSON.stringify({ error: 'Nenhuma chave API configurada. Configure GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3 ou DIREITO_PREMIUM_API_KEY.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Detectar se é ação pós-análise (usuário clicou em "Resumir", "Explicar", etc.)
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const isPostAnalysisAction = lastUserMessage.includes('Com base no material que você analisou');
    
    // Se é ação pós-análise, não usar modo de análise inicial
    const isAnalyzeMode = mode === 'analyze' && !isPostAnalysisAction;
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Constante de timeout (55 segundos para dar margem antes do timeout da edge function de 60s)
    const API_TIMEOUT_MS = 55000;
    
    // Detectar se há imagem ou PDF anexado
    const hasImageOrPdf = files && files.length > 0;

    const supabaseClient = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );

    // Função para detectar artigos
    async function detectArtigos(text: string) {
      const regex = /(Art\.\s?\d+(\-\d+)?[A-Z]?(\,?\s?§\s?\d+)?(\,?\s?Inciso\s?[IVXLCDM]+)?(\,?\s?Parágrafo\s?\d+)?(\,?\s?nº\s?\d+)?)\s([\s\S]*?)(\.|;|\\n)/gmi;
      let matches = [...text.matchAll(regex)];
      let artigos = matches.map(match => {
        return {
          texto: match[0].trim()
        };
      });

      // Remover duplicatas
      artigos = artigos.filter((artigo, index, self) =>
        index === self.findIndex((t) => (
          t.texto === artigo.texto
        ))
      );

      return artigos;
    }

    // Função para buscar contexto do banco de dados - EXPANDIDA COM VADE MECUM E RESUMOS
    async function buscarContextoBancoDados(pergunta: string) {
      let contextoExtra = "";
      
      try {
        // Mapa completo de todas as tabelas do Vade Mecum
        const MAPA_CODIGOS: Record<string, string> = {
          // Códigos
          'CP': 'CP - Código Penal',
          'CÓDIGO PENAL': 'CP - Código Penal',
          'PENAL': 'CP - Código Penal',
          'CC': 'CC - Código Civil',
          'CÓDIGO CIVIL': 'CC - Código Civil',
          'CIVIL': 'CC - Código Civil',
          'CF': 'CF - Constituição Federal',
          'CONSTITUIÇÃO': 'CF - Constituição Federal',
          'CONSTITUICAO': 'CF - Constituição Federal',
          'CPC': 'CPC – Código de Processo Civil',
          'PROCESSO CIVIL': 'CPC – Código de Processo Civil',
          'CPP': 'CPP – Código de Processo Penal',
          'PROCESSO PENAL': 'CPP – Código de Processo Penal',
          'CLT': 'CLT - Consolidação das Leis do Trabalho',
          'TRABALHISTA': 'CLT - Consolidação das Leis do Trabalho',
          'TRABALHO': 'CLT - Consolidação das Leis do Trabalho',
          'CDC': 'CDC – Código de Defesa do Consumidor',
          'CONSUMIDOR': 'CDC – Código de Defesa do Consumidor',
          'CTN': 'CTN – Código Tributário Nacional',
          'TRIBUTÁRIO': 'CTN – Código Tributário Nacional',
          'TRIBUTARIO': 'CTN – Código Tributário Nacional',
          'CTB': 'CTB Código de Trânsito Brasileiro',
          'TRÂNSITO': 'CTB Código de Trânsito Brasileiro',
          'TRANSITO': 'CTB Código de Trânsito Brasileiro',
          'CE': 'CE – Código Eleitoral',
          'ELEITORAL': 'CE – Código Eleitoral',
          'CPM': 'CPM – Código Penal Militar',
          'PENAL MILITAR': 'CPM – Código Penal Militar',
          'CPPM': 'CPPM – Código de Processo Penal Militar',
          'CA': 'CA - Código de Águas',
          'ÁGUAS': 'CA - Código de Águas',
          'CF FLORESTAL': 'CF - Código Florestal',
          'FLORESTAL': 'CF - Código Florestal',
          'CBA': 'CBA Código Brasileiro de Aeronáutica',
          'AERONÁUTICA': 'CBA Código Brasileiro de Aeronáutica',
          // Estatutos
          'ECA': 'ESTATUTO - ECA',
          'CRIANÇA': 'ESTATUTO - ECA',
          'ADOLESCENTE': 'ESTATUTO - ECA',
          'OAB': 'ESTATUTO - OAB',
          'ADVOGADO': 'ESTATUTO - OAB',
          'IDOSO': 'ESTATUTO - Idoso',
          'DEFICIÊNCIA': 'ESTATUTO - Deficiência',
          'PCD': 'ESTATUTO - Deficiência',
          // Leis Especiais
          'LGPD': 'LEI 13709 - LGPD',
          '13709': 'LEI 13709 - LGPD',
          'PROTEÇÃO DE DADOS': 'LEI 13709 - LGPD',
          'LICITAÇÃO': 'LEI 14133 - Licitações',
          'LICITAÇÕES': 'LEI 14133 - Licitações',
          '14133': 'LEI 14133 - Licitações',
          'IMPROBIDADE': 'LEI 8429 - Improbidade',
          '8429': 'LEI 8429 - Improbidade',
          'DROGAS': 'LEI 11343 - Drogas',
          '11343': 'LEI 11343 - Drogas',
          'MARIA DA PENHA': 'LEI 11340 - Maria da Penha',
          '11340': 'LEI 11340 - Maria da Penha',
          'VIOLÊNCIA DOMÉSTICA': 'LEI 11340 - Maria da Penha',
          'TORTURA': 'LEI 9455 - Tortura',
          '9455': 'LEI 9455 - Tortura',
          'RACISMO': 'LEI 7716 - Racismo',
          '7716': 'LEI 7716 - Racismo',
          'CRIMES HEDIONDOS': 'LEI 8072 - Crimes Hediondos',
          '8072': 'LEI 8072 - Crimes Hediondos',
          'HEDIONDOS': 'LEI 8072 - Crimes Hediondos',
          'EXECUÇÃO PENAL': 'LEI 7210 - Execução Penal',
          '7210': 'LEI 7210 - Execução Penal',
          'LEP': 'LEI 7210 - Execução Penal',
          'JUIZADOS': 'LEI 9099 - Juizados Especiais',
          '9099': 'LEI 9099 - Juizados Especiais',
          'ABUSO DE AUTORIDADE': 'LEI 13869 - Abuso de Autoridade',
          '13869': 'LEI 13869 - Abuso de Autoridade',
          'INTERCEPTAÇÃO': 'LEI 9296 - Interceptação Telefônica',
          '9296': 'LEI 9296 - Interceptação Telefônica',
          'LAVAGEM': 'LEI 9613 - Lavagem de Dinheiro',
          '9613': 'LEI 9613 - Lavagem de Dinheiro',
          'ORGANIZAÇÃO CRIMINOSA': 'LEI 12850 - Organização Criminosa',
          '12850': 'LEI 12850 - Organização Criminosa',
          'ORCRIM': 'LEI 12850 - Organização Criminosa',
        };

        // 1. Detectar números de artigos
        const artigoRegex = /art(?:igo)?\.?\s*(\d+)/gi;
        const matches = [...pergunta.matchAll(artigoRegex)];
        const numerosArtigos = matches.map(m => m[1]);

        // 2. Detectar código/lei mencionada
        const perguntaUpper = pergunta.toUpperCase();
        let tabelaBusca: string | null = null;
        
        for (const [termo, tabela] of Object.entries(MAPA_CODIGOS)) {
          if (perguntaUpper.includes(termo)) {
            tabelaBusca = tabela;
            break;
          }
        }

        // 3. Buscar artigos específicos se foram mencionados
        if (numerosArtigos.length > 0 && tabelaBusca) {
          console.log(`📚 Buscando artigos ${numerosArtigos.join(', ')} em ${tabelaBusca}`);
          const { data: artigos, error } = await supabaseClient
            .from(tabelaBusca as any)
            .select('*')
            .in('Número do Artigo', numerosArtigos)
            .limit(5);

          if (!error && artigos && artigos.length > 0) {
            contextoExtra += "\n\n📚 ARTIGOS DO VADE MECUM:\n\n";
            artigos.forEach((art: any) => {
              contextoExtra += `**Art. ${art['Número do Artigo']} - ${tabelaBusca?.split(' - ')[1] || tabelaBusca}**\n`;
              contextoExtra += `${art.Artigo}\n`;
              if (art.explicacao_resumido) {
                contextoExtra += `💡 Explicação: ${art.explicacao_resumido}\n`;
              }
              contextoExtra += "\n";
            });
          }
        }

        // 4. Buscar na tabela RESUMO por área/tema relacionado
        const palavrasChave = pergunta.toLowerCase().split(' ')
          .filter(p => p.length > 4 && !['sobre', 'como', 'qual', 'quais', 'pode', 'fazer'].includes(p))
          .slice(0, 5);
        
        if (palavrasChave.length > 0) {
          console.log(`📖 Buscando resumos para: ${palavrasChave.join(', ')}`);
          const { data: resumos, error: resumoError } = await supabaseClient
            .from('RESUMO')
            .select('area, tema, subtema, conteudo_gerado')
            .or(palavrasChave.map(p => `tema.ilike.%${p}%,subtema.ilike.%${p}%,area.ilike.%${p}%`).join(','))
            .not('conteudo_gerado', 'is', null)
            .limit(2);

          if (!resumoError && resumos && resumos.length > 0) {
            contextoExtra += "\n\n📝 RESUMOS JURÍDICOS RELACIONADOS:\n\n";
            resumos.forEach((resumo: any) => {
              contextoExtra += `**${resumo.area} > ${resumo.tema} > ${resumo.subtema}**\n`;
              // Garantir que conteudo_gerado é string antes de usar substring
              const conteudo = typeof resumo.conteudo_gerado === 'string' 
                ? resumo.conteudo_gerado 
                : JSON.stringify(resumo.conteudo_gerado);
              const preview = conteudo?.substring(0, 800) || '';
              if (preview) {
                contextoExtra += `${preview}...\n\n`;
              }
            });
          }
        }

        // 5. Buscar termos jurídicos no dicionário
        if (palavrasChave.length > 0) {
          const { data: termos, error } = await supabaseClient
            .from('DICIONARIO')
            .select('*')
            .or(palavrasChave.map(p => `Palavra.ilike.%${p}%`).join(','))
            .limit(3);

          if (!error && termos && termos.length > 0) {
            contextoExtra += "\n\n📖 DEFINIÇÕES JURÍDICAS:\n\n";
            termos.forEach((termo: any) => {
              contextoExtra += `**${termo.Palavra}:** ${termo.Significado}\n`;
              if (termo.exemplo_pratico) {
                contextoExtra += `Exemplo: ${termo.exemplo_pratico}\n`;
              }
              contextoExtra += "\n";
            });
          }
        }

        // 6. Buscar conteúdo de cursos relacionados
        if (palavrasChave.length > 0) {
          const { data: cursosRelacionados, error: cursosError } = await supabaseClient
            .from('CURSOS-APP')
            .select('area, tema, conteudo')
            .or(palavrasChave.map(p => `tema.ilike.%${p}%`).join(','))
            .limit(1);

          if (!cursosError && cursosRelacionados && cursosRelacionados.length > 0) {
            contextoExtra += "\n\n🎓 CONTEÚDO DE CURSOS:\n\n";
            cursosRelacionados.forEach((curso: any) => {
              contextoExtra += `**${curso.tema}** (${curso.area})\n`;
              const preview = curso.conteudo?.substring(0, 400) || '';
              if (preview) {
                contextoExtra += `${preview}...\n\n`;
              }
            });
          }
        }

        if (contextoExtra) {
          console.log(`✅ Contexto encontrado: ${contextoExtra.length} caracteres`);
        }

      } catch (error) {
        console.error('Erro ao buscar contexto do banco:', error);
      }

      return contextoExtra;
    }

    const fileAnalysisPrefix = files && files.length > 0
      ? "\n\nTEXTO EXTRAÍDO DOS ARQUIVOS:\n" + extractedText
      : "";

    // Construir contexto customizado
    let cfContext = "";
    if (deepMode) {
      cfContext = `\n\nCONTEXTO:\n- O usuário pediu análise aprofundada\n`;
    }
    
    // Buscar contexto adicional do banco de dados
    const contextoBanco = await buscarContextoBancoDados(lastUserMessage);
    if (contextoBanco) {
      cfContext += contextoBanco;
    }
    
    // 🎯 DETECTAR FAQ - Adicionar contexto específico se for pergunta frequente
    const faqMatch = detectarFAQ(lastUserMessage);
    if (faqMatch) {
      console.log(`📌 FAQ detectada: "${faqMatch.pergunta}"`);
      cfContext += `\n\n🎯 CONTEXTO ESPECÍFICO PARA ESTA PERGUNTA:\n${faqMatch.contexto}`;
      if (faqMatch.artigos && faqMatch.artigos.length > 0) {
        cfContext += `\n\nARTIGOS RELEVANTES: ${faqMatch.artigos.join(', ')}`;
      }
    }
    
    // Instruções FORTES para análise automática de imagem/PDF
    // Preparar o prompt do sistema baseado no modo e nível de resposta
    let systemPrompt = '';
    
    if (isAnalyzeMode) {
      systemPrompt = `Você é uma Professora de Direito analisando material de forma objetiva.

🚨 MODO: ANÁLISE INICIAL SÉRIA E PROFISSIONAL

REGRAS CRÍTICAS:
❌ NÃO use tom descomplicado/informal/didático
❌ NÃO explique conceitos sem antes transcrever
❌ NÃO use linguagem coloquial ("tipo assim", "olha", "sacou")
✅ Seja séria, objetiva e descritiva
✅ Transcreva primeiro, analise depois
✅ Use linguagem técnica apropriada

ESTRUTURA OBRIGATÓRIA:
1. TRANSCRIÇÃO/DESCRIÇÃO literal do conteúdo
2. **Tema principal:** [identificar em 1 frase]
3. "Como posso te ajudar com este material?"
4. [ACAO_BUTTONS]

${cfContext}`;
      
    } else if (mode === 'lesson') {
      systemPrompt = `Você é a Professora Jurídica, uma educadora especializada em ensinar direito de forma didática e profunda.

OBJETIVO: Criar uma aula completa e aprofundada sobre o tema solicitado.

NUNCA USE DIAGRAMAS - Use apenas texto formatado e componentes visuais.

${BLOCOS_BASE.regrasFormatacao}

COMPONENTES VISUAIS OBRIGATÓRIOS:

[IMPORTANTE], [ATENÇÃO], [DICA], [NOTA]

[COMPARAÇÃO: Título Descritivo]
{\\"cards\\":[{\\"title\\":\\"Conceito A\\",\\"description\\":\\"Explicação completa\\",\\"example\\":\\"Exemplo\\",\\"icon\\":\\"📜\\"}]}
[/COMPARAÇÃO]

[CASOS_PRATICOS]
{\\"cases\\":[{\\"title\\":\\"Caso 1\\",\\"scenario\\":\\"Descrição\\",\\"analysis\\":\\"Análise\\",\\"solution\\":\\"Solução\\",\\"legalBasis\\":[\\"Art. X\\"],\\"icon\\":\\"⚖️\\"}]}
[/CASOS_PRATICOS]

[QUESTOES_CLICAVEIS]
[\\"Pergunta 1?\\",\\"Pergunta 2?\\",\\"Pergunta 3?\\\"]
[/QUESTOES_CLICAVEIS]

⚠️ EXTENSÃO OBRIGATÓRIA - NÍVEL: ${responseLevel}
- basic: Mínimo ${EXTENSAO_CONFIG.lesson.basic.palavras[0]} palavras
- deep: Mínimo ${EXTENSAO_CONFIG.lesson.deep.palavras[0]} palavras  
- complete: Mínimo ${EXTENSAO_CONFIG.lesson.complete.palavras[0]} palavras

${cfContext || ''}`;
    } else if (mode === 'recommendation') {
      systemPrompt = `Você é a Professora Jurídica, assistente de estudos especializada em direito brasileiro.

MODO: Recomendação de Conteúdo
OBJETIVO: Recomendar materiais de estudo relevantes e personalizados.

Inclua links e organize por tipo (artigos, jurisprudência, livros, videoaulas, etc.).`;
    } else if (mode === 'aula') {
      // MODO AULA - Geração de estrutura de aula interativa
      const tema = lastUserMessage;
      console.log('📚 Modo AULA - Gerando estrutura para:', tema);
      systemPrompt = AULA_SYSTEM_PROMPT;
      
      // Substituir mensagem do usuário pelo prompt formatado
      if (messages.length > 0) {
        messages[messages.length - 1].content = AULA_USER_PROMPT(tema);
      }
    } else {
      // Modo padrão - chat de estudos (APENAS TÉCNICO)
      const level = responseLevel || 'complete';
      
      // MODO TÉCNICO - Padrão: COMPLETO e DETALHADO
      systemPrompt = `Você é a Professora Jurídica, uma assistente especializada em Direito brasileiro.

REGRA CRÍTICA: Responda DIRETAMENTE o que foi perguntado. Seja COMPLETA e DETALHADA.

⚠️ EXTENSÃO OBRIGATÓRIA - NÍVEL: ${level}
- basic: Mínimo ${EXTENSAO_CONFIG.tecnico.basic.palavras[0]} palavras (${EXTENSAO_CONFIG.tecnico.basic.caracteres[0]}-${EXTENSAO_CONFIG.tecnico.basic.caracteres[1]} caracteres)
- complete: Mínimo ${EXTENSAO_CONFIG.tecnico.complete.palavras[0]} palavras (${EXTENSAO_CONFIG.tecnico.complete.caracteres[0]}-${EXTENSAO_CONFIG.tecnico.complete.caracteres[1]} caracteres)
- deep: Mínimo ${EXTENSAO_CONFIG.tecnico.deep.palavras[0]} palavras (${EXTENSAO_CONFIG.tecnico.deep.caracteres[0]}-${EXTENSAO_CONFIG.tecnico.deep.caracteres[1]} caracteres)

📊 QUADRO COMPARATIVO OBRIGATÓRIO:
Em TODA resposta elaborada (mais de 400 palavras), inclua OBRIGATORIAMENTE um quadro comparativo usando o formato Markdown:

| Aspecto | Conceito A | Conceito B |
|---------|------------|------------|
| Definição | ... | ... |
| Características | ... | ... |
| Aplicação | ... | ... |
| Exemplo | ... | ... |

Use este quadro para contrastar conceitos relacionados, antes vs depois, teoria vs prática, etc.

⚠️ REGRA CRÍTICA - NUNCA TRUNCAR:
- SEMPRE complete suas respostas integralmente
- Se a resposta for longa, organize em seções claras
- NUNCA termine uma resposta no meio de uma frase ou ideia
- Caso o conteúdo seja extenso, priorize completar a explicação principal antes de adicionar exemplos extras
- Finalize SEMPRE com uma conclusão ou pergunta de fechamento

COMPORTAMENTO OBRIGATÓRIO:
1. Se o usuário fizer uma PERGUNTA sobre Direito → RESPONDA A PERGUNTA DIRETAMENTE com uma explicação clara e COMPLETA.
2. Se o usuário disser APENAS saudação ("oi", "olá") → Responda com saudação CURTA e pergunte como pode ajudar.
3. Se o usuário mencionar uma ÁREA do direito SEM pergunta específica → Pergunte em qual tópico específico ele quer ajuda.

FORMATO DE RESPOSTA PARA PERGUNTAS:
- Resposta direta, objetiva e DETALHADA
- Use **negrito** para termos jurídicos importantes
- Inclua fundamento legal quando relevante (Art. X do Código Y)
- Inclua exemplos práticos com nomes (João, Maria, Ana)
- Finalize perguntando se quer saber mais ou aprofundar

FORMATO DE SUGESTÕES (quando apropriado):
Quando listar opções ou tópicos para o usuário escolher, use BULLET POINTS:
- Tópico 1
- Tópico 2
- Tópico 3

Os bullet points são CLICÁVEIS para o usuário.

ESTILO:
- Tom profissional mas acessível
- Use **negrito** para termos jurídicos importantes
- Seja útil e prestativa
- Respostas COMPLETAS e DETALHADAS

${cfContext || ''}`;
    }

    // Validar arquivos
    if (files && files.length > 0) {
      for (const file of files) {
        const dataSize = file.data?.split(',')[1]?.length || 0;
        
        if (file.type.includes('image')) {
          console.log('✅ Imagem válida será enviada para Gemini');
        } else if (file.type.includes('pdf')) {
          console.log(`✅ PDF válido com ${dataSize} caracteres extraídos`);
        }
      }
    }

    // Converter mensagens para formato Gemini
    const geminiContents = [];
    
    const imageParts: any[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type.includes('image')) {
          const base64Data = file.data.split(',')[1];
          const dataSize = base64Data?.length || 0;
          console.log(`🖼️ Adicionando imagem: ${file.type}, tamanho base64: ${dataSize} caracteres`);
          
          if (dataSize === 0) {
            console.error('❌ Imagem vazia ou inválida!');
            continue;
          }
          
          imageParts.push({
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          });
        }
      }
      console.log(`✅ Total de imagens processadas: ${imageParts.length}`);
    }
    
    if (messages.length > 0 && messages[0].role === 'user') {
      const userParts: any[] = [{ text: systemPrompt + '\n\n---\n\n' + messages[0].content }];
      
      if (imageParts.length > 0) {
        userParts.push(...imageParts);
      }
      
      geminiContents.push({
        role: 'user',
        parts: userParts
      });
      
      for (let i = 1; i < messages.length; i++) {
        geminiContents.push({
          role: messages[i].role === 'user' ? 'user' : 'model',
          parts: [{ text: messages[i].content }]
        });
      }
    }

    const modoAtual = mode === 'lesson' ? 'lesson' : 
                      mode === 'recommendation' ? 'recommendation' : 
                      mode === 'aula' ? 'aula' :
                      linguagemMode;
    const nivelAtual = mode === 'recommendation' && responseLevel !== 'complete' ? 'basic' :
                       responseLevel || 'complete';
    
    const config = EXTENSAO_CONFIG[modoAtual]?.[nivelAtual];
    
    // Para modo aula, usar tokens maiores já que é JSON grande
    const maxTokensForMode = mode === 'aula' ? 32000 : 
                             linguagemMode === 'descomplicado' 
                               ? ((config?.tokens || 3500) * 2)
                               : (config?.tokens || 3500);
    
    const geminiPayload = {
      contents: geminiContents,
      generationConfig: {
        temperature: mode === 'aula' ? 0.7 : 0.4,
        topP: 0.85,
        maxOutputTokens: mode === 'aula' ? 32000 : 16384
      }
    };

    const acceptHeader = request.headers.get('Accept') || '';
    const wantsSSE = acceptHeader.includes('text/event-stream');
    
    const modelName = 'gemini-2.0-flash'; // Versão mais rápida
    
    console.log('🤖 Chamando Gemini API...', {
      mode,
      linguagemMode,
      responseLevel,
      maxTokens: config?.tokens,
      expectedChars: config?.caracteres,
      wantsSSE,
      model: modelName,
      keysAvailable: API_KEYS.length
    });
    
    const apiStartTime = Date.now();
    
    // Função para chamar Gemini com fallback de chaves
    async function chamarGeminiComFallback(isStreaming: boolean): Promise<Response> {
      let lastError: Error | null = null;
      
      for (const { name, key } of API_KEYS) {
        try {
          const url = isStreaming 
            ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${key}`
            : `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
          
          console.log(`🔑 Tentando com ${name}...`);
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Function-Revision': 'v9.0.0-gemini-2.5-flash-fallback'
            },
            body: JSON.stringify(geminiPayload)
          });
          
          if (response.ok) {
            console.log(`✅ Sucesso com ${name} em ${Date.now() - apiStartTime}ms`);
            return response;
          }
          
          // Se for erro de quota (429), tentar próxima chave
          if (response.status === 429) {
            const errorText = await response.text();
            console.log(`⚠️ Quota excedida em ${name}, tentando próxima chave...`);
            lastError = new Error(`${name}: quota excedida`);
            continue;
          }
          
          // Outro erro, lançar
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
            console.log(`⚠️ Erro de quota em ${name}: ${errorMsg}`);
            lastError = error instanceof Error ? error : new Error(errorMsg);
            continue;
          }
          throw error;
        }
      }
      
      throw lastError || new Error('Todas as chaves API esgotaram a quota. Tente novamente em alguns minutos.');
    }

    if (wantsSSE) {
      // STREAMING REAL - usando streamGenerateContent
      console.log('🚀 Iniciando streaming real do Gemini 2.5 Flash...');
      
      const geminiResponse = await chamarGeminiComFallback(true);
      
      const apiResponseTime = Date.now() - apiStartTime;
      console.log(`⏱️ Primeira resposta em ${apiResponseTime}ms`);
      
      // Criar stream que repassa os chunks do Gemini em tempo real
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      const transformStream = new TransformStream<Uint8Array, Uint8Array>({
        start(controller) {
          // Keepalive inicial
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        },
        
        transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });
          const lines = text.split('\n');
          
          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              
              try {
                const data = JSON.parse(jsonStr);
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (content) {
                  // Repassar conteúdo no formato SSE do OpenAI
                  const sseEvent = {
                    choices: [{
                      delta: { content },
                      index: 0,
                      finish_reason: null
                    }]
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseEvent)}\n\n`));
                }
                
                // Verificar se terminou
                const finishReason = data.candidates?.[0]?.finishReason;
                if (finishReason && finishReason !== 'STOP') {
                  console.log(`📊 Finish reason: ${finishReason}`);
                }
              } catch (e) {
                // Ignorar linhas que não são JSON válido
              }
            }
          }
        },
        
        flush(controller) {
          // Evento de conclusão
          const doneEvent = {
            choices: [{
              delta: {},
              index: 0,
              finish_reason: 'stop'
            }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneEvent)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          
          const totalTime = Date.now() - startTime;
          console.log(`✅ Stream real concluído em ${totalTime}ms`);
        }
      });
      
      // Pipe do stream do Gemini através do transformador
      const responseStream = geminiResponse.body!.pipeThrough(transformStream);
      
      return new Response(responseStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
      
    } else {
      // Resposta normal (não streaming) - sem modo descomplicado
      console.log('🚀 Iniciando fetch para Gemini (não-streaming)...');
      
      const geminiResponse = await chamarGeminiComFallback(false);

      const geminiData = await geminiResponse.json();
      const fullResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log('✅ Resposta recebida:', {
        charCount: fullResponse.length,
        wordCount: fullResponse.split(/\s+/).length
      });

      const totalTime = Date.now() - startTime;
      console.log(`⏱️ Tempo total: ${totalTime}ms`);

      return new Response(
        JSON.stringify({ content: fullResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
