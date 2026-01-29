import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JurisprudenciaPayload {
  jurisprudencia: {
    titulo: string;
    tribunal?: string;
    tipo?: string;
    texto?: string;
    tese?: string;
    ementa?: string;
    enunciado?: string;
    textoTese?: string;
    textoEmenta?: string;
    data?: string;
    relator?: string;
    resumo?: string;
    pontosChave?: string[];
  };
  modo: 'resumo' | 'descomplicar' | 'sem-juridiques' | 'pontos-chave' | 'aplicacao' | 'termos';
}

// Função para gerar identificador único da jurisprudência
function gerarIdentificador(j: JurisprudenciaPayload['jurisprudencia']): string {
  const base = `${j.titulo || ''}-${j.tribunal || ''}-${j.tipo || ''}`.toLowerCase().trim();
  // Hash simples para identificação
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Instruções de formatação padrão - CRÍTICAS para boa visualização
const INSTRUCOES_FORMATACAO = `

---

## ⚠️ REGRAS DE FORMATAÇÃO OBRIGATÓRIAS:

### ESPAÇAMENTO (MUITO IMPORTANTE):
- SEMPRE deixe UMA LINHA EM BRANCO antes de cada título (## ou ###)
- SEMPRE deixe UMA LINHA EM BRANCO depois de cada título
- SEMPRE deixe UMA LINHA EM BRANCO entre parágrafos
- Parágrafos devem ser curtos (2-4 linhas máximo)

### CITAÇÕES (USE O FORMATO CORRETO):
Quando citar trechos da decisão, artigos de lei ou doutrina, use EXATAMENTE este formato:

> "Texto da citação aqui entre aspas"

Exemplo correto:

> "O artigo 44, § 2º, do Código Penal prevê a possibilidade de substituição da pena privativa de liberdade."

### ESTRUTURA DE TÍTULOS:
- Use ## para seções principais (com emoji no início)
- Use ### para subtítulos
- NUNCA coloque título grudado no texto

### DESTAQUES:
- Use **negrito** para termos jurídicos importantes
- Use \`código\` para artigos de lei (ex: \`Art. 5º, CF\`)

### LISTAS:
- Deixe linha em branco antes e depois de listas
- Use - para itens de lista

### EXEMPLO DE FORMATAÇÃO CORRETA:

## 📋 Título Principal

Primeiro parágrafo explicativo aqui.

Segundo parágrafo com mais detalhes.

### Subtítulo

Conteúdo do subtítulo.

> "Citação importante do tribunal ou da lei aqui"

Explicação sobre a citação.

`;

// Prompts específicos para cada modo
const PROMPTS: Record<string, (j: JurisprudenciaPayload['jurisprudencia']) => string> = {
  resumo: (j) => `Você é um jurista especializado. Analise a jurisprudência abaixo e crie um **RESUMO OBJETIVO**.

---

## 📄 Dados da Jurisprudência

- **Título**: ${j.titulo}
${j.tribunal ? `- **Tribunal**: ${j.tribunal}` : ''}
${j.data ? `- **Data**: ${j.data}` : ''}
${j.relator ? `- **Relator**: ${j.relator}` : ''}

---

## 📝 Conteúdo Original

${j.textoTese || j.tese || ''}
${j.textoEmenta || j.ementa || ''}
${j.enunciado || j.texto || ''}

---

## 🎯 Sua Tarefa

Escreva um resumo estruturado com:

### Estrutura Obrigatória:

1. **## 📋 Síntese do Caso** - O que aconteceu (2-3 parágrafos)

2. **## ⚖️ Fundamentos Jurídicos** - Base legal e doutrinária

3. **## 🎯 Decisão do Tribunal** - O que foi decidido

4. **## 💡 Relevância** - Por que esta decisão é importante

${INSTRUCOES_FORMATACAO}`,

  descomplicar: (j) => `Você é um professor de direito experiente e didático. Sua tarefa é **DESCOMPLICAR** a jurisprudência, mantendo precisão técnica mas tornando acessível.

---

## 📄 Jurisprudência a Explicar

- **Título**: ${j.titulo}
${j.tribunal ? `- **Tribunal**: ${j.tribunal}` : ''}

## 📝 Conteúdo

${j.textoTese || j.tese || ''}
${j.textoEmenta || j.ementa || ''}
${j.enunciado || j.texto || ''}

---

## 🎯 Sua Tarefa

Explique de forma clara e didática, usando a seguinte estrutura:

### Estrutura Obrigatória:

1. **## 🎯 Tema Central** - Do que se trata (1-2 parágrafos simples)

2. **## 📖 Explicação Detalhada** - Desenvolva o tema com clareza
   - Mantenha termos técnicos importantes, mas explique-os entre parênteses
   - Use exemplos quando apropriado

3. **## 💡 Pontos de Destaque** - Lista com os pontos principais

4. **## ✅ Conclusão** - Resumo final em linguagem acessível

${INSTRUCOES_FORMATACAO}`,

  'sem-juridiques': (j) => `Você é um comunicador que traduz textos jurídicos para linguagem popular. Sua tarefa é explicar **SEM USAR JURIDIQUÊS**.

---

## 📄 Jurisprudência Original

- **Título**: ${j.titulo}
${j.tribunal ? `- **Tribunal**: ${j.tribunal}` : ''}

## 📝 Texto Jurídico

${j.textoTese || j.tese || ''}
${j.textoEmenta || j.ementa || ''}
${j.enunciado || j.texto || ''}

---

## 🎯 Sua Tarefa

Explique como se estivesse conversando com um amigo que não é advogado:

### Estrutura Obrigatória:

1. **## 🤔 Do que se trata?** - Explique o caso de forma bem simples (como contaria para sua avó)

2. **## 📖 O que aconteceu?** - Conte a história do caso
   - Use analogias do dia a dia
   - Faça comparações com situações comuns

3. **## ⚖️ O que o tribunal decidiu?** - A decisão em palavras simples

4. **## 💡 O que isso significa na prática?** - Como isso afeta as pessoas

### ⛔ EVITE COMPLETAMENTE:
- Termos como: autos, petitório, litisconsórcio, interlocutório, etc.
- Latinismos jurídicos
- Linguagem rebuscada

### ✅ USE:
- Palavras do cotidiano
- Exemplos práticos
- Comparações simples

${INSTRUCOES_FORMATACAO}`,

  'pontos-chave': (j) => `Você é um jurista analítico. Extraia os **PONTOS-CHAVE** da jurisprudência de forma organizada.

---

## 📄 Jurisprudência

- **Título**: ${j.titulo}
${j.tribunal ? `- **Tribunal**: ${j.tribunal}` : ''}
${j.data ? `- **Data**: ${j.data}` : ''}

## 📝 Conteúdo

${j.textoTese || j.tese || ''}
${j.textoEmenta || j.ementa || ''}
${j.enunciado || j.texto || ''}

---

## 🎯 Sua Tarefa

Liste de 5 a 8 pontos-chave estruturados:

### Estrutura Obrigatória:

## 📌 Pontos-Chave

Para cada ponto, use este formato:

### 1. **[Título do Ponto]**

> Citação relevante da jurisprudência (se aplicável)

Explicação do ponto em 2-3 linhas.

---

### 2. **[Próximo Ponto]**

(continue o padrão...)

---

### Pontos a Incluir:
- **Tese central** da decisão
- **Fundamento legal** principal
- **Requisitos** estabelecidos
- **Exceções** ou ressalvas
- **Consequências práticas**

${INSTRUCOES_FORMATACAO}`,

  aplicacao: (j) => `Você é um advogado prático com vasta experiência. Explique como **APLICAR** esta jurisprudência na advocacia.

---

## 📄 Jurisprudência

- **Título**: ${j.titulo}
${j.tribunal ? `- **Tribunal**: ${j.tribunal}` : ''}
${j.data ? `- **Data**: ${j.data}` : ''}

## 📝 Conteúdo

${j.textoTese || j.tese || ''}
${j.textoEmenta || j.ementa || ''}
${j.enunciado || j.texto || ''}

---

## 🎯 Sua Tarefa

Explique a aplicação prática com a seguinte estrutura:

### Estrutura Obrigatória:

## ⚖️ Aplicação Prática

### 📋 Situações de Uso

Em quais casos concretos essa jurisprudência pode ser invocada:

1. **Situação 1**: Descrição...

2. **Situação 2**: Descrição...

---

### 📝 Como Citar em Petições

> Modelo sugerido de citação:
> "Conforme entendimento firmado pelo [Tribunal], no julgamento [número/identificação]..."

---

### 🎯 Estratégias Processuais

- Estratégia 1
- Estratégia 2

---

### ⚠️ Pontos de Atenção

O que observar ao usar esta jurisprudência:

- Atenção 1
- Atenção 2

---

### 🔄 Possíveis Contrapontos

Argumentos que a parte contrária pode usar:

- Contraponto 1
- Contraponto 2

${INSTRUCOES_FORMATACAO}`,

  termos: (j) => `Você é um professor de direito especializado em terminologia jurídica. Sua tarefa é extrair e explicar TODOS os termos jurídicos presentes na jurisprudência abaixo.

---

## 📄 Jurisprudência

- **Título**: ${j.titulo}
${j.tribunal ? `- **Tribunal**: ${j.tribunal}` : ''}

## 📝 Conteúdo

${j.textoTese || j.tese || ''}
${j.textoEmenta || j.ementa || ''}
${j.enunciado || j.texto || ''}

---

## 🎯 Sua Tarefa

Extraia TODOS os termos jurídicos que aparecem ou são relevantes para esta jurisprudência. Seja abrangente - inclua mesmo termos que pareçam básicos.

### FORMATO OBRIGATÓRIO PARA CADA TERMO:

Use EXATAMENTE este formato para cada termo (é muito importante seguir à risca):

---

### 📚 [NOME DO TERMO]

**Definição**: Explicação clara e objetiva do termo em 2-3 linhas.

**No contexto desta decisão**: Como este termo se aplica especificamente a esta jurisprudência.

<exemplo>
[Exemplo prático e didático de aplicação deste termo, com uma situação hipotética ou real que ilustre o conceito. O exemplo deve ter 3-5 linhas e ser fácil de entender.]
</exemplo>

---

### INSTRUÇÕES IMPORTANTES:

1. **QUANTIDADE**: Liste pelo menos 8-15 termos jurídicos relevantes

2. **TIPOS DE TERMOS A INCLUIR**:
   - Termos processuais (agravo, habeas corpus, recurso, etc.)
   - Termos de direito material (dolo, culpa, responsabilidade, etc.)
   - Latinismos jurídicos (in dubio pro reo, etc.)
   - Termos técnicos específicos da área
   - Expressões jurídicas compostas

3. **FORMATO DO EXEMPLO**:
   - SEMPRE coloque o exemplo entre as tags <exemplo> e </exemplo>
   - O exemplo deve ser prático e ilustrativo
   - Use situações do cotidiano quando possível

4. **ORDEM**: Liste os termos em ordem de relevância para a jurisprudência

5. **ESPAÇAMENTO**: Sempre deixe uma linha em branco antes e depois de cada seção

### Exemplo de formatação correta:

---

### 📚 Habeas Corpus

**Definição**: Ação constitucional que protege o direito de ir e vir. É usado quando alguém está sofrendo ou ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder.

**No contexto desta decisão**: Neste caso, foi impetrado habeas corpus contra decisão que determinou prisão preventiva.

<exemplo>
João foi preso por engano após ser confundido com um criminoso. Seu advogado impetrou habeas corpus alegando que a prisão era ilegal por erro de identificação. O tribunal concedeu a ordem e João foi imediatamente solto.
</exemplo>

---

(continue com os demais termos...)`
};

// Títulos para cada modo
const TITULOS: Record<string, string> = {
  resumo: '📝 Resumo',
  descomplicar: '💡 Explicação Simplificada',
  'sem-juridiques': '🗣️ Sem Juridiquês',
  'pontos-chave': '📌 Pontos-chave',
  aplicacao: '⚖️ Aplicação Prática',
  termos: '📚 Termos Jurídicos'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jurisprudencia, modo } = await req.json() as JurisprudenciaPayload;

    if (!jurisprudencia || !modo) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros inválidos. Envie jurisprudencia e modo.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar modo
    if (!PROMPTS[modo]) {
      return new Response(
        JSON.stringify({ error: `Modo inválido. Use: ${Object.keys(PROMPTS).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const titulo = TITULOS[modo];
    const identificador = gerarIdentificador(jurisprudencia);

    console.log(`[explicar-jurisprudencia-opcoes] Modo: ${modo}, ID: ${identificador}`);

    // Verificar cache primeiro
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cacheData, error: cacheError } = await supabase
      .from('jurisprudencia_explicacoes_cache')
      .select('explicacao, titulo')
      .eq('jurisprudencia_identificador', identificador)
      .eq('modo', modo)
      .maybeSingle();

    if (cacheData && !cacheError) {
      console.log(`[explicar-jurisprudencia-opcoes] Cache HIT para ${identificador}/${modo}`);
      
      // Retornar do cache como SSE (simulando streaming para consistência)
      const encoder = new TextEncoder();
      const cacheContent = cacheData.explicacao;
      
      const stream = new ReadableStream({
        start(controller) {
          // Enviar conteúdo em chunks para simular streaming
          const chunkSize = 100;
          let position = 0;
          
          const sendChunk = () => {
            if (position < cacheContent.length) {
              const chunk = cacheContent.slice(position, position + chunkSize);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk, titulo: cacheData.titulo, fromCache: true })}\n\n`));
              position += chunkSize;
              setTimeout(sendChunk, 10); // Pequeno delay para simular streaming
            } else {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
              controller.close();
            }
          };
          
          sendChunk();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    console.log(`[explicar-jurisprudencia-opcoes] Cache MISS, gerando novo conteúdo`);

    // Sistema de fallback com 3 chaves API
    const API_KEYS = [
      Deno.env.get('GEMINI_KEY_1'),
      Deno.env.get('GEMINI_KEY_2'),
      Deno.env.get('GEMINI_KEY_3'),
    ].filter(Boolean) as string[];

    if (API_KEYS.length === 0) {
      console.error('Nenhuma chave API Gemini configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de API ausente' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = PROMPTS[modo](jurisprudencia);

    // Tentar cada chave API com fallback
    let response: Response | null = null;
    let lastError = '';
    
    for (let i = 0; i < API_KEYS.length; i++) {
      const apiKey = API_KEYS[i];
      console.log(`[explicar-jurisprudencia-opcoes] Tentando chave ${i + 1}/${API_KEYS.length}`);
      
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 3000,
              }
            })
          }
        );

        if (response.ok) {
          console.log(`[explicar-jurisprudencia-opcoes] Chave ${i + 1} funcionou!`);
          break;
        }
        
        const errorText = await response.text();
        lastError = errorText;
        console.log(`[explicar-jurisprudencia-opcoes] Chave ${i + 1} falhou: ${response.status}`);
        
        if (response.status === 429 || response.status === 403 || errorText.includes('quota') || errorText.includes('rate')) {
          continue;
        }
        
        continue;
      } catch (err) {
        console.error(`[explicar-jurisprudencia-opcoes] Erro com chave ${i + 1}:`, err);
        lastError = err instanceof Error ? err.message : String(err);
        continue;
      }
    }

    if (!response || !response.ok) {
      console.error('Todas as chaves falharam. Último erro:', lastError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar explicação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transformar resposta em SSE e coletar para cache
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let fullContent = '';

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr && jsonStr !== '[DONE]') {
                const data = JSON.parse(jsonStr);
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) {
                  fullContent += content;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: content, titulo })}\n\n`));
                }
              }
            } catch (e) {
              // Ignorar erros de parsing
            }
          }
        }
      },
      async flush(controller) {
        // Salvar no cache após conclusão
        if (fullContent.length > 100) {
          console.log(`[explicar-jurisprudencia-opcoes] Salvando no cache: ${fullContent.length} caracteres`);
          
          try {
            const { error: insertError } = await supabase
              .from('jurisprudencia_explicacoes_cache')
              .upsert({
                jurisprudencia_identificador: identificador,
                modo: modo,
                titulo: titulo,
                explicacao: fullContent,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'jurisprudencia_identificador,modo'
              });
            
            if (insertError) {
              console.error('[explicar-jurisprudencia-opcoes] Erro ao salvar cache:', insertError);
            } else {
              console.log('[explicar-jurisprudencia-opcoes] Cache salvo com sucesso!');
            }
          } catch (cacheErr) {
            console.error('[explicar-jurisprudencia-opcoes] Erro ao salvar cache:', cacheErr);
          }
        }
        
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      }
    });

    const stream = response.body?.pipeThrough(transformStream);

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Erro em explicar-jurisprudencia-opcoes:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
