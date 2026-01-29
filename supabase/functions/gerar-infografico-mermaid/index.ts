import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Prompts otimizados com exemplos CONCRETOS que funcionam 100%
const DIAGRAM_PROMPTS: Record<string, { instrucao: string; exemplo: string }> = {
  flowchart: {
    instrucao: `Crie um FLUXOGRAMA vertical (flowchart TD) mostrando o processo/procedimento.
REGRAS:
- Use apenas letras e números para IDs (A, B, C ou id1, id2)
- Textos curtos entre colchetes: A[Texto aqui]
- Decisões com chaves: B{Pergunta?}
- Setas simples: -->
- Rótulos nas setas: -->|Sim| ou -->|Nao|`,
    exemplo: `flowchart TD
    A[Inicio] --> B{Requisitos OK?}
    B -->|Sim| C[Processar]
    B -->|Nao| D[Devolver]
    C --> E[Analisar]
    E --> F{Aprovado?}
    F -->|Sim| G[Concluir]
    F -->|Nao| D
    D --> H[Fim]
    G --> H`
  },
  
  mindmap: {
    instrucao: `Crie um MAPA MENTAL simples e hierárquico.
REGRAS:
- Comece com: mindmap
- Raiz com: root((Tema Central))
- Indente com 2 ou 4 espaços para criar níveis
- Use apenas texto simples, sem caracteres especiais
- Máximo 3 níveis de profundidade`,
    exemplo: `mindmap
  root((Direito Civil))
    Pessoas
      Pessoa Fisica
      Pessoa Juridica
    Bens
      Moveis
      Imoveis
    Fatos Juridicos
      Atos Licitos
      Atos Ilicitos`
  },
  
  sequence: {
    instrucao: `Crie um DIAGRAMA DE SEQUÊNCIA mostrando a comunicação entre partes.
REGRAS:
- Comece com: sequenceDiagram
- Participantes: participant Nome
- Mensagens: A->>B: Texto
- Respostas: B-->>A: Texto
- Notas: Note over A: Texto`,
    exemplo: `sequenceDiagram
    participant A as Autor
    participant J as Juiz
    participant R as Reu
    A->>J: Peticao Inicial
    J->>R: Citacao
    R->>J: Contestacao
    J->>A: Vista
    A->>J: Replica
    J->>J: Analise
    J->>A: Sentenca
    J->>R: Sentenca`
  },
  
  timeline: {
    instrucao: `Crie uma LINHA DO TEMPO com eventos em ordem cronológica.
REGRAS:
- Comece com: timeline
- Título: title Titulo da Timeline
- Seções: section Nome
- Eventos: Data : Evento`,
    exemplo: `timeline
    title Fases do Processo
    section Postulatoria
      Dia 1 : Peticao Inicial
      Dia 15 : Citacao do Reu
      Dia 30 : Contestacao
    section Instrutoria
      Dia 45 : Audiencia
      Dia 60 : Pericia
    section Decisoria
      Dia 90 : Sentenca`
  },
  
  er: {
    instrucao: `Crie um DIAGRAMA DE ENTIDADE-RELACIONAMENTO simples.
REGRAS:
- Comece com: erDiagram
- Entidades em MAIUSCULAS
- Relacionamentos: ENTIDADE1 ||--o{ ENTIDADE2 : verbo
- Use: ||--|| (um para um), ||--o{ (um para muitos), }o--o{ (muitos para muitos)
- NAO inclua atributos dentro das entidades`,
    exemplo: `erDiagram
    PROCESSO ||--o{ PARTE : contem
    PARTE ||--|| ADVOGADO : representa
    PROCESSO ||--o{ DOCUMENTO : possui
    JUIZ ||--o{ PROCESSO : julga
    PROCESSO ||--o{ AUDIENCIA : agenda`
  },
  
  pie: {
    instrucao: `Crie um GRÁFICO DE PIZZA com distribuição de valores.
REGRAS:
- Comece com: pie showData
- Título: title "Titulo"
- Fatias: "Label" : valor
- Use valores numéricos inteiros
- Máximo 6 fatias`,
    exemplo: `pie showData
    title Tipos de Acoes
    "Civel" : 45
    "Criminal" : 25
    "Trabalhista" : 20
    "Tributaria" : 10`
  },
  
  class: {
    instrucao: `Crie um DIAGRAMA DE CLASSES mostrando estrutura e relacionamentos.
REGRAS:
- Comece com: classDiagram
- Classes simples: class NomeClasse
- Herança: ClasseFilha --|> ClassePai
- Composição: ClasseA *-- ClasseB
- Agregação: ClasseA o-- ClasseB`,
    exemplo: `classDiagram
    class Contrato
    class ContratoCompraVenda
    class ContratoLocacao
    class ContratoServico
    Contrato <|-- ContratoCompraVenda
    Contrato <|-- ContratoLocacao
    Contrato <|-- ContratoServico
    ContratoCompraVenda *-- Produto
    ContratoLocacao *-- Imovel`
  }
};

// Função de sanitização robusta
function sanitizarCodigoMermaid(codigo: string, tipo: string): string {
  let limpo = codigo
    // Remover blocos de código markdown
    .replace(/```mermaid\s*/gi, '')
    .replace(/```\s*/g, '')
    // Normalizar aspas
    .replace(/[\u201C\u201D""]/g, '"')
    .replace(/[\u2018\u2019'']/g, "'")
    // Remover BOM e caracteres invisíveis
    .replace(/^\uFEFF/, '')
    .replace(/\u200B/g, '')
    // Normalizar quebras de linha
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remover linhas vazias múltiplas
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Sanitização específica para ER diagrams
  if (tipo === 'er') {
    limpo = limpo
      // Remover tipos de dados (int, string, date, etc)
      .replace(/\s+(int|string|date|datetime|boolean|float|decimal|varchar|text)\s*/gi, ' ')
      // Remover PK, FK, UK
      .replace(/\s+(PK|FK|UK)\s*/g, ' ')
      // Remover atributos entre chaves
      .replace(/\{[^}]*\}/g, '')
      // Limpar espaços extras
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n');
  }

  // Sanitização para mindmap
  if (tipo === 'mindmap') {
    // Garantir indentação correta
    const linhas = limpo.split('\n');
    const linhasCorrigidas = linhas.map((linha, i) => {
      if (i === 0) return linha; // mindmap
      if (linha.includes('root')) return '  ' + linha.trim();
      // Contar espaços no início
      const espacos = linha.match(/^\s*/)?.[0].length || 0;
      const nivel = Math.floor(espacos / 2) + 1;
      return '  '.repeat(Math.min(nivel, 4)) + linha.trim();
    });
    limpo = linhasCorrigidas.join('\n');
  }

  // Garantir que começa com o tipo correto
  const primeiraLinha = limpo.split('\n')[0].trim().toLowerCase();
  const tiposValidos: Record<string, string[]> = {
    flowchart: ['flowchart', 'graph'],
    mindmap: ['mindmap'],
    sequence: ['sequencediagram'],
    timeline: ['timeline'],
    er: ['erdiagram'],
    pie: ['pie'],
    class: ['classdiagram']
  };

  const prefixosValidos = tiposValidos[tipo] || ['flowchart'];
  if (!prefixosValidos.some(p => primeiraLinha.startsWith(p))) {
    // Adicionar o prefixo correto
    const prefixoCorreto = tipo === 'flowchart' ? 'flowchart TD' :
                           tipo === 'mindmap' ? 'mindmap' :
                           tipo === 'sequence' ? 'sequenceDiagram' :
                           tipo === 'timeline' ? 'timeline' :
                           tipo === 'er' ? 'erDiagram' :
                           tipo === 'pie' ? 'pie showData' :
                           tipo === 'class' ? 'classDiagram' : 'flowchart TD';
    limpo = prefixoCorreto + '\n' + limpo;
  }

  return limpo;
}

async function chamarGemini(prompt: string, chavesDisponiveis: string[]): Promise<string> {
  for (const chave of chavesDisponiveis) {
    try {
      console.log(`🔑 Tentando chave Gemini: ${chave.substring(0, 10)}...`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chave}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1, // Mais determinístico
              maxOutputTokens: 1024, // Limitar para respostas mais concisas
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro na chave ${chave.substring(0, 10)}: ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        console.log('✅ Gemini respondeu com sucesso');
        return text;
      }
    } catch (error) {
      console.error(`❌ Erro com chave ${chave.substring(0, 10)}:`, error);
    }
  }
  
  throw new Error('Todas as chaves Gemini falharam');
}

function validarSintaxeMermaid(codigo: string): boolean {
  const tiposValidos = [
    'graph', 'flowchart', 'sequencediagram', 'classdiagram',
    'statediagram', 'erdiagram', 'journey', 'gantt', 'pie',
    'mindmap', 'timeline', 'quadrantchart', 'gitgraph'
  ];
  
  const primeiraLinha = codigo.split('\n')[0].trim().toLowerCase();
  return tiposValidos.some(tipo => primeiraLinha.startsWith(tipo));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texto, tipo = 'flowchart' } = await req.json();

    if (!texto || texto.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Texto muito curto. Forneça pelo menos 10 caracteres.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Coletar chaves Gemini disponíveis
    const chavesDisponiveis: string[] = [];
    const geminiKey1 = Deno.env.get('GEMINI_KEY_1');
    const geminiKey2 = Deno.env.get('GEMINI_KEY_2');
    const geminiKey3 = Deno.env.get('GEMINI_KEY_3');
    
    if (geminiKey1) chavesDisponiveis.push(geminiKey1);
    if (geminiKey2) chavesDisponiveis.push(geminiKey2);
    if (geminiKey3) chavesDisponiveis.push(geminiKey3);

    if (chavesDisponiveis.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma chave Gemini configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const diagramaConfig = DIAGRAM_PROMPTS[tipo] || DIAGRAM_PROMPTS.flowchart;

    const prompt = `Você é um especialista em criar diagramas Mermaid.js SIMPLES e FUNCIONAIS.

TAREFA: ${diagramaConfig.instrucao}

EXEMPLO DE CÓDIGO QUE FUNCIONA PERFEITAMENTE:
\`\`\`
${diagramaConfig.exemplo}
\`\`\`

REGRAS CRÍTICAS:
1. Retorne APENAS o código Mermaid, sem explicações
2. COPIE A ESTRUTURA do exemplo acima
3. Use textos em português, curtos (máx 5 palavras)
4. NÃO use caracteres especiais: ç, á, é, í, ó, ú, ã, õ, ê, ô, â
5. NÃO use emojis
6. IDs devem ser simples: A, B, C ou palavras sem acento
7. Mantenha o diagrama SIMPLES (máx 10-12 elementos)

TEXTO PARA TRANSFORMAR EM DIAGRAMA:
"""
${texto.substring(0, 1500)}
"""

Retorne APENAS o código Mermaid válido, começando com ${tipo === 'flowchart' ? 'flowchart TD' : tipo === 'mindmap' ? 'mindmap' : tipo === 'sequence' ? 'sequenceDiagram' : tipo === 'timeline' ? 'timeline' : tipo === 'er' ? 'erDiagram' : tipo === 'pie' ? 'pie showData' : 'classDiagram'}:`;

    console.log(`📊 Gerando infográfico tipo: ${tipo}`);
    console.log(`📝 Texto de entrada: ${texto.substring(0, 100)}...`);

    const resposta = await chamarGemini(prompt, chavesDisponiveis);
    console.log(`🔍 Resposta bruta do Gemini:`, resposta.substring(0, 300));
    
    const codigoMermaid = sanitizarCodigoMermaid(resposta, tipo);
    console.log(`🧹 Código sanitizado:`, codigoMermaid.substring(0, 300));

    if (!validarSintaxeMermaid(codigoMermaid)) {
      console.error('❌ Código Mermaid inválido após sanitização:', codigoMermaid);
      
      // Fallback: usar o exemplo do tipo selecionado
      console.log('🔄 Usando exemplo como fallback');
      return new Response(
        JSON.stringify({ 
          codigo: diagramaConfig.exemplo,
          tipo: tipo,
          fallback: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Código Mermaid válido gerado com sucesso');

    return new Response(
      JSON.stringify({ 
        codigo: codigoMermaid,
        tipo: tipo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('❌ Erro ao gerar infográfico:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao gerar infográfico';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
