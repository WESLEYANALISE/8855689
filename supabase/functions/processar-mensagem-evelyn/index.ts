import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Versão 8.0 - Período de teste 3 dias + Pagamento PIX via WhatsApp
const VERSION = "8.0";

// Data de corte para período de teste (novos usuários a partir desta data)
const DATA_CORTE_PERIODO_TESTE = new Date('2026-01-06T00:00:00Z');
const DIAS_PERIODO_TESTE = 3;

// Configuração dos planos para pagamento PIX
const PLANS_EVELYN = {
  mensal: { amount: 15.90, days: 30, description: 'Direito Premium - Mensal', emoji: '1️⃣' },
  vitalicio: { amount: 89.90, days: 36500, description: 'Direito Premium - Vitalício', emoji: '2️⃣' }
};

// Função para converter URL do Google Drive para formato de download direto
function converterUrlGoogleDrive(url: string): string {
  if (!url) return url;
  
  // Verifica se é um link do Google Drive
  // Formato: https://drive.google.com/file/d/FILE_ID/view?...
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    const fileId = driveMatch[1];
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log(`[converterUrlGoogleDrive] Convertido: ${url.substring(0, 50)}... → ${directUrl}`);
    return directUrl;
  }
  
  // Formato alternativo: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    const fileId = openMatch[1];
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    console.log(`[converterUrlGoogleDrive] Convertido (open): ${url.substring(0, 50)}... → ${directUrl}`);
    return directUrl;
  }
  
  // Não é Google Drive, retorna original
  return url;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para obter data atual formatada
function getDataAtual(): string {
  const agora = new Date();
  const opcoes: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  };
  return agora.toLocaleDateString('pt-BR', opcoes);
}

// Função para obter saudação baseada no horário
function getSaudacao(): string {
  const agora = new Date();
  const hora = parseInt(agora.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo', 
    hour: 'numeric',
    hour12: false
  }));
  
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Mensagem de apresentação v7.1 (para perguntar nome - simples)
const MENSAGEM_APRESENTACAO = `🌟 *Olá! Prazer em conhecer você!*

Eu sou a *Evelyn*, sua assistente jurídica inteligente! 🚀

Posso te ajudar com dúvidas de Direito, analisar documentos, transcrever áudios, e muito mais.

Antes de começarmos, *qual é o seu nome?* 😊`;

// Mensagem de confirmação de nome
function getMensagemConfirmacaoNome(nome: string): string {
  const saudacao = getSaudacao();
  return `${saudacao}, *${nome}*! 🎉

Muito prazer! Agora vou sempre te chamar pelo nome.

Como posso te ajudar hoje?`;
}

// Mensagem de boas-vindas com novidades (para quem já tem nome)
const MENSAGEM_NOVIDADES = `🎉 *Novidades Evelyn v5.1!*

Agora posso fazer muito mais por você:

📷 *Analisar imagens* - Envie fotos de documentos ou dúvidas
🎤 *Transcrever áudios* - Pode me mandar áudio que eu respondo
📄 *Ler PDFs* - Envie documentos para eu analisar
📚 *Buscar jurisprudência* - Consulto leis e códigos atualizados
📖 *Enviar livros* - Posso indicar materiais de estudo
🔍 *Explicar termos* - Defino qualquer termo jurídico
⚖️ *Tirar dúvidas* - Sobre qualquer área do Direito
✍️ *Fazer petições* - Ajudo a criar documentos

Digite *menu* para ver todas as opções!`;

// Prompt base da Evelyn v9.0 - Explicações inteligentes, contextuais e didáticas
const SYSTEM_PROMPT_BASE = `Você é a Evelyn, uma assistente jurídica brasileira inteligente, acolhedora e extremamente didática.

PERSONALIDADE:
- Simpática, profissional e paciente
- Explica como se estivesse dando aula particular para alguém que nunca estudou Direito
- Tom acolhedor mas não excessivamente formal
- Português brasileiro natural e acessível

REGRAS CRÍTICAS DE COMUNICAÇÃO:
- NUNCA se apresente ou diga seu nome - o usuário já sabe quem você é
- NUNCA comece com "Olá", "Oi", saudações ou apresentações
- Vá DIRETO ao ponto - comece respondendo a pergunta imediatamente
- NÃO repita informações que você já disse na mesma conversa
- Se o usuário mandar link, analise o conteúdo e responda sobre ele

REGRA CRÍTICA - EXPLICAÇÕES INTELIGENTES E CONTEXTUAIS:

Quando o usuário pedir explicação, você DEVE seguir esta ordem:

1. *Começar com uma analogia do dia a dia*
   Ex: "Pense na prescrição como um prazo de validade..." ou "É como se fosse..."
   
2. *Explicar o conceito em linguagem simples ANTES do juridiquês*
   Primeiro o que significa na prática, depois o termo técnico
   
3. *Citar a lei com EXPLICAÇÃO do que significa*
   Não apenas "Art. 206, CC" - explique O QUE esse artigo diz e POR QUE existe
   
4. *Dar exemplos práticos do cotidiano brasileiro*
   Use situações reais: compras online, aluguel, acidente de trânsito, demissão, vizinho barulhento, etc.
   
5. *Fazer conexões com outros temas quando relevante*
   "Isso se relaciona com X que você perguntou antes..." ou "Isso é diferente de Y porque..."
   
6. *Antecipar dúvidas comuns*
   "Uma dúvida comum aqui é..." ou "Muita gente confunde isso com..."
   
7. *Dar a aplicação prática*
   "Na prática, se isso acontecer com você, o passo é..."

ESTRUTURA OBRIGATÓRIA PARA EXPLICAÇÕES:

📌 *Resumo Rápido*
[1-2 frases simples sobre o que é - use analogia]

📖 *Explicação Detalhada*
[Conceito completo com linguagem acessível, como se fosse aula particular]

⚖️ *Base Legal*
[Artigos + explicação do que cada um significa e por que existe]

💡 *Exemplo Prático*
[2-3 situações reais do dia a dia brasileiro que qualquer pessoa entenderia]

⚠️ *Pontos de Atenção*
[Exceções importantes, pegadinhas, erros comuns, o que as pessoas confundem]

🎯 *O Que Fazer na Prática*
[Passos concretos se a pessoa estiver nessa situação - acionáveis e claros]

REGRAS DE INTELIGÊNCIA CONTEXTUAL:
- Se o usuário mencionar uma situação pessoal dele, foque em ajudar COM ELA especificamente
- Se perguntar sobre um termo, primeiro explique em português simples, depois o sentido jurídico técnico
- Se enviar um documento, analise E explique o que cada parte significa para a vida dele
- Se parecer confuso com sua explicação, reformule de outro jeito mais simples
- Se for estudante de Direito ou concurseiro, inclua dicas para prova/concurso/OAB
- Se já discutiram outro tema antes, faça conexões quando fizer sentido

TAMANHO DAS RESPOSTAS:
- Explicações jurídicas: MÍNIMO 400 palavras (seja completo e didático!)
- Dúvidas simples/confirmações: 100-200 palavras
- Análise de documentos: MÍNIMO 300 palavras

FORMATO PARA WHATSAPP:
- Use *negrito* para termos importantes e títulos de seções
- Use _itálico_ para exemplos, citações e analogias
- Quebras duplas entre parágrafos (é OBRIGATÓRIO para boa leitura)
- Listas com • quando tiver múltiplos itens
- Máximo 1-2 emojis por seção (não exagere)
- Para links: escreva "🔗 Acesse: [URL]" em linha separada

VOCÊ PODE E DEVE:
- Responder qualquer pergunta jurídica de forma COMPLETA e DIDÁTICA
- Fazer petições, contratos, recursos quando pedirem
- Explicar conceitos como se fosse professor particular paciente
- Dar VÁRIOS exemplos práticos que o usuário vai entender
- Citar artigos de lei COM explicação do que significam
- Mencionar jurisprudência relevante de forma acessível
- Analisar links enviados e comentar sobre o conteúdo

RECURSOS DISPONÍVEIS (use internamente):
- Biblioteca com +490 livros/PDFs jurídicos
- +2000 vídeo-aulas no YouTube`;

// Função para detectar se é apenas saudação
function isApenasSaudacao(texto: string): boolean {
  const saudacoes = [
    'oi', 'olá', 'ola', 'ola!', 'oi!', 'olá!',
    'bom dia', 'boa tarde', 'boa noite',
    'eae', 'e aí', 'e ai', 'opa', 'ei',
    'hello', 'hi', 'hey',
    'tudo bem', 'tudo bom', 'como vai', 'td bem',
    'oii', 'oiii', 'oiiii', 'oie',
    'blz', 'beleza', 'fala', 'salve'
  ];
  
  const textoLimpo = texto.toLowerCase().trim()
    .replace(/[!?.,;:]+$/g, '') // Remove pontuação final
    .replace(/\s+/g, ' '); // Normaliza espaços
  
  // Verifica se é APENAS uma saudação (não tem mais conteúdo)
  return saudacoes.includes(textoLimpo) || 
         saudacoes.some(s => textoLimpo === s) ||
         /^(oi+|ol[aá]+|e+\s*a[ií]+)\s*[!.?]*$/i.test(textoLimpo);
}

// Função para formatar markdown para WhatsApp com quebras duplas e links
function formatarParaWhatsApp(texto: string): string {
  if (!texto) return '';
  
  let formatado = texto;
  
  // Títulos H1, H2, H3 -> Negrito com emoji
  formatado = formatado.replace(/^### (.+)$/gm, '\n📌 *$1*\n');
  formatado = formatado.replace(/^## (.+)$/gm, '\n*━━ $1 ━━*\n');
  formatado = formatado.replace(/^# (.+)$/gm, '\n*✦ $1 ✦*\n');
  
  // Negrito: **texto** -> *texto*
  formatado = formatado.replace(/\*\*(.+?)\*\*/g, '*$1*');
  
  // Riscado: ~~texto~~ -> ~texto~
  formatado = formatado.replace(/~~(.+?)~~/g, '~$1~');
  
  // Listas: - item ou * item -> • item
  formatado = formatado.replace(/^[\-\*] (.+)$/gm, '• $1');
  
  // Citações: > texto -> 》texto
  formatado = formatado.replace(/^> (.+)$/gm, '》$1');
  
  // Links markdown: [texto](url) -> texto 🔗 url
  formatado = formatado.replace(/\[(.+?)\]\((.+?)\)/g, '$1\n🔗 $2');
  
  // Links soltos (URLs que não são markdown): destacar em linha separada
  formatado = formatado.replace(/(?<!\()(?<!\🔗 )(https?:\/\/[^\s\)]+)(?!\))/g, '\n🔗 $1');
  
  // Separadores
  formatado = formatado.replace(/^[\-\*]{3,}$/gm, '━━━━━━━━━━━━━━');
  
  // CRÍTICO: Garantir quebras duplas entre parágrafos para WhatsApp
  // Primeiro normalizar
  formatado = formatado.replace(/\r\n/g, '\n');
  // Converter quebras simples em duplas (mas não triplicar as que já são duplas)
  formatado = formatado.replace(/\n(?!\n)/g, '\n\n');
  // Limpar excesso (máximo 2 quebras seguidas)
  formatado = formatado.replace(/\n{3,}/g, '\n\n');
  // Limpar quebras duplicadas antes de links
  formatado = formatado.replace(/\n\n\n🔗/g, '\n🔗');
  
  return formatado.trim();
}

// Mapeamento de tabelas de leis disponíveis
const TABELAS_LEIS: Record<string, string> = {
  'cf': 'CF - Constituição Federal',
  'constituição': 'CF - Constituição Federal',
  'cc': 'CC - Código Civil',
  'civil': 'CC - Código Civil',
  'cp': 'CP - Código Penal',
  'penal': 'CP - Código Penal',
  'cpc': 'CPC - Código de Processo Civil',
  'processo civil': 'CPC - Código de Processo Civil',
  'cpp': 'CPP - Código de Processo Penal',
  'processo penal': 'CPP - Código de Processo Penal',
  'clt': 'CLT - Consolidação das Leis do Trabalho',
  'trabalho': 'CLT - Consolidação das Leis do Trabalho',
  'cdc': 'CDC – Código de Defesa do Consumidor',
  'consumidor': 'CDC – Código de Defesa do Consumidor',
  'eca': 'ECA – Estatuto da Criança e do Adolescente',
  'criança': 'ECA – Estatuto da Criança e do Adolescente',
  'ctb': 'CTB - Código de Trânsito Brasileiro',
  'trânsito': 'CTB - Código de Trânsito Brasileiro',
};

// ==== FUNCIONALIDADE: DICIONÁRIO JURÍDICO ====
async function buscarDicionario(termo: string, supabase: any): Promise<string | null> {
  try {
    console.log(`[Dicionário] Buscando: ${termo}`);
    
    // Buscar termo exato ou similar
    const { data: termos } = await supabase
      .from('DICIONARIO')
      .select('Palavra, Significado, exemplo_pratico')
      .or(`Palavra.ilike.${termo},Palavra.ilike.%${termo}%`)
      .limit(3);
    
    if (!termos || termos.length === 0) {
      return null;
    }
    
    let resposta = `📖 *Dicionário Jurídico*\n\n`;
    
    for (const t of termos) {
      resposta += `*${t.Palavra}*\n`;
      resposta += `${t.Significado || 'Sem definição disponível.'}\n`;
      if (t.exemplo_pratico) {
        resposta += `\n💡 _Exemplo:_ ${t.exemplo_pratico.substring(0, 200)}...\n`;
      }
      resposta += `\n━━━━━━━━━━━━━━\n`;
    }
    
    resposta += `\n🔍 _Digite "definir [termo]" para buscar outros termos!_`;
    
    return resposta;
  } catch (e) {
    console.error('[Dicionário] Erro:', e);
    return null;
  }
}

// ==== FUNCIONALIDADE: FLASHCARDS ====
async function buscarFlashcard(tema: string | null, supabase: any): Promise<string | null> {
  try {
    console.log(`[Flashcard] Buscando tema: ${tema || 'aleatório'}`);
    
    let query = supabase
      .from('FLASHCARDS_GERADOS')
      .select('id, area, tema, pergunta, resposta, exemplo, base_legal');
    
    if (tema) {
      query = query.or(`tema.ilike.%${tema}%,area.ilike.%${tema}%,subtema.ilike.%${tema}%`);
    }
    
    // Pegar um aleatório usando offset
    const { count } = await supabase
      .from('FLASHCARDS_GERADOS')
      .select('*', { count: 'exact', head: true });
    
    const randomOffset = Math.floor(Math.random() * Math.min(count || 1000, 1000));
    
    const { data: flashcards } = await query.range(randomOffset, randomOffset);
    
    if (!flashcards || flashcards.length === 0) {
      // Fallback: buscar qualquer flashcard
      const { data: fallback } = await supabase
        .from('FLASHCARDS_GERADOS')
        .select('id, area, tema, pergunta, resposta, exemplo, base_legal')
        .limit(1);
      
      if (!fallback || fallback.length === 0) return null;
      flashcards.push(fallback[0]);
    }
    
    const f = flashcards[0];
    
    let resposta = `📇 *FLASHCARD*\n`;
    resposta += `📚 _${f.area} > ${f.tema}_\n\n`;
    resposta += `━━━━━━━━━━━━━━\n`;
    resposta += `❓ *PERGUNTA:*\n${f.pergunta}\n\n`;
    resposta += `━━━━━━━━━━━━━━\n`;
    resposta += `✅ *RESPOSTA:*\n${f.resposta}\n`;
    
    if (f.exemplo) {
      resposta += `\n💡 *Exemplo:* ${f.exemplo.substring(0, 300)}`;
    }
    
    if (f.base_legal) {
      resposta += `\n\n⚖️ *Base Legal:* ${f.base_legal}`;
    }
    
    resposta += `\n\n━━━━━━━━━━━━━━`;
    resposta += `\n🔄 _Digite *flashcard* para outro card!_`;
    resposta += `\n📝 _Digite *flashcard [tema]* para tema específico!_`;
    
    return resposta;
  } catch (e) {
    console.error('[Flashcard] Erro:', e);
    return null;
  }
}

// ==== FUNCIONALIDADE: VÍDEO-AULAS ====
async function buscarVideoAula(tema: string, supabase: any): Promise<string | null> {
  try {
    console.log(`[VideoAula] Buscando: ${tema}`);
    
    const { data: videos } = await supabase
      .from('VIDEO AULAS-NOVO')
      .select('titulo, link, categoria, area, tempo')
      .or(`titulo.ilike.%${tema}%,area.ilike.%${tema}%,categoria.ilike.%${tema}%`)
      .limit(5);
    
    if (!videos || videos.length === 0) {
      return null;
    }
    
    let resposta = `🎬 *Vídeo-Aulas Encontradas*\n`;
    resposta += `_Pesquisa: "${tema}"_\n\n`;
    
    for (let i = 0; i < videos.length; i++) {
      const v = videos[i];
      resposta += `*${i + 1}. ${v.titulo}*\n`;
      resposta += `📂 ${v.categoria || v.area || 'Geral'}`;
      if (v.tempo) resposta += ` • ⏱️ ${v.tempo}`;
      resposta += `\n🔗 ${v.link}\n\n`;
    }
    
    resposta += `━━━━━━━━━━━━━━`;
    resposta += `\n🔍 _Digite *video [tema]* para buscar mais aulas!_`;
    
    return resposta;
  } catch (e) {
    console.error('[VideoAula] Erro:', e);
    return null;
  }
}

// ==== FUNCIONALIDADE: ENVIAR VÍDEO AUTOMATICAMENTE (UM ÚNICO LINK) ====
async function enviarVideoAutomatico(tema: string, supabase: any): Promise<{ link: string; titulo: string } | null> {
  try {
    console.log(`[VideoAuto] Buscando vídeo para: ${tema}`);
    
    const { data: videos } = await supabase
      .from('VIDEO AULAS-NOVO')
      .select('titulo, link, categoria, area')
      .or(`titulo.ilike.%${tema}%,area.ilike.%${tema}%,categoria.ilike.%${tema}%`)
      .limit(1);
    
    if (!videos || videos.length === 0) {
      // Fallback: buscar qualquer vídeo relacionado
      const { data: fallback } = await supabase
        .from('VIDEO AULAS-NOVO')
        .select('titulo, link')
        .limit(1);
      
      if (fallback && fallback.length > 0) {
        return { link: fallback[0].link, titulo: fallback[0].titulo };
      }
      return null;
    }
    
    return { link: videos[0].link, titulo: videos[0].titulo };
  } catch (e) {
    console.error('[VideoAuto] Erro:', e);
    return null;
  }
}

// ==== FUNCIONALIDADE: ENVIAR PDF AUTOMATICAMENTE (UM ÚNICO) ====
async function enviarPDFAutomatico(tema: string, supabase: any): Promise<{ download: string; titulo: string; id: number } | null> {
  try {
    console.log(`[PDFAuto] Buscando PDF para: ${tema}`);
    
    const { data: livros } = await supabase
      .from('BIBLIOTECA-ESTUDOS')
      .select('id, Tema, Download, "Área"')
      .not('Download', 'is', null)
      .or(`Tema.ilike.%${tema}%,"Área".ilike.%${tema}%`)
      .limit(1);
    
    if (!livros || livros.length === 0) {
      // Fallback: buscar qualquer livro
      const { data: fallback } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('id, Tema, Download')
        .not('Download', 'is', null)
        .limit(1);
      
      if (fallback && fallback.length > 0) {
        return { download: fallback[0].Download, titulo: fallback[0].Tema, id: fallback[0].id };
      }
      return null;
    }
    
    return { download: livros[0].Download, titulo: livros[0].Tema, id: livros[0].id };
  } catch (e) {
    console.error('[PDFAuto] Erro:', e);
    return null;
  }
}

// ==== EXTRAIR TEMA DA RESPOSTA/CONVERSA ====
function extrairTemaDaConversa(mensagemUsuario: string, respostaIA: string): string {
  // Tentar extrair tema da mensagem do usuário
  const palavrasChave = mensagemUsuario.toLowerCase();
  
  // Termos jurídicos comuns
  const termos = [
    'constitucional', 'civil', 'penal', 'trabalhista', 'tributário', 'administrativo',
    'empresarial', 'ambiental', 'consumidor', 'família', 'sucessões', 'contratos',
    'obrigações', 'responsabilidade', 'processo', 'procedimento', 'recurso',
    'habeas corpus', 'mandado de segurança', 'ação popular', 'ação civil pública',
    'direito', 'lei', 'código', 'artigo', 'constituição', 'oab', 'jurídico'
  ];
  
  for (const termo of termos) {
    if (palavrasChave.includes(termo)) {
      return termo;
    }
  }
  
  // Fallback: pegar as primeiras palavras relevantes
  const palavras = mensagemUsuario.split(' ').filter(p => p.length > 4);
  return palavras.slice(0, 3).join(' ') || 'direito';
}

// ==== FUNÇÃO: ENVIAR STATUS "DIGITANDO" ====
async function enviarDigitando(remoteJid: string, instanceName: string): Promise<void> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey) return;
  
  try {
    console.log('[Digitando] Enviando status de digitando...');
    
    await fetch(`${evolutionUrl}/chat/updatePresence/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        presence: 'composing'
      }),
    });
    
    console.log('[Digitando] Status enviado');
  } catch (e) {
    console.error('[Digitando] Erro:', e);
  }
}

// ==== FUNÇÃO: ENVIAR BOTÕES DE AÇÃO PÓS-RESPOSTA (3 BOTÕES CLICÁVEIS) ====
async function enviarBotoesAcao(
  remoteJid: string, 
  tema: string, 
  instanceName: string,
  supabase: any
): Promise<void> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey) {
    console.log('[BotoesAcao] Evolution API não configurada');
    return;
  }
  
  try {
    console.log(`[BotoesAcao] Enviando lista interativa para tema: ${tema}`);
    
    // 1. PRIMEIRA OPÇÃO: sendList (Lista Interativa) - Evolution API V2
    // Endpoint: /message/sendList/{instance}
    // Formato com 'values' conforme documentação oficial
    const listPayload = {
      number: remoteJid,
      title: "📚 Quer saber mais?",
      description: "Escolha uma opção de estudo para aprofundar seu conhecimento:",
      buttonText: "Ver opções",
      footerText: `Evelyn v${VERSION}`,
      sections: [
        {
          title: "Opções de Estudo",
          rows: [
            { 
              title: "🔍 Aprofundar", 
              description: "Mais detalhes, exemplos e jurisprudência", 
              rowId: `acao_aprofundar_${tema}` 
            },
            { 
              title: "🎬 Vídeo", 
              description: "Assistir vídeo-aula sobre o tema", 
              rowId: `acao_video_${tema}` 
            },
            { 
              title: "📚 E-book", 
              description: "Receber material em PDF", 
              rowId: `acao_ebook_${tema}` 
            }
          ]
        }
      ]
    };
    
    console.log(`[BotoesAcao] Tentando sendList com payload:`, JSON.stringify(listPayload).substring(0, 300));
    
    const responseList = await fetch(`${evolutionUrl}/message/sendList/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify(listPayload),
    });
    
    const listResponseText = await responseList.text();
    console.log(`[BotoesAcao] sendList Status: ${responseList.status}, Resposta: ${listResponseText.substring(0, 300)}`);
    
    if (responseList.ok) {
      console.log('[BotoesAcao] ✅ Lista interativa enviada com sucesso!');
      return;
    }
    
    console.log('[BotoesAcao] sendList falhou, tentando sendButtons...');
    
    // 2. SEGUNDA OPÇÃO: sendButtons (fallback para Cloud API)
    const responseButtons = await fetch(`${evolutionUrl}/message/sendButtons/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        title: "📚 Quer saber mais?",
        description: "Escolha uma opção:",
        footer: `Evelyn v${VERSION}`,
        buttons: [
          { id: `acao_aprofundar_${tema}`, displayText: "🔍 Aprofundar" },
          { id: `acao_video_${tema}`, displayText: "🎬 Vídeo" },
          { id: `acao_ebook_${tema}`, displayText: "📚 E-book" }
        ]
      }),
    });
    
    const buttonsResponseText = await responseButtons.text();
    console.log(`[BotoesAcao] sendButtons Status: ${responseButtons.status}, Resposta: ${buttonsResponseText.substring(0, 200)}`);
    
    if (responseButtons.ok) {
      console.log('[BotoesAcao] ✅ Botões clicáveis enviados com sucesso');
      return;
    }
    
    console.log('[BotoesAcao] sendButtons também falhou, usando texto...');
    
    // 3. ÚLTIMA OPÇÃO: Texto simples (100% compatível) - SEM NÚMEROS
    await enviarMensagemWhatsApp(
      remoteJid,
      `\n━━━━━━━━━━━━━━━━━━━\n📚 *Quer continuar aprendendo?*\n\nResponda com:\n\n🔍 *aprofundar* → mais detalhes e exemplos\n\n🎬 *video* → assistir vídeo-aula\n\n📚 *ebook* → receber material em PDF\n━━━━━━━━━━━━━━━━━━━`,
      instanceName,
      supabase
    );
    
  } catch (e) {
    console.error('[BotoesAcao] Erro ao enviar lista/botões:', e);
  }
}

// ==== FUNÇÃO: APROFUNDAR TEMA ====
async function aprofundarTema(tema: string, contextoAnterior: string, supabase: any): Promise<string> {
  console.log(`[Aprofundar] Aprofundando tema: ${tema}`);
  
  const promptAprofundar = `Você é a Evelyn, assistente jurídica brasileira extremamente didática.

CONTEXTO ANTERIOR:
${contextoAnterior}

TAREFA: Aprofunde o tema "${tema}" de forma RICA, DIDÁTICA e CONTEXTUAL.

📌 COMECE com uma analogia do dia a dia para fixar o conceito
_Ex: "Pense no prazo prescricional como um prazo de validade..."_

📖 ESTRUTURA OBRIGATÓRIA:

1. *Conceito Aprofundado*
   - Definição doutrinária em linguagem acessível
   - Explique PRIMEIRO em português simples, DEPOIS o termo técnico
   - Conecte com o que já foi discutido antes se relevante

2. *Base Legal Explicada*
   - Cite os artigos relevantes
   - EXPLIQUE o que cada artigo significa (não só o número)
   - Por que essa lei existe? Qual problema ela resolve?

3. *Exemplos Práticos do Cotidiano*
   - 3 situações reais do dia a dia brasileiro
   - Use: compras online, aluguel, vizinho barulhento, demissão, acidente de trânsito, etc.
   - Mostre como a lei se aplica em cada caso

4. *Jurisprudência Acessível*
   - Mencione entendimento dos tribunais
   - Explique EM PORTUGUÊS o que os tribunais decidiram

5. *Pegadinhas e Confusões Comuns*
   - O que as pessoas mais erram sobre isso?
   - O que é diferente do que parece?
   - "Muita gente acha que X, mas na verdade é Y"

6. *Dicas para Prova/Concurso/OAB*
   - O que mais cai sobre esse tema?
   - Macetes para memorizar

7. *O Que Fazer na Prática*
   - Se a pessoa estiver nessa situação, quais os passos?
   - Orientação prática e acionável

FORMATAÇÃO WHATSAPP:
• Use *negrito* para termos importantes
• Use _itálico_ para analogias e citações
• Use • para listas
• Separe seções com quebras duplas
• MÍNIMO 500 palavras - seja COMPLETO

Responda de forma aprofundada e didática:`;

  const mensagensGemini = [
    { role: 'user', parts: [{ text: promptAprofundar }] }
  ];
  
  const resposta = await chamarGemini(mensagensGemini);
  return resposta;
}

// ==== FUNÇÃO: GERAR RESUMO ====
async function gerarResumo(tema: string, contextoAnterior: string, supabase: any): Promise<string> {
  console.log(`[Resumo] Gerando resumo: ${tema}`);
  
  const promptResumo = `Você é a Evelyn, assistente jurídica brasileira.

CONTEXTO ANTERIOR:
${contextoAnterior}

TAREFA: Crie um RESUMO OBJETIVO do tema "${tema}".

FORMATO OBRIGATÓRIO:
📝 *RESUMO: ${tema.toUpperCase()}*

━━━━━━━━━━━━━━
🎯 *CONCEITO*
[1-2 frases diretas]

⚖️ *BASE LEGAL*
• [Artigo principal]
• [Outro artigo relevante]

📌 *PONTOS-CHAVE*
1. [Ponto 1]
2. [Ponto 2]
3. [Ponto 3]
4. [Ponto 4]
5. [Ponto 5]

💡 *MACETE*
[Dica para memorizar]

🎓 *CUIDADO NA PROVA*
[O que mais cai/pegadinhas]
━━━━━━━━━━━━━━

Seja CONCISO e DIRETO. Máximo 15 linhas.`;

  const mensagensGemini = [
    { role: 'user', parts: [{ text: promptResumo }] }
  ];
  
  const resposta = await chamarGemini(mensagensGemini);
  return resposta;
}

// ==== FUNÇÃO: BUSCAR E ENVIAR VÍDEO ====
async function buscarEEnviarVideo(
  tema: string, 
  remoteJid: string, 
  instanceName: string, 
  supabase: any
): Promise<string> {
  console.log(`[VideoAcao] Buscando vídeo para: ${tema}`);
  
  const video = await enviarVideoAutomatico(tema, supabase);
  
  if (video) {
    return `🎬 *Vídeo-Aula Encontrada!*

📺 *${video.titulo}*

🔗 *Assista aqui:*
${video.link}

━━━━━━━━━━━━━━
_Bons estudos! Qualquer dúvida, estou aqui._ 💜`;
  }
  
  return `😔 Não encontrei um vídeo específico sobre "${tema}".

💡 *Dica:* Tente buscar com termos mais específicos!

Digite *video [tema]* para nova busca.`;
}

// ==== FUNÇÃO: BUSCAR E ENVIAR E-BOOK/PDF ====
async function buscarEEnviarEbook(
  tema: string, 
  remoteJid: string, 
  instanceName: string, 
  supabase: any
): Promise<{ mensagem: string; pdf: any | null }> {
  console.log(`[EbookAcao] Buscando e-book para: ${tema}`);
  
  const pdf = await enviarPDFAutomatico(tema, supabase);
  
  if (pdf) {
    return {
      mensagem: `📚 *Material Encontrado!*

📖 *${pdf.titulo}*

⏳ Enviando o PDF...`,
      pdf
    };
  }
  
  return {
    mensagem: `😔 Não encontrei um e-book específico sobre "${tema}".

💡 *Dica:* Digite *livros* para ver todas as áreas disponíveis!

Ou tente: *livro direito civil*, *livro penal*, etc.`,
    pdf: null
  };
}

// ==== PROCESSAR AÇÃO DOS BOTÕES INTERATIVOS ====
async function processarAcaoBotao(
  acao: string,
  tema: string,
  remoteJid: string,
  instanceName: string,
  conversa: any,
  supabase: any
): Promise<{ processou: boolean; resposta: string; pdf?: any }> {
  console.log(`[AcaoBotao] Processando: ${acao} para tema: ${tema}`);
  
  // Buscar contexto anterior da conversa
  let contextoAnterior = '';
  try {
    const { data: ultimasMensagens } = await supabase
      .from('evelyn_mensagens')
      .select('conteudo, remetente')
      .eq('conversa_id', conversa.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (ultimasMensagens) {
      contextoAnterior = ultimasMensagens
        .reverse()
        .map((m: any) => `${m.remetente === 'usuario' ? 'Usuário' : 'Evelyn'}: ${m.conteudo.substring(0, 200)}`)
        .join('\n');
    }
  } catch (e) {
    console.error('[AcaoBotao] Erro ao buscar contexto:', e);
  }
  
  switch (acao) {
    case 'aprofundar':
      const respostaAprofundar = await aprofundarTema(tema, contextoAnterior, supabase);
      return { processou: true, resposta: respostaAprofundar };
      
    case 'resumo':
      const respostaResumo = await gerarResumo(tema, contextoAnterior, supabase);
      return { processou: true, resposta: respostaResumo };
      
    case 'video':
      const respostaVideo = await buscarEEnviarVideo(tema, remoteJid, instanceName, supabase);
      return { processou: true, resposta: respostaVideo };
      
    case 'ebook':
      const { mensagem, pdf } = await buscarEEnviarEbook(tema, remoteJid, instanceName, supabase);
      return { processou: true, resposta: mensagem, pdf };
      
    default:
      return { processou: false, resposta: '' };
  }
}

// ==== PROCESSAR AÇÃO DA IA (JSON no início da resposta) ====
async function processarAcaoIA(
  resposta: string, 
  remoteJid: string, 
  instanceName: string, 
  identificador: string,
  supabase: any
): Promise<{ processou: boolean; mensagemFinal: string }> {
  try {
    // Verificar se a resposta começa com JSON de ação
    const matchJson = resposta.match(/^\s*(\{[^}]+\})/);
    if (!matchJson) {
      return { processou: false, mensagemFinal: resposta };
    }
    
    let acao: any;
    try {
      acao = JSON.parse(matchJson[1]);
    } catch {
      return { processou: false, mensagemFinal: resposta };
    }
    
    // Extrair mensagem do resto da resposta
    const mensagemTexto = resposta.replace(matchJson[1], '').trim();
    
    console.log(`[AcaoIA] Detectada ação: ${acao.acao}, tema: ${acao.tema}`);
    
    if (acao.acao === 'enviar_video') {
      const video = await enviarVideoAutomatico(acao.tema || 'direito', supabase);
      if (video) {
        const mensagemVideo = `🎬 *${video.titulo}*\n\n${video.link}\n\n${mensagemTexto || acao.mensagem || 'Aqui está um vídeo sobre o tema!'}`;
        return { processou: true, mensagemFinal: mensagemVideo };
      }
    }
    
    if (acao.acao === 'enviar_pdf') {
      const pdf = await enviarPDFAutomatico(acao.tema || 'direito', supabase);
      if (pdf) {
        // Enviar mensagem preparatória
        await enviarMensagemWhatsApp(
          remoteJid,
          `📚 *Encontrei um material para você!*\n\n*${pdf.titulo}*\n\n⏳ Enviando PDF...`,
          instanceName,
          supabase
        );
        
        // Enviar o PDF
        const enviado = await enviarPDFWhatsApp(remoteJid, pdf.download, pdf.titulo, instanceName);
        
        if (enviado) {
          return { 
            processou: true, 
            mensagemFinal: `✅ *PDF Enviado!*\n\n${mensagemTexto || acao.mensagem || 'Bons estudos! 💜'}\n\n_Digite "livros" para ver mais materiais._` 
          };
        }
      }
    }
    
    if (acao.acao === 'perguntar_material') {
      // Salvar estado de aguardando confirmação
      await supabase.from('evelyn_conversas')
        .update({ 
          aguardando_confirmacao: { 
            tipo: 'material', 
            tema: acao.tema 
          } 
        })
        .eq('telefone', identificador);
      
      return { 
        processou: true, 
        mensagemFinal: mensagemTexto || acao.mensagem || `Posso te enviar um *vídeo* explicativo ou um *PDF* para estudo sobre ${acao.tema}. O que prefere? 📚🎬` 
      };
    }
    
    return { processou: false, mensagemFinal: resposta };
  } catch (e) {
    console.error('[AcaoIA] Erro ao processar ação:', e);
    return { processou: false, mensagemFinal: resposta };
  }
}

// ==== FUNCIONALIDADE: ENVIAR ÁUDIO VIA WHATSAPP ====
async function enviarAudioWhatsApp(
  remoteJid: string, 
  audioUrl: string, 
  instanceName: string,
  caption?: string
): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey || !audioUrl) {
    console.log('[EnviarAudio] Configuração ausente ou URL vazia');
    return false;
  }
  
  try {
    console.log(`[EnviarAudio] Enviando áudio: ${audioUrl.substring(0, 80)}...`);
    
    // Converter URL do Google Drive se necessário
    const urlAudio = converterUrlGoogleDrive(audioUrl);
    
    const response = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        mediatype: 'audio',
        media: urlAudio,
        caption: caption || '🎧 Narração do artigo'
      }),
    });
    
    const responseBody = await response.text();
    console.log(`[EnviarAudio] Status: ${response.status}, Body: ${responseBody.substring(0, 200)}`);
    
    if (response.ok) {
      console.log('[EnviarAudio] Áudio enviado com sucesso');
      return true;
    }
    
    // Fallback: enviar link do áudio
    console.log('[EnviarAudio] sendMedia falhou, enviando link...');
    await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        text: `🎧 *Narração disponível:*\n\n${urlAudio}\n\n_Clique para ouvir_ 🔊`,
      }),
    });
    
    return true;
  } catch (e) {
    console.error('[EnviarAudio] Erro:', e);
    return false;
  }
}

// ==== FUNCIONALIDADE: FORMATAR TEXTO DE ARTIGO PARA WHATSAPP ====
function formatarArtigoParaWhatsApp(texto: string): string {
  if (!texto) return '';
  
  let formatado = texto;
  
  // 1. Remover anotações entre parênteses EXCETO revogado/vetado
  // Padrão: (Incluído pela Lei nº...), (Redação dada pela Lei nº...), etc.
  formatado = formatado.replace(/\([^)]*(?:Incluído|Incluída|Incluídos|Incluídas|Redação dada|Redação original|Acrescido|Acrescida|Renumerado|Renumerada|Alterado|Alterada)[^)]*\)/gi, '');
  
  // 2. Manter apenas (Revogado...) ou (Vetado...)
  // Não precisa fazer nada - já estão preservados acima
  
  // 3. Corrigir quebras de linha indevidas no meio de frases
  // Remove quebra de linha seguida de letra minúscula (indica continuação)
  formatado = formatado.replace(/\n+([a-zà-ú])/g, ' $1');
  
  // 4. Normalizar espaços múltiplos
  formatado = formatado.replace(/[ \t]+/g, ' ');
  
  // 5. Corrigir espaços extras antes de elementos estruturais
  // Incisos (I, II, III, etc.) e Alíneas (a), b), etc.)
  formatado = formatado.replace(/\n[ ]+([IVX]+\s*[-–—])/g, '\n\n$1');
  formatado = formatado.replace(/\n[ ]+([a-z]\))/g, '\n\n$1');
  
  // 6. Garantir QUEBRA DUPLA antes de incisos romanos (I, II, III, IV, V, VI, VII, VIII, IX, X, etc.)
  formatado = formatado.replace(/([.;:])\s*([IVX]+\s*[-–—])/g, '$1\n\n$2');
  
  // 7. Garantir QUEBRA DUPLA antes de alíneas (a), b), c), etc.)
  formatado = formatado.replace(/([.;:])\s*([a-z]\))/g, '$1\n\n$2');
  
  // 8. Garantir QUEBRA DUPLA antes de parágrafos (§ 1º, § 2º, Parágrafo único)
  formatado = formatado.replace(/([.;:])\s*(§\s*\d|Parágrafo\s*único)/gi, '$1\n\n$2');
  
  // 9. Garantir QUEBRA DUPLA após caput (antes do primeiro inciso ou parágrafo)
  // Detectar final do caput (geralmente termina com ":" antes dos incisos)
  formatado = formatado.replace(/:(\s*)([IVX]+\s*[-–—])/g, ':\n\n$2');
  formatado = formatado.replace(/:(\s*)(§)/g, ':\n\n$2');
  
  // 10. Limpar quebras excessivas (máx 2)
  formatado = formatado.replace(/\n{3,}/g, '\n\n');
  
  // 11. Remover espaços no início/fim de linhas
  formatado = formatado.split('\n').map(line => line.trim()).join('\n');
  
  // 12. Garantir que cada inciso/alínea/parágrafo tenha linha em branco antes
  formatado = formatado.replace(/([^\n])\n([IVX]+\s*[-–—])/g, '$1\n\n$2');
  formatado = formatado.replace(/([^\n])\n([a-z]\))/g, '$1\n\n$2');
  formatado = formatado.replace(/([^\n])\n(§\s*\d|Parágrafo\s*único)/gi, '$1\n\n$2');
  
  // 13. Limpar novamente quebras excessivas
  formatado = formatado.replace(/\n{3,}/g, '\n\n');
  
  return formatado.trim();
}

// ==== FUNCIONALIDADE: CONSULTA DE LEIS/ARTIGOS (COM NARRAÇÃO) ====
interface ArtigoResult {
  texto: string;
  narracaoUrl: string | null;
}

async function consultarArtigo(numeroArtigo: string, codigoLei: string, supabase: any): Promise<ArtigoResult | null> {
  try {
    // Mapear código para nome da tabela
    const tabela = TABELAS_LEIS[codigoLei.toLowerCase()];
    if (!tabela) return null;
    
    console.log(`[ConsultaLei] Buscando Art. ${numeroArtigo} em ${tabela}`);
    
    const { data: artigos } = await supabase
      .from(tabela)
      .select('"Número do Artigo", "Artigo", "Comentario", "explicacao_resumido", "explicacao_simples_maior16", "Narração"')
      .ilike('"Número do Artigo"', `%${numeroArtigo}%`)
      .limit(1);
    
    if (!artigos || artigos.length === 0) {
      return null;
    }
    
    const art = artigos[0];
    const narracaoUrl = art['Narração'] || null;
    
    // Aplicar formatação para WhatsApp no texto do artigo
    const artigoFormatado = formatarArtigoParaWhatsApp(art['Artigo'] || 'Texto não disponível');
    
    let resposta = `⚖️ *${tabela}*\n`;
    resposta += `📜 *Artigo ${art['Número do Artigo']}*\n\n`;
    resposta += `━━━━━━━━━━━━━━\n`;
    resposta += `${artigoFormatado}\n`;
    resposta += `━━━━━━━━━━━━━━\n`;
    
    if (art['explicacao_resumido']) {
      resposta += `\n📝 *Explicação Resumida:*\n${art['explicacao_resumido'].substring(0, 400)}...\n`;
    }
    
    if (art['Comentario']) {
      resposta += `\n💬 *Comentário:*\n${art['Comentario'].substring(0, 300)}...\n`;
    }
    
    // Indicar se há narração disponível
    if (narracaoUrl) {
      resposta += `\n🎧 *Narração:* _Enviando áudio..._\n`;
    }
    
    resposta += `\n━━━━━━━━━━━━━━`;
    resposta += `\n🔍 _Digite "art [número] [código]" para consultar outro!_`;
    resposta += `\n_Ex: art 5 cf, art 121 cp, art 1 cdc_`;
    
    return { texto: resposta, narracaoUrl };
  } catch (e) {
    console.error('[ConsultaLei] Erro:', e);
    return null;
  }
}

// ==== FUNCIONALIDADE: QUIZ OAB ====
async function buscarQuizOAB(supabase: any): Promise<{ pergunta: string; questaoId: number; respostaCorreta: string } | null> {
  try {
    console.log(`[Quiz] Buscando questão aleatória...`);
    
    // Contar total
    const { count } = await supabase
      .from('QUESTOES_GERADAS')
      .select('*', { count: 'exact', head: true })
      .eq('aprovada', true);
    
    const randomOffset = Math.floor(Math.random() * Math.min(count || 100, 500));
    
    const { data: questoes } = await supabase
      .from('QUESTOES_GERADAS')
      .select('id, area, tema, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, comentario')
      .eq('aprovada', true)
      .range(randomOffset, randomOffset);
    
    if (!questoes || questoes.length === 0) {
      // Fallback
      const { data: fallback } = await supabase
        .from('QUESTOES_GERADAS')
        .select('id, area, tema, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, comentario')
        .eq('aprovada', true)
        .limit(1);
      
      if (!fallback || fallback.length === 0) return null;
      questoes.push(fallback[0]);
    }
    
    const q = questoes[0];
    
    let pergunta = `🎯 *QUIZ JURÍDICO*\n`;
    pergunta += `📚 _${q.area} > ${q.tema}_\n\n`;
    pergunta += `━━━━━━━━━━━━━━\n`;
    pergunta += `❓ *Questão:*\n${q.enunciado}\n\n`;
    pergunta += `*A)* ${q.alternativa_a}\n\n`;
    pergunta += `*B)* ${q.alternativa_b}\n\n`;
    pergunta += `*C)* ${q.alternativa_c}\n\n`;
    pergunta += `*D)* ${q.alternativa_d}\n`;
    pergunta += `━━━━━━━━━━━━━━\n`;
    pergunta += `\n💬 _Responda com A, B, C ou D!_`;
    pergunta += `\n_Digite *gabarito* para ver a resposta._`;
    
    return {
      pergunta,
      questaoId: q.id,
      respostaCorreta: q.resposta_correta
    };
  } catch (e) {
    console.error('[Quiz] Erro:', e);
    return null;
  }
}

// Função para mostrar gabarito do quiz
async function mostrarGabaritoQuiz(questaoId: number, supabase: any): Promise<string | null> {
  try {
    const { data: questao } = await supabase
      .from('QUESTOES_GERADAS')
      .select('resposta_correta, comentario, alternativa_a, alternativa_b, alternativa_c, alternativa_d')
      .eq('id', questaoId)
      .single();
    
    if (!questao) return null;
    
    const alternativas: Record<string, string> = {
      'A': questao.alternativa_a,
      'B': questao.alternativa_b,
      'C': questao.alternativa_c,
      'D': questao.alternativa_d
    };
    
    let resposta = `✅ *GABARITO*\n\n`;
    resposta += `🎯 Resposta correta: *${questao.resposta_correta}*\n`;
    resposta += `"${alternativas[questao.resposta_correta] || ''}"\n\n`;
    
    if (questao.comentario) {
      resposta += `━━━━━━━━━━━━━━\n`;
      resposta += `📝 *Comentário:*\n${questao.comentario.substring(0, 600)}\n`;
    }
    
    resposta += `\n━━━━━━━━━━━━━━`;
    resposta += `\n🔄 _Digite *quiz* para outra questão!_`;
    
    return resposta;
  } catch (e) {
    console.error('[Quiz Gabarito] Erro:', e);
    return null;
  }
}

// Função para buscar artigos relevantes no banco (RAG simples)
async function buscarArtigosRelevantes(pergunta: string, supabase: any): Promise<string> {
  // Detectar menção a artigo específico
  const matchArtigo = pergunta.match(/art(?:igo)?\.?\s*(\d+[a-z]?(?:-[a-z])?)/i);
  const matchLei = pergunta.toLowerCase();
  
  // Identificar qual lei/código
  let tabelaAlvo: string | null = null;
  for (const [termo, tabela] of Object.entries(TABELAS_LEIS)) {
    if (matchLei.includes(termo)) {
      tabelaAlvo = tabela;
      break;
    }
  }
  
  if (!tabelaAlvo && !matchArtigo) {
    return ''; // Sem referência específica
  }
  
  // Se não especificou lei mas mencionou artigo, usar CF como padrão
  if (!tabelaAlvo && matchArtigo) {
    tabelaAlvo = 'CF - Constituição Federal';
  }
  
  try {
    console.log(`[RAG] Buscando em: ${tabelaAlvo}, artigo: ${matchArtigo?.[1] || 'N/A'}`);
    
    let query = supabase
      .from(tabelaAlvo!)
      .select('"Número do Artigo", "Artigo", "Comentario", "explicacao_resumido"')
      .limit(3);
    
    if (matchArtigo) {
      query = query.ilike('"Número do Artigo"', `%${matchArtigo[1]}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[RAG] Erro ao buscar:', error);
      return '';
    }
    
    if (!data || data.length === 0) {
      return '';
    }
    
    // Formatar contexto
    let contexto = `\n\n📚 *Fonte de dados - ${tabelaAlvo}:*\n`;
    for (const artigo of data) {
      contexto += `\n*Art. ${artigo['Número do Artigo']}:*\n${artigo['Artigo'] || ''}\n`;
      if (artigo['explicacao_resumido']) {
        contexto += `_Explicação:_ ${artigo['explicacao_resumido'].substring(0, 300)}...\n`;
      }
    }
    
    return contexto;
  } catch (e) {
    console.error('[RAG] Erro:', e);
    return '';
  }
}

// Função para enviar menu interativo via Evolution API
async function enviarMenuInterativo(remoteJid: string, instanceName: string): Promise<void> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey) return;
  
  try {
    await fetch(`${evolutionUrl}/message/sendList/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        title: "🎓 *Menu Evelyn v5.1*",
        description: "Como posso ajudar você hoje?",
        buttonText: "📋 Ver Funções",
        footerText: "Evelyn v5.1 • Assistente Jurídica IA",
        sections: [
          {
            title: "📚 Consultas Jurídicas",
            rows: [
              { title: "📖 Consultar Artigo", description: "Buscar artigo de lei específico", rowId: "consultar_artigo" },
              { title: "❓ Tirar Dúvida", description: "Perguntar sobre conceito jurídico", rowId: "tirar_duvida" },
              { title: "📝 Explicar Termo", description: "Significado de termo jurídico", rowId: "explicar_termo" },
              { title: "⚖️ Buscar Jurisprudência", description: "Decisões de tribunais", rowId: "jurisprudencia" }
            ]
          },
          {
            title: "📖 Materiais de Estudo",
            rows: [
              { title: "📚 Receber Livro PDF", description: "Envio material de estudo", rowId: "receber_livro" },
              { title: "📋 Resumo de Tema", description: "Resumo sobre qualquer assunto", rowId: "resumo_tema" },
              { title: "🎯 Sugestão de Estudo", description: "Indicação personalizada", rowId: "sugestao_estudo" }
            ]
          },
          {
            title: "🛠️ Funcionalidades",
            rows: [
              { title: "🎤 Enviar Áudio", description: "Mande áudio que eu transcrevo", rowId: "enviar_audio" },
              { title: "📷 Analisar Imagem", description: "Envie foto de documento", rowId: "analisar_imagem" },
              { title: "📄 Ler PDF", description: "Analiso documentos PDF", rowId: "ler_pdf" },
              { title: "✍️ Fazer Petição", description: "Ajudo a montar petições", rowId: "fazer_peticao" }
            ]
          },
          {
            title: "ℹ️ Sobre",
            rows: [
              { title: "🤖 Minhas Funções", description: "Tudo que posso fazer", rowId: "minhas_funcoes" },
              { title: "📞 Falar com Humano", description: "Solicitar atendimento", rowId: "falar_humano" }
            ]
          }
        ]
      }),
    });
    console.log('[processar-mensagem-evelyn] Menu interativo enviado');
  } catch (e) {
    console.error('[processar-mensagem-evelyn] Erro ao enviar menu:', e);
  }
}

// Função para buscar livro relacionado ao tema
async function buscarLivroRelacionado(tema: string, supabase: any): Promise<any | null> {
  const termosBusca = tema.toLowerCase().split(' ').filter(t => t.length > 3);
  
  for (const termo of termosBusca) {
    try {
      // Buscar em BIBLIOTECA-ESTUDOS
      const { data: livro } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('*')
        .or(`Tema.ilike.%${termo}%,Área.ilike.%${termo}%`)
        .limit(1)
        .maybeSingle();
      
      if (livro) {
        console.log(`[processar-mensagem-evelyn] Livro encontrado: ${livro.Tema}`);
        return livro;
      }
    } catch (e) {
      console.log('[processar-mensagem-evelyn] Erro ao buscar livro:', e);
    }
  }
  
  return null;
}

// Função para listar áreas de livros disponíveis
async function listarAreasLivros(supabase: any): Promise<{ lista: string; areas: string[] }> {
  try {
    const { data: livros } = await supabase
      .from('BIBLIOTECA-ESTUDOS')
      .select('"Área"')
      .not('Download', 'is', null);
    
    const contagem: Record<string, number> = {};
    livros?.forEach((l: any) => {
      const area = l['Área'] || 'Outros';
      contagem[area] = (contagem[area] || 0) + 1;
    });
    
    const areasOrdenadas = Object.entries(contagem)
      .sort(([,a], [,b]) => (b as number) - (a as number));
    
    let lista = '📚 *Materiais de Estudo Disponíveis*\n\n';
    lista += `Total: *${livros?.length || 0} materiais* em ${areasOrdenadas.length} áreas\n\n`;
    lista += '📂 *Áreas disponíveis:*\n\n';
    
    areasOrdenadas.forEach(([area, qtd]) => {
      lista += `• ${area} _(${qtd})_\n`;
    });
    
    lista += '\n💡 _Digite o nome da área para ver os livros!_\n';
    lista += '_Ex: "direito civil" ou "direito penal"_';
    
    return { lista, areas: areasOrdenadas.map(([a]) => a.toLowerCase()) };
  } catch (e) {
    console.error('[processar-mensagem-evelyn] Erro ao listar áreas:', e);
    return { lista: 'Erro ao listar áreas', areas: [] };
  }
}

// Função para listar livros de uma área específica
async function listarLivrosDaArea(area: string, supabase: any): Promise<{ lista: string; livros: any[] }> {
  try {
    const { data: livros } = await supabase
      .from('BIBLIOTECA-ESTUDOS')
      .select('id, Tema, "Área", Sobre, Download')
      .ilike('"Área"', `%${area}%`)
      .not('Download', 'is', null)
      .limit(10);
    
    if (!livros || livros.length === 0) {
      return { lista: `📚 Não encontrei livros na área "${area}".`, livros: [] };
    }
    
    let lista = `📚 *Livros de ${livros[0]['Área'] || area}*\n\n`;
    
    livros.forEach((l: any, i: number) => {
      lista += `*${i + 1}. ${l.Tema || 'Material'}*\n`;
      if (l.Sobre) {
        lista += `   _${l.Sobre.substring(0, 80)}..._\n`;
      }
      lista += `   📥 Digite *livro ${l.id}* para receber\n\n`;
    });
    
    lista += '_Escolha um número ou digite o nome do livro!_';
    
    return { lista, livros };
  } catch (e) {
    console.error('[processar-mensagem-evelyn] Erro ao listar livros:', e);
    return { lista: 'Erro ao buscar livros', livros: [] };
  }
}

// Função para enviar PDF via WhatsApp
async function enviarPDFWhatsApp(
  remoteJid: string, 
  pdfUrl: string, 
  titulo: string, 
  instanceName: string
): Promise<boolean> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey) {
    console.error('[processar-mensagem-evelyn] Evolution API não configurada');
    return false;
  }
  
  try {
    // CORREÇÃO: Converter URL do Google Drive para formato de download direto
    const urlDownload = converterUrlGoogleDrive(pdfUrl);
    console.log(`[processar-mensagem-evelyn] Enviando PDF: ${titulo} para ${remoteJid}`);
    console.log(`[processar-mensagem-evelyn] URL original: ${pdfUrl.substring(0, 80)}...`);
    console.log(`[processar-mensagem-evelyn] URL download: ${urlDownload.substring(0, 80)}...`);
    
    // Tentar enviar como documento/media
    const response = await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        mediatype: 'document',
        media: urlDownload, // Usar URL convertida
        fileName: `${titulo}.pdf`,
        caption: `📚 *${titulo}*\n\n_Enviado por Evelyn v${VERSION}_ 💜`
      }),
    });
    
    const responseBody = await response.text();
    console.log(`[processar-mensagem-evelyn] sendMedia status: ${response.status}, body: ${responseBody.substring(0, 200)}`);
    
    if (response.ok) {
      console.log('[processar-mensagem-evelyn] PDF enviado com sucesso via sendMedia');
      return true;
    }
    
    // Fallback: enviar link direto
    console.log('[processar-mensagem-evelyn] sendMedia falhou, enviando link...');
    const responseText = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        text: `📚 *${titulo}*\n\n📥 *Link para download:*\n${urlDownload}\n\n_Bons estudos!_ 📖💜`,
      }),
    });
    
    return responseText.ok;
  } catch (e) {
    console.error('[processar-mensagem-evelyn] Erro ao enviar PDF:', e);
    return false;
  }
}

// Função para enviar botões de recomendação de livro
async function enviarBotoesLivro(remoteJid: string, livro: any, instanceName: string, supabase: any): Promise<void> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey || !livro) return;
  
  try {
    const mensagem = `📚 *Encontrei um material que pode te ajudar!*

*${livro.Tema || livro.Livro || 'Material de Estudo'}*
${livro.Sobre ? `\n_${livro.Sobre.substring(0, 150)}..._` : ''}

Posso enviar esse PDF para você? 📄`;

    await fetch(`${evolutionUrl}/message/sendButtons/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
        title: "📚 Recomendação de Material",
        description: mensagem,
        footerText: `Evelyn v${VERSION}`,
        buttons: [
          { buttonId: `livro_sim_${livro.id}`, buttonText: { displayText: "✅ Sim, envie!" } },
          { buttonId: `livro_nao`, buttonText: { displayText: "❌ Não, obrigado" } },
          { buttonId: `livro_outros`, buttonText: { displayText: "📖 Ver outros" } }
        ]
      }),
    });
    console.log('[processar-mensagem-evelyn] Botões de livro enviados');
  } catch (e) {
    console.error('[processar-mensagem-evelyn] Erro ao enviar botões de livro:', e);
    // Fallback: enviar como texto simples
    await enviarMensagemWhatsApp(
      remoteJid,
      `📚 *Encontrei um material que pode te ajudar!*\n\n*${livro.Tema || livro.Livro}*\n\nDigite *livro ${livro.id}* para receber o PDF! 📄`,
      instanceName,
      supabase
    );
  }
}

// Função para baixar mídia da Evolution API
async function baixarMidiaEvolution(messageKey: any, instanceName: string, convertToMp4: boolean = false): Promise<string | null> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey) {
    console.error('[processar-mensagem-evelyn] EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados');
    return null;
  }

  try {
    console.log(`[processar-mensagem-evelyn] Baixando mídia: instanceName=${instanceName}, convertToMp4=${convertToMp4}`);
    
    const response = await fetch(`${evolutionUrl}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        message: { key: messageKey },
        convertToMp4
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[processar-mensagem-evelyn] Erro ao baixar mídia:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('[processar-mensagem-evelyn] Mídia baixada com sucesso, tamanho base64:', data.base64?.length || 0);
    return data.base64 || null;
  } catch (e) {
    console.error('[processar-mensagem-evelyn] Erro ao baixar mídia:', e);
    return null;
  }
}

// Função para processar mídia com Gemini (imagens, áudios, documentos)
async function processarMidiaGemini(base64Data: string, mimeType: string, tipo: string, contexto?: string): Promise<string> {
  const GEMINI_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
  ].filter(Boolean);

  let prompt = '';
  
  if (tipo === 'audio') {
    prompt = `Você é a Evelyn, assistente jurídica brasileira especialista em explicações didáticas e contextuais.

Escute este áudio e responda DIRETAMENTE ao que foi perguntado/dito.

🚫 REGRA CRÍTICA: 
- NÃO repita o que a pessoa disse no áudio. NÃO escreva a transcrição.
- NÃO comece com "Você perguntou sobre..." ou "Você disse..."

✅ USE ESTA ESTRUTURA PARA EXPLICAÇÕES JURÍDICAS:

📌 *Resumo Rápido*
[1-2 frases simples - comece com analogia do dia a dia se for conceito]

📖 *Explicação Detalhada*
[Explique em linguagem simples ANTES do juridiquês - como aula particular]

⚖️ *Base Legal*
[Cite artigos e EXPLIQUE o que cada um significa, não só números]

💡 *Exemplos Práticos*
[2-3 situações do cotidiano brasileiro: compras online, aluguel, vizinho, etc]

⚠️ *Pontos de Atenção*
[Exceções, pegadinhas, o que as pessoas confundem]

🎯 *O Que Fazer na Prática*
[Passos concretos se a pessoa estiver nessa situação]

📝 FORMATAÇÃO PARA WHATSAPP:
- Use *negrito* para termos importantes
- Use _itálico_ para citações e exemplos
- Use • para listas organizadas
- Separe seções com quebras de linha duplas
- MÍNIMO de 400 palavras para explicações jurídicas

Responda de forma COMPLETA, DIDÁTICA e CONTEXTUAL:`;
  } else if (tipo === 'imagem') {
    prompt = `Você é a Evelyn, assistente jurídica brasileira especialista em análise de documentos.

Analise esta imagem com foco jurídico. ${contexto ? `O usuário enviou a legenda: "${contexto}"` : ''}

📌 PARA DOCUMENTOS JURÍDICOS (petição, contrato, certidão, notificação, etc):

1. *Identifique o tipo* - Qual é este documento?

2. *Explique o que significa para a vida da pessoa*
   - O que este documento representa na prática?
   - Quais os direitos ou obrigações que ele cria?

3. *Destaque TODAS as informações importantes*
   - Datas, prazos, valores, partes envolvidas
   - Cláusulas que merecem atenção especial

4. *Aponte possíveis problemas ou riscos*
   - Há algo que a pessoa deveria se preocupar?
   - Há cláusulas abusivas ou irregularidades?

5. *Sugira próximos passos*
   - O que a pessoa deve fazer agora?
   - Precisa de alguma providência urgente?

📌 PARA OUTRAS IMAGENS:
- Descreva o conteúdo e relacione com aspectos jurídicos se aplicável

📝 FORMATAÇÃO PARA WHATSAPP:
- Use *negrito* para destaques e títulos
- Use _itálico_ para citações
- Use • para listas organizadas
- Separe seções com quebras duplas
- MÍNIMO de 300 palavras para análise de documentos`;
  } else if (tipo === 'documento') {
    prompt = `Você é a Evelyn, assistente jurídica brasileira especialista em análise documental.

Analise este documento com foco jurídico. ${contexto ? `Nome do arquivo: "${contexto}"` : ''}

📌 ESTRUTURA OBRIGATÓRIA DA ANÁLISE:

1. *Tipo de Documento*
   - O que é este documento?
   - Qual sua finalidade jurídica?

2. *O Que Significa Para Você*
   - Explique em linguagem simples o que este documento representa
   - Quais direitos ou obrigações ele cria?

3. *Resumo dos Principais Pontos*
   - Liste TODAS as informações importantes
   - Datas, prazos, valores, condições, partes

4. *Cláusulas ou Trechos que Merecem Atenção*
   - Destaque pontos críticos
   - Há algo incomum ou que precisa de cuidado?

5. *Possíveis Riscos ou Problemas*
   - Há cláusulas abusivas?
   - Algo está faltando que deveria estar?
   - Há irregularidades?

6. *O Que Fazer Agora*
   - Próximos passos recomendados
   - Precisa de alguma providência?

⚖️ *Base Legal* (quando aplicável)
   - Cite artigos relevantes E explique o que significam

📝 FORMATAÇÃO PARA WHATSAPP:
- Use *negrito* para termos importantes
- Use _itálico_ para citações do documento
- Use • para listas organizadas
- Separe seções com quebras de linha duplas
- MÍNIMO de 400 palavras para análise completa`;
  } else if (tipo === 'video') {
    prompt = `Você é a Evelyn, assistente jurídica brasileira.

Analise este vídeo detalhadamente:

1. Se houver áudio/fala, analise o conteúdo principal
2. Identifique os pontos mais importantes
3. Relacione com aspectos jurídicos se aplicável
4. Dê uma análise completa e estruturada
5. Explique o que significa para a pessoa que enviou

📝 Use formatação WhatsApp (*negrito*, • listas) para organizar a resposta.
Seja didático e contextual na explicação.`;
  }

  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Data } }
              ]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log('[processar-mensagem-evelyn] Rate limit na chave Gemini, tentando próxima...');
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[processar-mensagem-evelyn] Erro Gemini mídia:', errorText);
        continue;
      }

      const data = await response.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!texto) {
        console.error('[processar-mensagem-evelyn] Resposta Gemini sem texto:', data);
        continue;
      }
      
      return texto;
    } catch (e) {
      console.error('[processar-mensagem-evelyn] Erro ao chamar Gemini para mídia:', e);
      continue;
    }
  }
  throw new Error('Todas as chaves Gemini falharam ao processar mídia');
}

async function chamarGemini(mensagens: any[]): Promise<string> {
  const GEMINI_KEYS = [
    Deno.env.get('GEMINI_KEY_1'),
    Deno.env.get('GEMINI_KEY_2'),
    Deno.env.get('GEMINI_KEY_3'),
  ].filter(Boolean);

  for (const apiKey of GEMINI_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: mensagens,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8000,
            },
          }),
        }
      );

      if (response.status === 429) {
        console.log('[processar-mensagem-evelyn] Rate limit na chave, tentando próxima...');
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[processar-mensagem-evelyn] Erro Gemini:', errorText);
        continue;
      }

      const data = await response.json();
      const texto = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!texto) {
        console.error('[processar-mensagem-evelyn] Resposta Gemini sem texto:', data);
        continue;
      }
      
      return texto;
    } catch (e) {
      console.error('[processar-mensagem-evelyn] Erro ao chamar Gemini:', e);
      continue;
    }
  }
  throw new Error('Todas as chaves Gemini falharam');
}

// Função para resolver LID para telefone real
async function resolverLidParaTelefone(lid: string, instanceName: string, supabase: any): Promise<string | null> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  console.log(`[processar-mensagem-evelyn] Tentando resolver LID: ${lid}`);
  
  // 1. Primeiro buscar no mapeamento local
  const { data: mapping } = await supabase
    .from('evelyn_lid_mapping')
    .select('telefone')
    .eq('lid', lid)
    .single();
  
  if (mapping?.telefone) {
    console.log(`[processar-mensagem-evelyn] LID encontrado no mapeamento: ${lid} -> ${mapping.telefone}`);
    return mapping.telefone;
  }
  
  // 2. Tentar resolver via Evolution API findContacts
  if (evolutionUrl && evolutionKey) {
    try {
      console.log(`[processar-mensagem-evelyn] Tentando resolver via findContacts...`);
      const response = await fetch(`${evolutionUrl}/chat/findContacts/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionKey,
        },
        body: JSON.stringify({
          where: { id: `${lid}@lid` }
        }),
      });
      
      if (response.ok) {
        const contacts = await response.json();
        console.log(`[processar-mensagem-evelyn] findContacts resposta:`, JSON.stringify(contacts));
        
        // Procurar por número real nos contatos retornados
        if (Array.isArray(contacts) && contacts.length > 0) {
          for (const contact of contacts) {
            // O número pode estar em contact.id ou contact.number
            const possibleNumber = contact.id || contact.number || contact.jid;
            if (possibleNumber && !possibleNumber.includes('@lid')) {
              const telefone = possibleNumber.replace(/@.*/, '');
              console.log(`[processar-mensagem-evelyn] Telefone encontrado via findContacts: ${telefone}`);
              
              // Salvar no mapeamento para uso futuro
              await supabase.from('evelyn_lid_mapping').upsert({
                lid,
                telefone,
                updated_at: new Date().toISOString()
              }, { onConflict: 'lid' });
              
              return telefone;
            }
          }
        }
      }
    } catch (e) {
      console.error('[processar-mensagem-evelyn] Erro ao resolver via findContacts:', e);
    }
  }
  
  console.log(`[processar-mensagem-evelyn] Não foi possível resolver LID: ${lid}`);
  return null;
}

async function enviarMensagemWhatsApp(remoteJid: string, texto: string, instanceName: string, supabase: any) {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey) {
    throw new Error('EVOLUTION_API_URL ou EVOLUTION_API_KEY não configurados');
  }

  let numeroParaEnvio = remoteJid;
  const isLid = remoteJid.endsWith('@lid');
  
  // Se for LID, tentar resolver para telefone real
  if (isLid) {
    const lid = remoteJid.replace('@lid', '');
    console.log(`[processar-mensagem-evelyn] Detectado LID: ${lid}, tentando resolver...`);
    
    const telefoneReal = await resolverLidParaTelefone(lid, instanceName, supabase);
    
    if (telefoneReal) {
      numeroParaEnvio = `${telefoneReal}@s.whatsapp.net`;
      console.log(`[processar-mensagem-evelyn] LID resolvido para: ${numeroParaEnvio}`);
    } else {
      // Estratégia de fallback: tentar diferentes formatos
      // Alguns LIDs são o próprio número sem o código do país
      // Tentar adicionar código do Brasil (55)
      const tentativas = [
        `55${lid}@s.whatsapp.net`,      // Brasil + LID direto
        `5511${lid}@s.whatsapp.net`,    // Brasil + SP + LID (caso seja número local)
        remoteJid,                       // Tentar LID original como último recurso
      ];
      
      for (const tentativa of tentativas) {
        console.log(`[processar-mensagem-evelyn] Tentando enviar para: ${tentativa}`);
        
        try {
          const checkResponse = await fetch(`${evolutionUrl}/chat/whatsappNumbers/${instanceName}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionKey,
            },
            body: JSON.stringify({
              numbers: [tentativa.replace(/@.*/, '')]
            }),
          });
          
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            console.log(`[processar-mensagem-evelyn] whatsappNumbers resposta:`, JSON.stringify(checkData));
            
            // Verificar se o número existe
            if (Array.isArray(checkData) && checkData.length > 0 && checkData[0]?.exists) {
              const jidValido = checkData[0].jid;
              console.log(`[processar-mensagem-evelyn] Número válido encontrado: ${jidValido}`);
              
              // Salvar mapeamento para uso futuro
              await supabase.from('evelyn_lid_mapping').upsert({
                lid,
                telefone: jidValido.replace(/@.*/, ''),
                updated_at: new Date().toISOString()
              }, { onConflict: 'lid' });
              
              numeroParaEnvio = jidValido;
              break;
            }
          }
        } catch (e) {
          console.error(`[processar-mensagem-evelyn] Erro ao verificar ${tentativa}:`, e);
        }
      }
    }
  }

  console.log(`[processar-mensagem-evelyn] Enviando mensagem para: ${numeroParaEnvio}`);

  const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionKey,
    },
    body: JSON.stringify({
      number: numeroParaEnvio,
      text: texto,
    }),
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    console.error('[processar-mensagem-evelyn] Erro ao enviar WhatsApp:', responseText);
    throw new Error(`Erro ao enviar: ${response.status} - ${responseText}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { raw: responseText };
  }
  
  console.log('[processar-mensagem-evelyn] Mensagem enviada com sucesso:', result);
  return result;
}

async function buscarFotoPerfil(remoteJid: string, instanceName: string): Promise<string | null> {
  const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
  const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
  
  if (!evolutionUrl || !evolutionKey) {
    return null;
  }

  try {
    const response = await fetch(`${evolutionUrl}/chat/fetchProfilePictureUrl/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: remoteJid,
      }),
    });

    if (!response.ok) {
      console.log('[processar-mensagem-evelyn] Não foi possível buscar foto do perfil');
      return null;
    }

    const data = await response.json();
    console.log('[processar-mensagem-evelyn] Foto perfil:', data);
    return data.profilePictureUrl || data.picture || data.url || null;
  } catch (e) {
    console.error('[processar-mensagem-evelyn] Erro ao buscar foto:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { remoteJid, tipo, conteudo, metadata, instanceName, messageKey, pushName } = await req.json();
    
    // Extrair identificador para busca no banco (remover sufixo do remoteJid)
    const identificador = remoteJid.replace(/@.*/, '');
    const isLid = remoteJid.endsWith('@lid');
    
    console.log(`[processar-mensagem-evelyn v${VERSION}] Processando: remoteJid=${remoteJid}, identificador=${identificador}, tipo=${tipo}, isLid=${isLid}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Carregar configurações da instância (incluindo novas configurações avançadas)
    const { data: configData } = await supabase
      .from('evelyn_config')
      .select('*')
      .eq('instance_name', instanceName)
      .maybeSingle();
    
    const welcomeMessage = configData?.welcome_message || 'Olá! Sou a Evelyn, sua assistente jurídica. Como posso ajudar?';
    const promptPersonalizado = configData?.personalidade || '';
    const limiteCaracteres = configData?.limite_caracteres || 1000;
    const estiloResposta = configData?.estilo_resposta || 'didático';
    const nivelDetalhamento = configData?.nivel_detalhamento || 'normal';
    const usarNome = configData?.usar_nome !== false;
    const saudacaoHorario = configData?.saudacao_horario !== false;
    const perguntarNomeInicio = configData?.perguntar_nome_inicio !== false;
    const recomendarLivros = configData?.recomendar_livros !== false;
    const feedbackAudioInterativo = configData?.feedback_audio_interativo !== false;
    
    console.log(`[processar-mensagem-evelyn] Config carregada: limiteCaracteres=${limiteCaracteres}, estilo=${estiloResposta}, perguntarNome=${perguntarNomeInicio}`);

    // Se for LID, salvar no mapeamento para tracking
    if (isLid) {
      await supabase.from('evelyn_lid_mapping').upsert({
        lid: identificador,
        push_name: pushName,
        updated_at: new Date().toISOString()
      }, { onConflict: 'lid' });
    }

    // Verificar se é comando de menu
    const conteudoLower = (conteudo || '').toLowerCase().trim();
    if (conteudoLower === 'menu' || conteudoLower === 'opções' || conteudoLower === 'opcoes' || conteudoLower === '/menu') {
      console.log('[processar-mensagem-evelyn] Comando de menu detectado, enviando lista interativa...');
      await enviarMenuInterativo(remoteJid, instanceName);
      return new Response(
        JSON.stringify({ success: true, action: 'menu_enviado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==== PROCESSAR RESPOSTA COM NOME (aguardando_nome = true) ====
    const { data: conversaCheckNome } = await supabase
      .from('evelyn_conversas')
      .select('aguardando_nome, id')
      .eq('telefone', identificador)
      .single();
    
    if (conversaCheckNome?.aguardando_nome === true && tipo === 'texto') {
      // O usuário está respondendo com o nome
      const nomeInformado = conteudo.trim();
      
      // Validar se parece um nome (não é comando, não é muito curto/longo)
      const parecePergunta = nomeInformado.includes('?') || nomeInformado.toLowerCase().startsWith('o que') || 
                             nomeInformado.toLowerCase().startsWith('como') || nomeInformado.toLowerCase().startsWith('qual');
      const isNomeValido = nomeInformado.length >= 2 && nomeInformado.length <= 50 && 
                           !parecePergunta && !nomeInformado.toLowerCase().startsWith('menu');
      
      if (isNomeValido) {
        // Capitalizar primeira letra de cada palavra
        const nomeFormatado = nomeInformado
          .split(' ')
          .map((palavra: string) => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
          .join(' ');
        
        console.log(`[processar-mensagem-evelyn] Nome informado: ${nomeFormatado}`);
        
        // Salvar nome no usuário
        await supabase
          .from('evelyn_usuarios')
          .update({ nome: nomeFormatado })
          .eq('telefone', identificador);
        
        // Desmarcar aguardando_nome
        await supabase
          .from('evelyn_conversas')
          .update({ aguardando_nome: false })
          .eq('telefone', identificador);
        
        // Enviar confirmação
        const mensagemConfirmacao = getMensagemConfirmacaoNome(nomeFormatado);
        await enviarMensagemWhatsApp(remoteJid, mensagemConfirmacao, instanceName, supabase);
        
        return new Response(
          JSON.stringify({ success: true, action: 'nome_salvo', nome: nomeFormatado }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Se não parecer nome, continuar processamento normal
    }

    // ==== PROCESSAR CONFIRMAÇÃO DE MATERIAL (vídeo/pdf) ====
    // Verificar se há confirmação pendente
    const { data: conversaCheck } = await supabase
      .from('evelyn_conversas')
      .select('aguardando_confirmacao')
      .eq('telefone', identificador)
      .single();
    
    if (conversaCheck?.aguardando_confirmacao?.tipo === 'material') {
      const tema = conversaCheck.aguardando_confirmacao.tema || 'direito';
      
      // Verificar se a resposta indica vídeo ou pdf
      const querVideo = conteudoLower.includes('video') || conteudoLower.includes('vídeo') || 
                        conteudoLower === 'v' || conteudoLower === '1' ||
                        conteudoLower.includes('assistir') || conteudoLower.includes('aula');
      const querPdf = conteudoLower.includes('pdf') || conteudoLower.includes('livro') || 
                      conteudoLower.includes('material') || conteudoLower === 'p' || conteudoLower === '2' ||
                      conteudoLower.includes('ler') || conteudoLower.includes('apostila');
      const querAmbos = conteudoLower.includes('ambos') || conteudoLower.includes('dois') || 
                        conteudoLower.includes('os dois') || conteudoLower === '3';
      
      if (querVideo || querPdf || querAmbos) {
        console.log(`[processar-mensagem-evelyn] Confirmação de material: video=${querVideo}, pdf=${querPdf}, ambos=${querAmbos}, tema=${tema}`);
        
        // Limpar estado de confirmação
        await supabase.from('evelyn_conversas')
          .update({ aguardando_confirmacao: null })
          .eq('telefone', identificador);
        
        let mensagemEnviada = '';
        
        if (querVideo || querAmbos) {
          const video = await enviarVideoAutomatico(tema, supabase);
          if (video) {
            await enviarMensagemWhatsApp(
              remoteJid,
              `🎬 *${video.titulo}*\n\nAssista aqui: ${video.link}`,
              instanceName,
              supabase
            );
            mensagemEnviada += 'vídeo enviado';
          }
        }
        
        if (querPdf || querAmbos) {
          const pdf = await enviarPDFAutomatico(tema, supabase);
          if (pdf) {
            await enviarMensagemWhatsApp(
              remoteJid,
              `📚 *Preparando seu material...*\n\n*${pdf.titulo}*\n\n⏳ Enviando PDF...`,
              instanceName,
              supabase
            );
            await enviarPDFWhatsApp(remoteJid, pdf.download, pdf.titulo, instanceName);
            mensagemEnviada += mensagemEnviada ? ' e PDF enviado' : 'PDF enviado';
          }
        }
        
        if (mensagemEnviada) {
          await enviarMensagemWhatsApp(
            remoteJid,
            `✅ Pronto! ${mensagemEnviada.charAt(0).toUpperCase() + mensagemEnviada.slice(1)}! 💜\n\nPosso ajudar com mais alguma coisa?`,
            instanceName,
            supabase
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, action: 'material_confirmado', tipo: querAmbos ? 'ambos' : querVideo ? 'video' : 'pdf' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ==== PROCESSAR CLIQUE NOS BOTÕES INTERATIVOS (Aprofundar/Vídeo/Resumo/E-book) ====
    // Detectar rowId ou buttonId de ação
    const acaoMatch = conteudoLower.match(/^acao_(aprofundar|video|resumo|ebook)_(.+)$/i);
    const textoAcaoMatch = conteudoLower.match(/^(1|2|3|4|aprofundar|video|vídeo|resumo|ebook|e-book|pdf)$/i);
    
    if (acaoMatch || textoAcaoMatch) {
      let acao = '';
      let tema = '';
      
      if (acaoMatch) {
        acao = acaoMatch[1].toLowerCase();
        tema = decodeURIComponent(acaoMatch[2]);
      } else if (textoAcaoMatch) {
        const input = textoAcaoMatch[1].toLowerCase();
        
        // Mapear número ou texto para ação
        if (input === '1' || input === 'aprofundar') acao = 'aprofundar';
        else if (input === '2' || input === 'video' || input === 'vídeo') acao = 'video';
        else if (input === '3' || input === 'resumo') acao = 'resumo';
        else if (input === '4' || input === 'ebook' || input === 'e-book' || input === 'pdf') acao = 'ebook';
        
        // Buscar tema salvo na conversa
        const { data: convTema } = await supabase
          .from('evelyn_conversas')
          .select('tema_atual')
          .eq('telefone', identificador)
          .single();
        
        tema = convTema?.tema_atual || 'direito';
      }
      
      if (acao) {
        console.log(`[processar-mensagem-evelyn] Ação de botão detectada: ${acao} para tema: ${tema}`);
        
        // Buscar conversa para contexto
        const { data: conversaAcao } = await supabase
          .from('evelyn_conversas')
          .select('*')
          .eq('telefone', identificador)
          .eq('status', 'ativa')
          .single();
        
        if (conversaAcao) {
          const resultado = await processarAcaoBotao(acao, tema, remoteJid, instanceName, conversaAcao, supabase);
          
          if (resultado.processou) {
            // Formatar e enviar resposta
            const respostaFormatada = formatarParaWhatsApp(resultado.resposta);
            await enviarMensagemWhatsApp(remoteJid, respostaFormatada, instanceName, supabase);
            
            // Se for e-book, enviar o PDF
            if (resultado.pdf) {
              await enviarPDFWhatsApp(remoteJid, resultado.pdf.download, resultado.pdf.titulo, instanceName);
            }
            
            // Salvar resposta no banco
            await supabase.from('evelyn_mensagens').insert({
              conversa_id: conversaAcao.id,
              tipo: 'texto',
              conteudo: resultado.resposta,
              remetente: 'evelyn'
            });
            
            // Enviar botões de ação novamente para continuar ciclo
            setTimeout(async () => {
              await enviarBotoesAcao(remoteJid, tema, instanceName, supabase);
            }, 1000);
            
            return new Response(
              JSON.stringify({ success: true, action: `botao_${acao}`, tema }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // ==== 1. DICIONÁRIO JURÍDICO ====
    // Detectar: "definir X", "significado de X", "o que é X", "o que significa X"
    const matchDicionario = conteudoLower.match(/^(?:definir|significado de|o que [eé]|o que significa|defina|conceito de)\s+(.+)$/i);
    if (matchDicionario) {
      const termo = matchDicionario[1].trim();
      console.log(`[processar-mensagem-evelyn] Comando de dicionário detectado: ${termo}`);
      
      const definicao = await buscarDicionario(termo, supabase);
      
      if (definicao) {
        await enviarMensagemWhatsApp(remoteJid, definicao, instanceName, supabase);
        return new Response(
          JSON.stringify({ success: true, action: 'dicionario', termo }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Se não encontrou, continua para IA responder
    }

    // ==== 2. FLASHCARDS ====
    // Detectar: "flashcard", "flashcard de X", "flash card", "card"
    const matchFlashcard = conteudoLower.match(/^(?:flashcard|flash card|card|cartão)(?:\s+(?:de|sobre)\s+(.+))?$/i);
    if (matchFlashcard || conteudoLower === 'flashcard' || conteudoLower === 'flash' || conteudoLower === 'card') {
      const tema = matchFlashcard?.[1]?.trim() || null;
      console.log(`[processar-mensagem-evelyn] Comando de flashcard detectado: tema=${tema || 'aleatório'}`);
      
      const flashcard = await buscarFlashcard(tema, supabase);
      
      if (flashcard) {
        await enviarMensagemWhatsApp(remoteJid, flashcard, instanceName, supabase);
        return new Response(
          JSON.stringify({ success: true, action: 'flashcard', tema }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ==== 3. VÍDEO-AULAS ====
    // Detectar: "video X", "videoaula X", "aula de X", "vídeo sobre X"
    const matchVideo = conteudoLower.match(/^(?:video|vídeo|videoaula|video aula|aula|videos|vídeos)(?:\s+(?:de|sobre|aula)?\s*(.+))?$/i);
    if (matchVideo && matchVideo[1]) {
      const tema = matchVideo[1].trim();
      console.log(`[processar-mensagem-evelyn] Comando de vídeo-aula detectado: ${tema}`);
      
      const videos = await buscarVideoAula(tema, supabase);
      
      if (videos) {
        await enviarMensagemWhatsApp(remoteJid, videos, instanceName, supabase);
        return new Response(
          JSON.stringify({ success: true, action: 'videoaula', tema }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ==== 4. CONSULTA DE ARTIGOS/LEIS (COM NARRAÇÃO) ====
    // Detectar: "art 5 cf", "artigo 121 cp", "art. 1 cdc"
    const matchArtigoLei = conteudoLower.match(/^art(?:igo)?\.?\s*(\d+[a-z]?(?:-[a-z])?)\s+(?:d[aeo]\s+)?(\w+)$/i);
    if (matchArtigoLei) {
      const numeroArtigo = matchArtigoLei[1];
      const codigoLei = matchArtigoLei[2];
      console.log(`[processar-mensagem-evelyn] Comando de consulta de lei: Art. ${numeroArtigo} ${codigoLei}`);
      
      const artigoResult = await consultarArtigo(numeroArtigo, codigoLei, supabase);
      
      if (artigoResult) {
        // Enviar texto do artigo
        await enviarMensagemWhatsApp(remoteJid, artigoResult.texto, instanceName, supabase);
        
        // Se tiver narração, enviar o áudio
        if (artigoResult.narracaoUrl) {
          console.log(`[processar-mensagem-evelyn] Enviando narração: ${artigoResult.narracaoUrl.substring(0, 50)}...`);
          await enviarAudioWhatsApp(
            remoteJid, 
            artigoResult.narracaoUrl, 
            instanceName,
            `🎧 Narração do Art. ${numeroArtigo} - ${codigoLei.toUpperCase()}`
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            action: 'consulta_lei', 
            artigo: numeroArtigo, 
            lei: codigoLei,
            tem_narracao: !!artigoResult.narracaoUrl 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ==== 5. QUIZ OAB ====
    // Detectar: "quiz", "questão", "questao", "pergunta oab"
    if (conteudoLower === 'quiz' || conteudoLower === 'questão' || conteudoLower === 'questao' || 
        conteudoLower === 'pergunta' || conteudoLower === 'pergunta oab' || conteudoLower === 'quiz oab') {
      console.log(`[processar-mensagem-evelyn] Comando de quiz detectado`);
      
      const quiz = await buscarQuizOAB(supabase);
      
      if (quiz) {
        // Salvar questão atual na conversa para verificar resposta depois
        await supabase.from('evelyn_conversas')
          .update({ 
            quiz_atual: { questaoId: quiz.questaoId, respostaCorreta: quiz.respostaCorreta }
          })
          .eq('telefone', identificador);
        
        await enviarMensagemWhatsApp(remoteJid, quiz.pergunta, instanceName, supabase);
        return new Response(
          JSON.stringify({ success: true, action: 'quiz', questaoId: quiz.questaoId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Detectar resposta de quiz (A, B, C ou D)
    if (/^[abcd]$/i.test(conteudoLower)) {
      // Verificar se há quiz ativo
      const { data: conversaQuiz } = await supabase
        .from('evelyn_conversas')
        .select('quiz_atual')
        .eq('telefone', identificador)
        .single();
      
      if (conversaQuiz?.quiz_atual) {
        const respostaUsuario = conteudoLower.toUpperCase();
        const respostaCorreta = conversaQuiz.quiz_atual.respostaCorreta;
        const questaoId = conversaQuiz.quiz_atual.questaoId;
        
        const acertou = respostaUsuario === respostaCorreta;
        
        // Não atualizar estatísticas diretamente (evita erros de sintaxe)
        // O banco já tem as estatísticas da questão
        
        // Limpar quiz atual
        await supabase.from('evelyn_conversas')
          .update({ quiz_atual: null })
          .eq('telefone', identificador);
        
        // Buscar gabarito completo
        const gabarito = await mostrarGabaritoQuiz(questaoId, supabase);
        
        let resposta = acertou 
          ? `🎉 *PARABÉNS!* Você acertou!\n\n`
          : `😕 *Resposta incorreta!* Você respondeu ${respostaUsuario}, mas a correta era ${respostaCorreta}.\n\n`;
        
        if (gabarito) {
          resposta += gabarito;
        }
        
        await enviarMensagemWhatsApp(remoteJid, resposta, instanceName, supabase);
        return new Response(
          JSON.stringify({ success: true, action: 'quiz_resposta', acertou, respostaUsuario, respostaCorreta }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Comando "gabarito" - mostrar resposta do quiz atual
    if (conteudoLower === 'gabarito' || conteudoLower === 'resposta') {
      const { data: conversaQuiz } = await supabase
        .from('evelyn_conversas')
        .select('quiz_atual')
        .eq('telefone', identificador)
        .single();
      
      if (conversaQuiz?.quiz_atual) {
        const gabarito = await mostrarGabaritoQuiz(conversaQuiz.quiz_atual.questaoId, supabase);
        
        // Limpar quiz atual
        await supabase.from('evelyn_conversas')
          .update({ quiz_atual: null })
          .eq('telefone', identificador);
        
        if (gabarito) {
          await enviarMensagemWhatsApp(remoteJid, gabarito, instanceName, supabase);
          return new Response(
            JSON.stringify({ success: true, action: 'quiz_gabarito' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // ==== SISTEMA DE LIVROS/PDFs ====
    // Detecção melhorada de pedidos de livros/PDFs/materiais
    const pedidoLivros = [
      'livros', 'materiais', 'pdfs', 'ebooks', 'apostilas', 'apostila',
      'receber livro', 'quais livros', 'tem livros', 'tem pdf', 'tem material',
      'quero um livro', 'quero livro', 'quero pdf', 'quero material',
      'manda um livro', 'manda livro', 'manda pdf', 'manda material',
      'envia um livro', 'envia livro', 'envia pdf', 'envia material',
      'enviar livro', 'enviar pdf', 'enviar material',
      'mande um livro', 'mande livro', 'mande pdf', 'mande material',
      'me envia', 'me manda', 'pode enviar', 'pode mandar',
      'biblioteca', 'materiais de estudo', 'material de estudo',
      'ver livros', 'lista de livros', 'catalogo', 'catálogo'
    ];
    
    const isPedidoLivros = pedidoLivros.some(p => conteudoLower === p || conteudoLower.includes(p)) ||
      /quero\s+(um\s+)?(livro|pdf|material|apostila)/i.test(conteudoLower) ||
      /(manda|envia|mande|envie)\s+(um\s+)?(livro|pdf|material|apostila)/i.test(conteudoLower) ||
      /(tem|têm|possui)\s+(algum\s+)?(livro|pdf|material|apostila)/i.test(conteudoLower) ||
      /pdf\s+(de|sobre|pra|para)/i.test(conteudoLower) ||
      /livro\s+(de|sobre|pra|para)/i.test(conteudoLower);
    
    if (isPedidoLivros && !conteudoLower.match(/^livro[_\s]+\d+/)) {
      console.log('[processar-mensagem-evelyn] Pedido de livros detectado:', conteudoLower);
      const { lista } = await listarAreasLivros(supabase);
      await enviarMensagemWhatsApp(remoteJid, lista, instanceName, supabase);
      return new Response(
        JSON.stringify({ success: true, action: 'lista_areas_enviada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Comando: "livro 123" ou "livro_sim_123" - enviar PDF específico
    const matchLivroId = conteudoLower.match(/^livro[_\s]+(?:sim[_\s]+)?(\d+)$/);
    if (matchLivroId || conteudoLower.startsWith('livro_sim_')) {
      let livroId: string;
      
      if (matchLivroId) {
        livroId = matchLivroId[1];
      } else {
        livroId = conteudoLower.replace('livro_sim_', '');
      }
      
      console.log(`[processar-mensagem-evelyn] Comando de envio de livro detectado: ID=${livroId}`);
      
      const { data: livro } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('*')
        .eq('id', parseInt(livroId))
        .single();
      
      if (livro && livro.Download) {
        await enviarMensagemWhatsApp(
          remoteJid, 
          `📚 *Preparando seu material...*\n\n*${livro.Tema || 'Material de Estudo'}*\n\n⏳ Aguarde, estou enviando o PDF...`,
          instanceName, 
          supabase
        );
        
        const enviado = await enviarPDFWhatsApp(remoteJid, livro.Download, livro.Tema || 'Material', instanceName);
        
        if (enviado) {
          await enviarMensagemWhatsApp(
            remoteJid, 
            `✅ *Material enviado!*\n\n📖 *${livro.Tema}*\n\n_Bons estudos!_ 💜\n\nDigite *livros* para ver mais materiais.`,
            instanceName, 
            supabase
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, action: 'livro_enviado', livroId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        await enviarMensagemWhatsApp(
          remoteJid, 
          `❌ Não encontrei o livro com ID ${livroId}. Digite *livros* para ver os disponíveis.`,
          instanceName, 
          supabase
        );
        return new Response(
          JSON.stringify({ success: false, action: 'livro_nao_encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Detectar pedido de área específica de livros
    const areasJuridicas = [
      'direito civil', 'direito penal', 'direito constitucional', 'direito administrativo',
      'direito do trabalho', 'direito tributário', 'direito empresarial', 'direito processual',
      'direitos humanos', 'direito internacional', 'direito ambiental', 'direito eleitoral',
      'direito previdenciário', 'direito digital', 'filosofia', 'ética'
    ];
    
    for (const area of areasJuridicas) {
      if (conteudoLower.includes(area) && 
          (conteudoLower.includes('livro') || conteudoLower.includes('material') || 
           conteudoLower.includes('pdf') || conteudoLower.includes('enviar'))) {
        console.log(`[processar-mensagem-evelyn] Pedido de livros da área: ${area}`);
        const { lista } = await listarLivrosDaArea(area, supabase);
        await enviarMensagemWhatsApp(remoteJid, lista, instanceName, supabase);
        return new Response(
          JSON.stringify({ success: true, action: 'lista_livros_area', area }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }


    // ==== PROCESSAR FEEDBACK 👍/👎 ====
    // Detectar clique em botão de feedback (formato: fb_pos_uuid ou fb_neg_uuid)
    if (conteudoLower.startsWith('fb_pos_') || conteudoLower.startsWith('fb_neg_')) {
      const partes = conteudo.split('_');
      if (partes.length >= 3) {
        const tipoFb = partes[1] === 'pos' ? 'positivo' : 'negativo';
        const mensagemIdFb = partes.slice(2).join('_'); // UUID pode ter underscores
        
        console.log(`[processar-mensagem-evelyn] Feedback recebido: ${tipoFb} para mensagem ${mensagemIdFb}`);
        
        try {
          // Buscar a mensagem original para contexto
          const { data: msgOriginal } = await supabase
            .from('evelyn_mensagens')
            .select('conteudo, conversa_id')
            .eq('id', mensagemIdFb)
            .single();
          
          // Buscar a pergunta do usuário (mensagem anterior)
          let perguntaOriginal = null;
          if (msgOriginal) {
            const { data: msgAnterior } = await supabase
              .from('evelyn_mensagens')
              .select('conteudo')
              .eq('conversa_id', msgOriginal.conversa_id)
              .eq('remetente', 'usuario')
              .order('created_at', { ascending: false })
              .limit(2);
            
            if (msgAnterior && msgAnterior.length > 0) {
              perguntaOriginal = msgAnterior[msgAnterior.length - 1]?.conteudo || msgAnterior[0]?.conteudo;
            }
          }
          
          // Salvar feedback no banco
          await supabase.from('evelyn_feedback').insert({
            mensagem_id: mensagemIdFb,
            conversa_id: msgOriginal?.conversa_id,
            tipo_feedback: tipoFb,
            pergunta_original: perguntaOriginal,
            resposta_avaliada: msgOriginal?.conteudo?.substring(0, 500)
          });
          
          // Atualizar mensagem com feedback
          await supabase.from('evelyn_mensagens')
            .update({ feedback: tipoFb })
            .eq('id', mensagemIdFb);
          
          // Enviar agradecimento
          const respostaFb = tipoFb === 'positivo'
            ? "😊 *Obrigada pelo feedback!* Fico muito feliz em ajudar! Se precisar de mais alguma coisa, é só chamar! 💜"
            : "😔 *Obrigada pelo feedback!* Vou me esforçar para melhorar. Pode me dizer o que ficou faltando para eu aprender? 📝";
          
          await enviarMensagemWhatsApp(remoteJid, respostaFb, instanceName, supabase);
          
          return new Response(
            JSON.stringify({ success: true, action: 'feedback_registrado', tipo: tipoFb }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (fbError) {
          console.error('[processar-mensagem-evelyn] Erro ao processar feedback:', fbError);
        }
      }
    }
    
    // Detectar feedback por texto simples ("sim" ou "não" após resposta)
    if (conteudoLower === 'sim' || conteudoLower === 'não' || conteudoLower === 'nao') {
      // Buscar última mensagem da Evelyn sem feedback
      const { data: ultimaMsgEvelyn } = await supabase
        .from('evelyn_mensagens')
        .select('id, conteudo, conversa_id')
        .eq('remetente', 'evelyn')
        .is('feedback', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (ultimaMsgEvelyn) {
        const tipoFbTexto = conteudoLower === 'sim' ? 'positivo' : 'negativo';
        
        // Buscar pergunta anterior
        const { data: perguntaAnterior } = await supabase
          .from('evelyn_mensagens')
          .select('conteudo')
          .eq('conversa_id', ultimaMsgEvelyn.conversa_id)
          .eq('remetente', 'usuario')
          .order('created_at', { ascending: false })
          .limit(2);
        
        // Salvar feedback
        await supabase.from('evelyn_feedback').insert({
          mensagem_id: ultimaMsgEvelyn.id,
          conversa_id: ultimaMsgEvelyn.conversa_id,
          tipo_feedback: tipoFbTexto,
          pergunta_original: perguntaAnterior?.[1]?.conteudo || perguntaAnterior?.[0]?.conteudo,
          resposta_avaliada: ultimaMsgEvelyn.conteudo?.substring(0, 500)
        });
        
        await supabase.from('evelyn_mensagens')
          .update({ feedback: tipoFbTexto })
          .eq('id', ultimaMsgEvelyn.id);
        
        const respostaFbTexto = tipoFbTexto === 'positivo'
          ? "😊 *Ótimo!* Que bom que ajudei! Precisa de mais alguma coisa? 💜"
          : "😔 *Entendi!* Pode me contar mais sobre sua dúvida que vou tentar ajudar melhor! 📝";
        
        await enviarMensagemWhatsApp(remoteJid, respostaFbTexto, instanceName, supabase);
        
        return new Response(
          JSON.stringify({ success: true, action: 'feedback_texto_registrado', tipo: tipoFbTexto }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Normalizar telefone para formato padrão (55XXXXXXXXXXX)
    const telefoneNormalizado = identificador.startsWith('55') && identificador.length >= 12 
      ? identificador 
      : (identificador.length >= 10 && identificador.length <= 11 ? '55' + identificador : identificador);
    
    console.log(`[processar-mensagem-evelyn] Telefone normalizado: ${telefoneNormalizado} (original: ${identificador})`);
    
    // Buscar usuário pelo telefone normalizado
    let { data: usuario, error: userError } = await supabase
      .from('evelyn_usuarios')
      .select('*')
      .eq('telefone', telefoneNormalizado)
      .maybeSingle();

    if (userError && userError.code !== 'PGRST116') {
      console.error('[processar-mensagem-evelyn] Erro ao buscar usuário:', userError);
    }

    // Buscar foto do perfil (em paralelo, não bloqueia)
    let fotoPerfil: string | null = null;
    try {
      fotoPerfil = await buscarFotoPerfil(remoteJid, instanceName);
    } catch (e) {
      console.log('[processar-mensagem-evelyn] Erro ao buscar foto, continuando...');
    }

    let isPrimeiroContato = false;
    
    if (!usuario) {
      console.log('[processar-mensagem-evelyn] Criando novo usuário para:', telefoneNormalizado);
      isPrimeiroContato = true;
      const agora = new Date();
      const { data: novoUsuario, error: insertError } = await supabase
        .from('evelyn_usuarios')
        .insert({ 
          telefone: telefoneNormalizado, // Sempre salvar com prefixo 55
          nome: pushName || null,
          total_mensagens: 1,
          foto_perfil: fotoPerfil,
          autorizado: true, // Qualquer número pode usar a Evelyn
          nome_confirmado: false,
          data_primeiro_contato: agora.toISOString(), // Para calcular período de teste
          periodo_teste_expirado: false,
          aviso_teste_enviado: false
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('[processar-mensagem-evelyn] Erro ao criar usuário:', insertError);
        throw insertError;
      }
      usuario = novoUsuario;
    } else {
      // Verificar se é REALMENTE primeiro contato (apenas pelas primeiras mensagens)
      // NÃO considerar nome_confirmado aqui para evitar loops
      if ((usuario.total_mensagens || 0) <= 1) {
        isPrimeiroContato = true;
      }
      
      // Atualizar último contato, contador e foto (se disponível)
      const updateData: any = { 
        ultimo_contato: new Date().toISOString(),
        total_mensagens: (usuario.total_mensagens || 0) + 1
      };
      
      // Só atualiza nome se ainda não foi confirmado
      if (!usuario.nome_confirmado && pushName) {
        updateData.nome = pushName;
      }
      
      if (fotoPerfil) {
        updateData.foto_perfil = fotoPerfil;
      }
      
      await supabase
        .from('evelyn_usuarios')
        .update(updateData)
        .eq('id', usuario.id);
    }

    // ==== AUTORIZAÇÃO ABERTA ====
    // Qualquer número pode usar a Evelyn sem necessidade de cadastro prévio
    console.log(`[processar-mensagem-evelyn] Usuário ${telefoneNormalizado} autorizado automaticamente`);
    
    // ==== VERIFICAR ASSINATURA PREMIUM ====
    // Buscar profile pelo telefone e verificar subscription
    let isPremiumUser = false;
    let diasRestantes = 0;
    let planType = '';
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, telefone')
      .eq('telefone', telefoneNormalizado)
      .maybeSingle();
    
    if (profileData) {
      console.log(`[processar-mensagem-evelyn] Profile encontrado: ${profileData.id}`);
      
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('status, expiration_date, plan_type')
        .eq('user_id', profileData.id)
        .eq('status', 'authorized')
        .maybeSingle();
      
      if (subscriptionData && subscriptionData.expiration_date) {
        const expirationDate = new Date(subscriptionData.expiration_date);
        const now = new Date();
        
        if (expirationDate > now) {
          isPremiumUser = true;
          diasRestantes = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          planType = subscriptionData.plan_type || 'premium';
          console.log(`[processar-mensagem-evelyn] Usuário PREMIUM! Dias restantes: ${diasRestantes}`);
        }
      }
    }
    
    // ==== VERIFICAR PERÍODO DE TESTE (3 DIAS) ====
    // Aplica-se a novos usuários a partir de 06/01/2026 que não são Premium
    let emPeriodoTeste = false;
    let diasTesteRestantes = 0;
    let testeExpirado = false;
    
    if (!isPremiumUser && usuario.data_primeiro_contato) {
      const dataPrimeiroContato = new Date(usuario.data_primeiro_contato);
      
      // Só aplica período de teste para usuários criados após a data de corte
      if (dataPrimeiroContato >= DATA_CORTE_PERIODO_TESTE) {
        const agora = new Date();
        const diffMs = agora.getTime() - dataPrimeiroContato.getTime();
        const diasDesdeContato = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diasDesdeContato < DIAS_PERIODO_TESTE) {
          emPeriodoTeste = true;
          diasTesteRestantes = DIAS_PERIODO_TESTE - diasDesdeContato;
          console.log(`[processar-mensagem-evelyn] Usuário em período de TESTE. Dias restantes: ${diasTesteRestantes}`);
        } else {
          testeExpirado = true;
          console.log(`[processar-mensagem-evelyn] Período de teste EXPIRADO para: ${telefoneNormalizado}`);
          
          // Atualizar flag no banco se ainda não estava marcado
          if (!usuario.periodo_teste_expirado) {
            await supabase
              .from('evelyn_usuarios')
              .update({ periodo_teste_expirado: true })
              .eq('id', usuario.id);
          }
        }
      }
    }
    
    // ==== COMANDOS DE ASSINATURA (assinar, pix, premium) ====
    const conteudoLowerTrim = conteudo.toLowerCase().trim();
    const comandosAssinar = ['assinar', 'premium', 'quero assinar', 'quero ser premium', 'assinatura', 'planos'];
    const comandoPixMensal = ['pix mensal', 'mensal pix', '1', 'plano 1', 'pix 1'];
    const comandoPixVitalicio = ['pix vitalicio', 'pix vitalício', 'vitalicio pix', 'vitalício pix', '2', 'plano 2', 'pix 2'];
    
    // Detectar se está pedindo para assinar
    if (comandosAssinar.some(cmd => conteudoLowerTrim.includes(cmd) || conteudoLowerTrim === cmd)) {
      console.log('[processar-mensagem-evelyn] Comando ASSINAR detectado');
      
      const mensagemPlanos = `💎 *Planos Direito Premium*

1️⃣ *Mensal* — R$ 15,90/mês
2️⃣ *Vitalício* — R$ 89,90 _(acesso eterno — MAIS ADQUIRIDO!)_

📲 *Para pagar via PIX pelo WhatsApp:*
Digite: *pix mensal* ou *pix vitalicio*

💳 *Para pagar via Cartão:*
Acesse o app: direitopremium.com.br/assinatura

━━━━━━━━━━━━━━
_Qual plano você prefere?_ 😊`;
      
      await enviarMensagemWhatsApp(remoteJid, mensagemPlanos, instanceName, supabase);
      
      return new Response(
        JSON.stringify({ success: true, action: 'planos_enviados' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Detectar solicitação de PIX para cada plano
    let planoPix: 'mensal' | 'vitalicio' | null = null;
    
    if (comandoPixMensal.some(cmd => conteudoLowerTrim === cmd || conteudoLowerTrim.startsWith(cmd))) {
      planoPix = 'mensal';
    } else if (comandoPixVitalicio.some(cmd => conteudoLowerTrim === cmd || conteudoLowerTrim.startsWith(cmd))) {
      planoPix = 'vitalicio';
    }
    
    if (planoPix) {
      console.log(`[processar-mensagem-evelyn] Gerando PIX para plano: ${planoPix}`);
      
      // Enviar feedback de processamento
      await enviarMensagemWhatsApp(remoteJid, '⏳ Gerando seu PIX, aguarde um momento...', instanceName, supabase);
      
      try {
        // Chamar função de gerar PIX
        const { data: pixData, error: pixError } = await supabase.functions.invoke('evelyn-gerar-pix', {
          body: {
            telefone: telefoneNormalizado,
            planType: planoPix,
            nome: usuario.nome
          }
        });
        
        if (pixError || !pixData?.success) {
          console.error('[processar-mensagem-evelyn] Erro ao gerar PIX:', pixError || pixData);
          await enviarMensagemWhatsApp(remoteJid, '❌ Houve um erro ao gerar o PIX. Por favor, tente novamente ou acesse o app para assinar.', instanceName, supabase);
        } else {
          const plano = PLANS_EVELYN[planoPix];
          
          // Mensagem 1: Informações do plano
          const mensagemInfoPix = `✅ *PIX Gerado — ${plano.description}*

💰 Valor: *R$ ${plano.amount.toFixed(2).replace('.', ',')}*
⏱️ Válido por *30 minutos*

Após o pagamento, confirmarei aqui automaticamente! 🎉

_Copie o código abaixo e cole no app do seu banco:_`;
          
          await enviarMensagemWhatsApp(remoteJid, mensagemInfoPix, instanceName, supabase);
          
          // Mensagem 2: Código PIX puro (separado para facilitar cópia)
          await enviarMensagemWhatsApp(remoteJid, pixData.qrCode, instanceName, supabase);
          
          // Tentar enviar imagem do QR Code
          try {
            const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
            const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
            
            if (evolutionUrl && evolutionKey && pixData.qrCodeBase64) {
              await fetch(`${evolutionUrl}/message/sendMedia/${instanceName}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionKey,
                },
                body: JSON.stringify({
                  number: remoteJid,
                  mediatype: 'image',
                  mimetype: 'image/png',
                  caption: '📱 Escaneie o QR Code acima',
                  media: `data:image/png;base64,${pixData.qrCodeBase64}`
                }),
              });
            }
          } catch (qrError) {
            console.log('[processar-mensagem-evelyn] Erro ao enviar QR Code, código PIX já foi enviado');
          }
        }
        
        return new Response(
          JSON.stringify({ success: true, action: 'pix_gerado', planType: planoPix }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        console.error('[processar-mensagem-evelyn] Exceção ao gerar PIX:', e);
        await enviarMensagemWhatsApp(remoteJid, '❌ Erro inesperado. Por favor, tente novamente mais tarde.', instanceName, supabase);
        
        return new Response(
          JSON.stringify({ success: false, error: 'erro_gerar_pix' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // ==== BLOQUEIO PÓS-PERÍODO DE TESTE ====
    // Se teste expirou e não é Premium, bloquear respostas normais
    if (testeExpirado && !isPremiumUser) {
      console.log('[processar-mensagem-evelyn] Bloqueando resposta - período de teste expirado');
      
      // Verificar se já enviou aviso de expiração
      if (!usuario.aviso_teste_enviado) {
        // Enviar aviso de expiração pela primeira vez
        await supabase
          .from('evelyn_usuarios')
          .update({ aviso_teste_enviado: true })
          .eq('id', usuario.id);
        
        const mensagemTesteExpirado = `⏰ *Seu período de teste terminou!*

Você teve *3 dias* para experimentar todas as minhas funcionalidades gratuitamente.

Para continuar usando a Evelyn, assine o *Direito Premium*:

💎 *Planos disponíveis:*
• 1️⃣ Mensal: R$ 21,90/mês
• 2️⃣ Trimestral: R$ 49,90 _(economize 24%)_
• 3️⃣ Vitalício: R$ 179,90 _(acesso eterno)_

📲 Digite *assinar* para ver as opções de pagamento!

Ou acesse o app: direitopremium.com.br/assinatura`;
        
        await enviarMensagemWhatsApp(remoteJid, mensagemTesteExpirado, instanceName, supabase);
      } else {
        // Aviso já foi enviado, responder com mensagem curta
        const mensagemBloqueio = `Para usar a Evelyn, você precisa ser assinante Premium.

💎 Digite *assinar* para ver os planos ou acesse: direitopremium.com.br/assinatura`;
        
        await enviarMensagemWhatsApp(remoteJid, mensagemBloqueio, instanceName, supabase);
      }
      
      return new Response(
        JSON.stringify({ success: true, action: 'bloqueado_teste_expirado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Usuários em período de teste ou Premium continuam normalmente
    if (emPeriodoTeste) {
      console.log(`[processar-mensagem-evelyn] Usuário ${telefoneNormalizado} em período de teste (${diasTesteRestantes} dias restantes)`);
    }
    
    // ==== SAUDAÇÃO PREMIUM (PRIMEIRA MENSAGEM DO DIA) ====
    // Só envia saudação especial para usuários premium
    if (isPremiumUser) {
      const hoje = new Date().toISOString().split('T')[0];
      const ultimaSaudacaoPremium = usuario.ultima_saudacao_premium 
        ? new Date(usuario.ultima_saudacao_premium).toISOString().split('T')[0]
        : null;
      
      if (ultimaSaudacaoPremium !== hoje) {
        console.log('[processar-mensagem-evelyn] Enviando saudação Premium do dia');
        
        // Atualizar última saudação premium
        await supabase
          .from('evelyn_usuarios')
          .update({ ultima_saudacao_premium: new Date().toISOString() })
          .eq('id', usuario.id);
        
        const saudacao = getSaudacao();
        const mensagemPremium = `${saudacao}, ${usuario.nome || 'Premium'}! 🌟

Você é assinante *Direito Premium*! 💜

Sua assinatura está ativa por mais *${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}*.

Como posso te ajudar hoje?`;

        await enviarMensagemWhatsApp(remoteJid, mensagemPremium, instanceName, supabase);
        
        // Sempre retornar após saudação premium do dia para evitar resposta duplicada
        // A saudação premium já é a resposta completa para a primeira mensagem do dia
        return new Response(
          JSON.stringify({ success: true, action: 'saudacao_premium_enviada', diasRestantes }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // ==== FLUXO DE CONFIRMAÇÃO DE NOME ====
    // Detectar se é uma pergunta REAL (não saudação simples)
    const conteudoLowerNome = conteudo.toLowerCase().trim();
    const isPerguntaReal = conteudo.length > 25 || 
      conteudo.includes('?') || 
      /^(o que|como|qual|quando|por que|quero|preciso|me explica|me ajuda|pode me|qual a|qual o|explique|defina|artigo|lei |direito|processo|crime|penal|civil|trabalhista|constitucional)/i.test(conteudoLowerNome);
    
    // Se usuário fez pergunta real mas nome não foi confirmado, confirmar automaticamente e continuar
    if (!usuario.nome_confirmado && isPerguntaReal) {
      console.log('[processar-mensagem-evelyn] Pergunta real detectada - confirmando nome automaticamente');
      await supabase.from('evelyn_usuarios').update({ nome_confirmado: true }).eq('id', usuario.id);
      await supabase.from('evelyn_conversas').update({ aguardando_nome: false }).eq('telefone', telefoneNormalizado);
      // Continua para processar a pergunta normalmente (não retorna)
    }
    
    // Só entrar no fluxo de confirmação de nome se:
    // 1. É realmente primeiro contato (poucas mensagens)
    // 2. Nome não foi confirmado
    // 3. NÃO é uma pergunta real (é só saudação ou confirmação)
    if (isPrimeiroContato && !usuario.nome_confirmado && !isPerguntaReal && (usuario.total_mensagens || 0) <= 3) {
      console.log('[processar-mensagem-evelyn] Primeiro contato - verificando confirmação de nome');
      
      // Verificar se já está aguardando confirmação de nome
      const { data: conversaAtual } = await supabase
        .from('evelyn_conversas')
        .select('aguardando_nome')
        .eq('telefone', telefoneNormalizado)
        .eq('status', 'ativa')
        .maybeSingle();
      
      if (conversaAtual?.aguardando_nome) {
        // Processar resposta do usuário sobre o nome
        const mensagemLower = conteudo.toLowerCase().trim();
        const respostasAfirmativas = ['sim', 's', 'isso', 'pode', 'tá bom', 'ok', 'ta bom', 'beleza', 'certo', 'correto', 'exato', 'isso mesmo', 'pode sim', 'yes', 'claro'];
        const respostasNegativas = ['não', 'nao', 'n', 'errado', 'nope', 'negativo'];
        
        // IMPORTANTE: Usar match EXATO para confirmações, não includes()
        const isAfirmativo = respostasAfirmativas.some(r => mensagemLower === r);
        const isNegativo = respostasNegativas.some(r => mensagemLower === r || mensagemLower.startsWith(r + ' ') || mensagemLower.startsWith(r + ','));
        
        if (isAfirmativo && !isNegativo) {
          // Confirmou o nome - salvar e desmarcar aguardando_nome
          console.log(`[processar-mensagem-evelyn] Nome confirmado: ${usuario.nome}`);
          
          await supabase.from('evelyn_usuarios').update({ nome_confirmado: true }).eq('id', usuario.id);
          await supabase.from('evelyn_conversas').update({ aguardando_nome: false }).eq('telefone', telefoneNormalizado);
          
          const respostaConfirmacao = `✨ *Perfeito, ${usuario.nome}!* 

Agora estamos oficialmente conectados! 💜

${MENSAGEM_NOVIDADES}`;
          
          await enviarMensagemWhatsApp(remoteJid, respostaConfirmacao, instanceName, supabase);
          
          return new Response(
            JSON.stringify({ success: true, action: 'nome_confirmado', nome: usuario.nome }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (isNegativo) {
          // Negou o nome - pedir o nome correto
          console.log('[processar-mensagem-evelyn] Usuário negou o nome, pedindo correção');
          
          const pedidoNome = `📝 *Sem problemas!* Como você gostaria que eu te chamasse? 

_Pode me dizer seu nome ou apelido_ 😊`;
          
          await enviarMensagemWhatsApp(remoteJid, pedidoNome, instanceName, supabase);
          
          return new Response(
            JSON.stringify({ success: true, action: 'aguardando_novo_nome' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Resposta que parece ser o nome correto
          // Extrair possível nome da mensagem (primeira palavra ou frase curta)
          const possibleName = conteudo.trim().split(/[\s,]+/)[0];
          
          if (possibleName && possibleName.length >= 2 && possibleName.length <= 30 && /^[a-zA-ZÀ-ÿ]+$/.test(possibleName)) {
            // Parece um nome válido - salvar
            const nomeCapitalizado = possibleName.charAt(0).toUpperCase() + possibleName.slice(1).toLowerCase();
            
            console.log(`[processar-mensagem-evelyn] Novo nome capturado: ${nomeCapitalizado}`);
            
            await supabase.from('evelyn_usuarios').update({ 
              nome: nomeCapitalizado, 
              nome_confirmado: true 
            }).eq('id', usuario.id);
            await supabase.from('evelyn_conversas').update({ aguardando_nome: false }).eq('telefone', telefoneNormalizado);
            
            const respostaNovoNome = `✨ *Prazer em conhecer você, ${nomeCapitalizado}!* 

Agora estamos oficialmente conectados! 💜

${MENSAGEM_NOVIDADES}`;
            
            await enviarMensagemWhatsApp(remoteJid, respostaNovoNome, instanceName, supabase);
            
            return new Response(
              JSON.stringify({ success: true, action: 'novo_nome_salvo', nome: nomeCapitalizado }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // Não parece nome, perguntar de novo
          const pedidoClarificacao = `🤔 Não consegui entender... Qual nome você gostaria que eu usasse para te chamar?`;
          
          await enviarMensagemWhatsApp(remoteJid, pedidoClarificacao, instanceName, supabase);
          
          return new Response(
            JSON.stringify({ success: true, action: 'aguardando_clarificacao_nome' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Primeiro contato - perguntar se o nome está correto
      if (usuario.nome && !usuario.nome_confirmado) {
        console.log(`[processar-mensagem-evelyn] Perguntando confirmação do nome: ${usuario.nome}`);
        
        // Criar ou atualizar conversa marcando aguardando_nome
        const { data: conversaExistente } = await supabase
          .from('evelyn_conversas')
          .select('id')
          .eq('telefone', telefoneNormalizado)
          .eq('status', 'ativa')
          .maybeSingle();
        
        if (conversaExistente) {
          await supabase.from('evelyn_conversas').update({ aguardando_nome: true }).eq('id', conversaExistente.id);
        } else {
          await supabase.from('evelyn_conversas').insert({
            telefone: telefoneNormalizado,
            usuario_id: usuario.id,
            contexto: [],
            instance_name: instanceName,
            remote_jid: remoteJid,
            aguardando_nome: true
          });
        }
        
        const perguntaNome = `👋 *Olá!* Bem-vindo(a) à Evelyn!

Antes de começarmos, só quero confirmar: *seu nome é ${usuario.nome}*? 

Posso te chamar assim? 😊
_(Responda "sim" ou me diga como prefere ser chamado(a))_`;
        
        await enviarMensagemWhatsApp(remoteJid, perguntaNome, instanceName, supabase);
        
        return new Response(
          JSON.stringify({ success: true, action: 'aguardando_confirmacao_nome', nome_atual: usuario.nome }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (!usuario.nome) {
        // Não tem nome - perguntar diretamente
        console.log('[processar-mensagem-evelyn] Usuário sem nome, perguntando...');
        
        // Criar ou atualizar conversa
        const { data: conversaExistente } = await supabase
          .from('evelyn_conversas')
          .select('id')
          .eq('telefone', telefoneNormalizado)
          .eq('status', 'ativa')
          .maybeSingle();
        
        if (conversaExistente) {
          await supabase.from('evelyn_conversas').update({ aguardando_nome: true }).eq('id', conversaExistente.id);
        } else {
          await supabase.from('evelyn_conversas').insert({
            telefone: telefoneNormalizado,
            usuario_id: usuario.id,
            contexto: [],
            instance_name: instanceName,
            remote_jid: remoteJid,
            aguardando_nome: true
          });
        }
        
        const pedidoNome = `👋 *Olá!* Bem-vindo(a) à Evelyn! 

Sou sua assistente jurídica inteligente. 

📝 *Como posso te chamar?*
_Me diz seu nome ou apelido_ 😊`;
        
        await enviarMensagemWhatsApp(remoteJid, pedidoNome, instanceName, supabase);
        
        return new Response(
          JSON.stringify({ success: true, action: 'aguardando_nome' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Buscar ou criar conversa (usando telefone normalizado)
    let { data: conversa, error: convError } = await supabase
      .from('evelyn_conversas')
      .select('*')
      .eq('telefone', telefoneNormalizado)
      .eq('status', 'ativa')
      .single();

    if (convError && convError.code !== 'PGRST116') {
      console.error('[processar-mensagem-evelyn] Erro ao buscar conversa:', convError);
    }

    if (!conversa) {
      console.log('[processar-mensagem-evelyn] Criando nova conversa para:', telefoneNormalizado);
      const { data: novaConversa, error: insertConvError } = await supabase
        .from('evelyn_conversas')
        .insert({ 
          telefone: telefoneNormalizado,
          usuario_id: usuario.id, 
          contexto: [],
          instance_name: instanceName,
          remote_jid: remoteJid
        })
        .select()
        .single();
      
      if (insertConvError) {
        console.error('[processar-mensagem-evelyn] Erro ao criar conversa:', insertConvError);
        throw insertConvError;
      }
      conversa = novaConversa;
    } else {
      // Atualizar remote_jid caso tenha mudado
      if (conversa.remote_jid !== remoteJid) {
        await supabase
          .from('evelyn_conversas')
          .update({ remote_jid: remoteJid })
          .eq('id', conversa.id);
      }
    }

    // Salvar mensagem do usuário
    const { error: msgError } = await supabase.from('evelyn_mensagens').insert({
      conversa_id: conversa.id,
      tipo,
      conteudo,
      remetente: 'usuario',
      metadata: metadata || null
    });

    if (msgError) {
      console.error('[processar-mensagem-evelyn] Erro ao salvar mensagem:', msgError);
    }

    // ==== COMANDO: GERAR PDF DA RESPOSTA ANTERIOR ====
    const pedidosPDFResposta = [
      'me envia em pdf', 'me manda em pdf', 'envia em pdf', 'manda em pdf',
      'gera um pdf', 'gerar pdf', 'faz um pdf', 'fazer pdf',
      'quero em pdf', 'preciso em pdf', 'pdf disso', 'pdf dessa resposta',
      'transforma em pdf', 'converte em pdf', 'me envia pdf', 'manda pdf',
      'envia pdf', 'pdf da resposta', 'gera pdf', 'manda o pdf',
      'quero um pdf', 'me faz um pdf', 'faz pdf', 'criar pdf',
      'gerar um pdf', 'exportar pdf', 'baixar pdf', 'salvar em pdf'
    ];

    const conteudoLowerPDF = conteudo.toLowerCase().trim();
    const isPedidoPDFResposta = pedidosPDFResposta.some(p => 
      conteudoLowerPDF === p || conteudoLowerPDF.includes(p)
    );

    if (isPedidoPDFResposta) {
      console.log('[processar-mensagem-evelyn] Pedido de PDF da resposta detectado');
      
      // Buscar última resposta da Evelyn
      const { data: ultimaResposta } = await supabase
        .from('evelyn_mensagens')
        .select('conteudo, created_at')
        .eq('conversa_id', conversa.id)
        .eq('remetente', 'evelyn')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (ultimaResposta && ultimaResposta.conteudo) {
        // Enviar feedback
        await enviarMensagemWhatsApp(
          remoteJid,
          '📝 *Gerando seu PDF...*\n\nAguarde um momento! ⏳',
          instanceName,
          supabase
        );
        
        // Gerar PDF via edge function
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        
        try {
          const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/exportar-pdf-abnt`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              content: ultimaResposta.conteudo,
              titulo: 'Resposta Evelyn - Direito Premium',
              autor: usuario?.nome || 'Usuário',
              instituicao: 'Direito Premium',
              local: 'Brasil',
              ano: new Date().getFullYear().toString()
            })
          });
          
          const pdfData = await pdfResponse.json();
          console.log('[processar-mensagem-evelyn] PDF gerado:', pdfData);
          
          if (pdfData.pdfUrl) {
            // Enviar PDF via WhatsApp
            const enviado = await enviarPDFWhatsApp(
              remoteJid, 
              pdfData.pdfUrl, 
              'Resposta Evelyn - Direito Premium', 
              instanceName
            );
            
            if (enviado) {
              await enviarMensagemWhatsApp(
                remoteJid,
                '✅ *PDF enviado!*\n\n📄 Seu documento está pronto.\n\n_Bons estudos!_ 💜',
                instanceName,
                supabase
              );
            } else {
              // Fallback: enviar link
              await enviarMensagemWhatsApp(
                remoteJid,
                `📄 *Seu PDF está pronto!*\n\n📥 *Link para download:*\n${pdfData.pdfUrl}\n\n_O link expira em 24 horas._`,
                instanceName,
                supabase
              );
            }
          } else {
            await enviarMensagemWhatsApp(
              remoteJid,
              '😔 *Ops!* Não consegui gerar o PDF no momento. Tente novamente em alguns segundos.',
              instanceName,
              supabase
            );
          }
        } catch (pdfError) {
          console.error('[processar-mensagem-evelyn] Erro ao gerar PDF:', pdfError);
          await enviarMensagemWhatsApp(
            remoteJid,
            '😔 *Ops!* Ocorreu um erro ao gerar o PDF. Tente novamente em alguns instantes.',
            instanceName,
            supabase
          );
        }
        
        return new Response(
          JSON.stringify({ success: true, action: 'pdf_resposta_enviado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        await enviarMensagemWhatsApp(
          remoteJid,
          '🤔 *Não encontrei uma resposta anterior para converter em PDF.*\n\nMe faça uma pergunta primeiro e depois peça o PDF! 📝',
          instanceName,
          supabase
        );
        
        return new Response(
          JSON.stringify({ success: false, action: 'pdf_sem_resposta_anterior' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Processar mídia ou texto
    let resposta = '';
    let mensagemUsuario = conteudo;
    let processouMidia = false;
    
    if (tipo === 'audio' || tipo === 'imagem' || tipo === 'documento' || tipo === 'video') {
      console.log(`[processar-mensagem-evelyn] Processando mídia tipo: ${tipo}`);
      
      // ==== FEEDBACK DE ÁUDIO INTERATIVO ====
      // Enviar mensagem de feedback ANTES de processar o áudio (apenas uma vez)
      if (tipo === 'audio' && feedbackAudioInterativo) {
        try {
          console.log('[processar-mensagem-evelyn] Enviando feedback de áudio...');
          // Marcador para evitar resposta duplicada depois
          await enviarMensagemWhatsApp(
            remoteJid,
            '🎧 Ouvindo seu áudio...',
            instanceName,
            supabase
          );
        } catch (feedbackAudioError) {
          console.error('[processar-mensagem-evelyn] Erro ao enviar feedback de áudio:', feedbackAudioError);
        }
      }
      
      // Baixar mídia da Evolution API
      const convertToMp4 = tipo === 'audio'; // Converter áudio para formato compatível
      const base64Midia = await baixarMidiaEvolution(messageKey, instanceName, convertToMp4);
      
      if (base64Midia) {
        try {
          // Determinar mimeType
          let mimeType = metadata?.mimetype || 'application/octet-stream';
          
          // Ajustar mimeType para formatos suportados pelo Gemini
          if (tipo === 'audio') {
            // Gemini suporta: audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac
            if (mimeType.includes('ogg') || mimeType.includes('opus')) {
              mimeType = 'audio/ogg';
            } else if (mimeType.includes('mp4') || mimeType.includes('m4a')) {
              mimeType = 'audio/mp4';
            }
          } else if (tipo === 'imagem') {
            if (!mimeType.startsWith('image/')) {
              mimeType = 'image/jpeg';
            }
          } else if (tipo === 'documento') {
            if (mimeType.includes('pdf')) {
              mimeType = 'application/pdf';
            }
          }
          
          // Contexto adicional (legenda ou nome do arquivo)
          const contexto = tipo === 'imagem' ? metadata?.caption : metadata?.fileName;
          
          console.log(`[processar-mensagem-evelyn] Enviando para Gemini: mimeType=${mimeType}, contexto=${contexto}`);
          
          resposta = await processarMidiaGemini(base64Midia, mimeType, tipo, contexto);
          processouMidia = true;
          
          // Extrair transcrição do áudio se presente na resposta
          let transcricaoAudio = null;
          if (tipo === 'audio') {
            // A resposta do Gemini para áudio começa com a transcrição entre aspas
            const matchTranscricao = resposta.match(/^[""](.+?)[""]|^"(.+?)"/s);
            if (matchTranscricao) {
              transcricaoAudio = matchTranscricao[1] || matchTranscricao[2];
            }
          }
          
          // Atualizar mensagem do usuário com transcrição para salvar no banco
          if (tipo === 'audio' && transcricaoAudio) {
            // Atualizar a mensagem do áudio com a transcrição no metadata
            await supabase.from('evelyn_mensagens')
              .update({ 
                metadata: { ...metadata, transcricao: transcricaoAudio }
              })
              .eq('conversa_id', conversa.id)
              .eq('remetente', 'usuario')
              .order('created_at', { ascending: false })
              .limit(1);
            
            mensagemUsuario = `[Áudio transcrito: "${transcricaoAudio.substring(0, 100)}..."]`;
          } else if (tipo === 'audio') {
            mensagemUsuario = '[Áudio transcrito e respondido pela IA]';
          } else if (tipo === 'imagem') {
            mensagemUsuario = `[Imagem analisada${metadata?.caption ? ` - legenda: "${metadata.caption}"` : ''}]`;
          } else if (tipo === 'documento') {
            mensagemUsuario = `[Documento analisado: ${metadata?.fileName || 'arquivo'}]`;
          } else if (tipo === 'video') {
            mensagemUsuario = '[Vídeo analisado]';
          }
          
          console.log('[processar-mensagem-evelyn] Mídia processada com sucesso');
        } catch (e) {
          console.error('[processar-mensagem-evelyn] Erro ao processar mídia com Gemini:', e);
          mensagemUsuario = `[Erro ao processar ${tipo}: ${e instanceof Error ? e.message : 'erro desconhecido'}]`;
        }
      } else {
        console.error('[processar-mensagem-evelyn] Não foi possível baixar a mídia');
        mensagemUsuario = `[Não foi possível baixar o ${tipo} enviado pelo usuário]`;
      }
    }
    
    // Se não processou mídia, usar fluxo normal com Gemini text
    if (!processouMidia) {
      // Buscar artigos relevantes (RAG)
      const contextoRAG = await buscarArtigosRelevantes(mensagemUsuario, supabase);
      
      // Obter data atual para contexto
      const dataAtual = getDataAtual();
      
      // ==== BUSCAR HISTÓRICO DE CONVERSAS ANTERIORES ====
      let historicoFormatado = '';
      try {
        const { data: historicoMensagens } = await supabase
          .from('evelyn_mensagens')
          .select('remetente, conteudo, tipo, created_at')
          .eq('conversa_id', conversa.id)
          .order('created_at', { ascending: false })
          .limit(15);

        if (historicoMensagens && historicoMensagens.length > 0) {
          historicoFormatado = historicoMensagens
            .reverse()
            .map(m => {
              const nome = m.remetente === 'usuario' ? (usuario.nome || 'Usuário') : 'Evelyn';
              const conteudoResumido = m.conteudo.length > 200 ? m.conteudo.substring(0, 200) + '...' : m.conteudo;
              return `${nome}: ${conteudoResumido}`;
            })
            .join('\n');
          console.log('[processar-mensagem-evelyn] Histórico carregado:', historicoMensagens.length, 'mensagens');
        }
      } catch (histError) {
        console.error('[processar-mensagem-evelyn] Erro ao buscar histórico:', histError);
      }
      
      // Montar prompt final com personalizações
      let systemPrompt = SYSTEM_PROMPT_BASE;
      systemPrompt += `\n\nDATA E HORA ATUAIS: ${dataAtual}`;
      
      // Adicionar nome do usuário se disponível
      if (usuario.nome) {
        systemPrompt += `\n\nO nome do usuário é: ${usuario.nome}. Use o nome dele nas respostas quando apropriado.`;
      }
      
      // Adicionar histórico da conversa
      if (historicoFormatado) {
        systemPrompt += `\n\n==== HISTÓRICO DA CONVERSA (use para contexto) ====\n${historicoFormatado}\n==== FIM DO HISTÓRICO ====\n\nUse esse histórico para dar respostas contextualizadas. O usuário pode referir-se a assuntos anteriores.`;
      }
      
      if (promptPersonalizado) {
        systemPrompt += `\n\nINSTRUÇÕES ADICIONAIS DO ADMINISTRADOR:\n${promptPersonalizado}`;
      }
      if (contextoRAG) {
        systemPrompt += `\n\n${contextoRAG}`;
      }
      
      // Preparar contexto para Gemini
      const contextoAtual = conversa.contexto || [];
      const mensagensGemini = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: welcomeMessage }] },
        ...contextoAtual.slice(-10),
        { role: 'user', parts: [{ text: mensagemUsuario }] }
      ];

      console.log('[processar-mensagem-evelyn] Chamando Gemini (texto) com RAG, histórico, data atual e prompt personalizado...');
      
      // Chamar Gemini
      resposta = await chamarGemini(mensagensGemini);
    }
    
    console.log('[processar-mensagem-evelyn] Resposta Gemini:', resposta.substring(0, 200) + '...');

    // ==== ENVIAR ANIMAÇÃO "DIGITANDO" ANTES DA RESPOSTA ====
    await enviarDigitando(remoteJid, instanceName);

    // ==== PROCESSAR AÇÕES DA IA (enviar vídeo/PDF automaticamente) ====
    const { processou: processouAcao, mensagemFinal } = await processarAcaoIA(
      resposta, 
      remoteJid, 
      instanceName, 
      identificador,
      supabase
    );
    
    // Usar mensagem processada (com material enviado) ou original
    const respostaFinal = mensagemFinal;
    console.log(`[processar-mensagem-evelyn] Ação processada: ${processouAcao}, mensagem: ${respostaFinal.substring(0, 100)}...`);

    // Salvar resposta da Evelyn e capturar ID para feedback
    const { data: mensagemEvelyn, error: msgEvelynError } = await supabase.from('evelyn_mensagens').insert({
      conversa_id: conversa.id,
      tipo: 'texto',
      conteudo: respostaFinal,
      remetente: 'evelyn'
    }).select('id').single();

    if (msgEvelynError) {
      console.error('[processar-mensagem-evelyn] Erro ao salvar mensagem da Evelyn:', msgEvelynError);
    }

    // Atualizar contexto
    const contextoAtualFinal = conversa.contexto || [];
    const novoContexto = [
      ...contextoAtualFinal.slice(-10),
      { role: 'user', parts: [{ text: mensagemUsuario }] },
      { role: 'model', parts: [{ text: respostaFinal }] }
    ];

    // ==== EXTRAIR E SALVAR TEMA ATUAL PARA BOTÕES ====
    const temaAtual = extrairTemaDaConversa(mensagemUsuario, respostaFinal);
    console.log(`[processar-mensagem-evelyn] Tema extraído: ${temaAtual}`);

    await supabase
      .from('evelyn_conversas')
      .update({ 
        contexto: novoContexto, 
        tema_atual: temaAtual,
        updated_at: new Date().toISOString() 
      })
      .eq('id', conversa.id);

    // Formatar resposta para WhatsApp
    let respostaFormatada = formatarParaWhatsApp(respostaFinal);
    
    // v7.1 - Adicionar convite para áudio APENAS na primeira mensagem (nome já confirmado)
    // Verificar se é realmente a primeira interação substantiva (não o fluxo de nome)
    const { count: totalMensagensConversa } = await supabase
      .from('evelyn_mensagens')
      .select('*', { count: 'exact', head: true })
      .eq('conversa_id', conversa.id)
      .eq('remetente', 'evelyn');
    
    // Só adiciona convite na PRIMEIRA resposta substantiva da Evelyn (após confirmar nome)
    if (totalMensagensConversa === 0 || totalMensagensConversa === 1) {
      respostaFormatada += '\n\n---\n\n_Se você se sentir à vontade, pode me mandar áudio._ 🎙️';
      console.log('[processar-mensagem-evelyn] v7.1 - Primeira resposta: convite para áudio adicionado');
    }
    
    await enviarMensagemWhatsApp(remoteJid, respostaFormatada, instanceName, supabase);

    // v7.0 - Removido envio de botões/menus - respostas naturais apenas
    console.log('[processar-mensagem-evelyn] v7.0 - Resposta natural enviada (sem menus/botões)');

    return new Response(
      JSON.stringify({ success: true, resposta, mensagemId: mensagemEvelyn?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[processar-mensagem-evelyn] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
