import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de fallback com 3 chaves API
const API_KEYS = [
  Deno.env.get('GEMINI_KEY_1'),
  Deno.env.get('GEMINI_KEY_2'),
  Deno.env.get('GEMINI_KEY_3'),
].filter(Boolean) as string[];

interface Message {
  role: string;
  content: string;
}

interface RequestBody {
  messages: Message[];
  contexto: {
    tipo: string;
    nome: string;
    resumo?: string;
  };
}

async function chamarGeminiComFallback(contents: any[], config: any): Promise<any> {
  let lastError = '';
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];
    console.log(`Tentando chave ${i + 1}/${API_KEYS.length}`);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig: config })
        }
      );

      if (response.ok) {
        console.log(`Chave ${i + 1} funcionou!`);
        return await response.json();
      }
      
      const errorText = await response.text();
      lastError = errorText;
      console.log(`Chave ${i + 1} falhou: ${response.status}`);
      
      if (response.status === 429 || response.status === 403 || errorText.includes('quota') || errorText.includes('rate')) {
        continue;
      }
      continue;
    } catch (err) {
      console.error(`Erro com chave ${i + 1}:`, err);
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }
  }
  
  throw new Error(`Todas as chaves falharam. Último erro: ${lastError}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contexto }: RequestBody = await req.json();

    if (API_KEYS.length === 0) {
      throw new Error('Nenhuma chave API Gemini configurada');
    }

    console.log('📚 Chat Professora Jurista - Contexto:', contexto.nome);

    // System prompt TÉCNICO
    const systemPromptTecnico = `Você é uma professora de Direito especializada em história jurídica brasileira.

Contexto atual:
- Você está ajudando o aluno a entender sobre: **${contexto.nome}**
- Tipo: ${contexto.tipo}
${contexto.resumo ? `- Resumo: ${contexto.resumo}` : ''}

Suas características:
- Didática e paciente
- Usa linguagem técnica apropriada
- Relaciona conceitos históricos com a prática jurídica atual
- Fornece exemplos concretos e referências doutrinárias
- Incentiva o aprendizado crítico

Como responder:
1. Mantenha o foco no jurista em questão (${contexto.nome})
2. Seja concisa, mas completa (máximo 350 palavras por resposta)
3. Use terminologia jurídica precisa
4. Quando apropriado, mencione como o trabalho deste jurista influencia o direito atual
5. Se o aluno perguntar sobre algo não relacionado ao jurista, redirecione gentilmente
6. Forneça respostas em formato markdown para melhor legibilidade

📐 FORMATAÇÃO OBRIGATÓRIA:
✅ Use SEMPRE duas quebras de linha entre parágrafos (\\n\\n)
✅ Use SEMPRE duas quebras antes e depois de títulos
✅ Evite parágrafos muito longos (máximo 4-5 linhas)
✅ Mantenha espaçamento visual entre seções`;

    // System prompt DESCOMPLICADO
    const systemPromptDescomplicado = `Você é a melhor amiga do estudante explicando sobre juristas brasileiros de forma MEGA DESCOMPLICADA.

Contexto atual:
- Você está explicando sobre: **${contexto.nome}**
- Tipo: ${contexto.tipo}
${contexto.resumo ? `- Resumo: ${contexto.resumo}` : ''}

🎯 TOM OBRIGATÓRIO - ÁUDIO DE WHATSAPP:
- Fale como se estivesse mandando áudio no WhatsApp para amiga de 16 anos
- Use MUITAS gírias: "mano", "cara", "tipo", "sacou?", "massa", "olha só", "na moral"
- Interjeições: "nossa", "caramba", "sério", "viu?", "olha que massa"
- Começa frases com: "olha", "cara", "mano", "vou te contar"
- Analogias MODERNAS: TikTok, Instagram, Netflix, séries, jogos
- TODO termo técnico traduzido na hora: "X (que na real significa Y)"
- Conta como história/fofoca interessante sobre o jurista
- Tom empolgado e animado, tipo contando coisa legal

❌ PROIBIDO USAR:
- Juridiquês ou formalidade excessiva
- "Importante destacar", "cumpre salientar", "destarte"
- Tom de livro ou enciclopédia
- Respostas curtas (mínimo 250 palavras)

✅ COMO RESPONDER:
1. Começa com: "Cara/Mano, agora vou te explicar isso de um jeito que você vai sacar na hora..."
2. Usa gírias e interjeições em TODOS os parágrafos
3. Conta a história do jurista de forma empolgante
4. Relaciona com hoje usando analogias modernas
5. Dá exemplos concretos e práticos
6. Máximo 350 palavras (mas desenvolve bem!)

📐 FORMATAÇÃO:
✅ Duas quebras entre parágrafos (\\n\\n)
✅ Parágrafos curtos (3-4 linhas)
✅ Emojis pontuais: 📚, ⚖️, 💡, ✨

IMPORTANTE: Esta é uma explicação ALTERNATIVA mais simples do mesmo conteúdo que já foi explicado tecnicamente. Reformule tudo de forma descontraída!`;

    // Preparar mensagens para a API Gemini
    const contentsTecnico = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Adicionar system prompt técnico
    contentsTecnico.unshift({
      role: 'model',
      parts: [{ text: systemPromptTecnico }]
    });

    // 1. Gerar resposta TÉCNICA primeiro
    console.log('🔬 Gerando resposta técnica...');
    const dataTecnico = await chamarGeminiComFallback(contentsTecnico, {
      temperature: 0.6,
      maxOutputTokens: 1500
    });

    const respostaTecnica = dataTecnico.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!respostaTecnica) {
      throw new Error('Resposta técnica vazia da API');
    }

    console.log('✅ Resposta técnica gerada');

    // 2. Gerar resposta DESCOMPLICADA
    console.log('🎨 Gerando resposta descomplicada...');
    
    // Incluir a resposta técnica como contexto para a versão descomplicada
    const contentsDescomplicado = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    contentsDescomplicado.unshift({
      role: 'model',
      parts: [{ text: systemPromptDescomplicado }]
    });

    // Adicionar contexto da resposta técnica para reformular
    contentsDescomplicado.push({
      role: 'user',
      parts: [{ text: `Reformule esta explicação técnica de forma super descomplicada e divertida:\n\n${respostaTecnica}` }]
    });

    const dataDescomplicado = await chamarGeminiComFallback(contentsDescomplicado, {
      temperature: 0.8,
      maxOutputTokens: 1500
    });

    const respostaDescomplicada = dataDescomplicado.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('✅ Resposta descomplicada gerada');

    // Combinar as duas respostas
    const respostaCompleta = `## 📖 Resposta Técnica

${respostaTecnica}

---

## 🎯 Agora, Descomplicando!

${respostaDescomplicada || 'Não foi possível gerar a versão descomplicada.'}`;

    return new Response(
      JSON.stringify({ 
        resposta: respostaCompleta,
        respostaTecnica,
        respostaDescomplicada
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Erro no chat professora jurista:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar chat';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        resposta: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
