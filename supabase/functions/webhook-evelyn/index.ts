import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Versão 3.0 - Deduplicação de mensagens + correções
const VERSION = "3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache para evitar processamento duplicado de mensagens
const processedMessages = new Map<string, number>();
const MESSAGE_DEDUP_WINDOW_MS = 10000; // 10 segundos

// Limpar cache periodicamente
function cleanupCache() {
  const now = Date.now();
  for (const [key, timestamp] of processedMessages.entries()) {
    if (now - timestamp > MESSAGE_DEDUP_WINDOW_MS) {
      processedMessages.delete(key);
    }
  }
}

serve(async (req) => {
  console.log(`[webhook-evelyn v${VERSION}] Requisição recebida: ${req.method}`);
  
  // Limpar cache de mensagens antigas
  cleanupCache();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('[webhook-evelyn] Evento recebido:', payload.event);

    // Verificar se é mensagem recebida
    if (payload.event !== 'messages.upsert') {
      console.log('[webhook-evelyn] Evento ignorado:', payload.event);
      return new Response(JSON.stringify({ ok: true, ignored: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const message = payload.data;
    if (!message || !message.key) {
      console.log('[webhook-evelyn] Mensagem sem key, ignorando');
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const remoteJid = message.key.remoteJid || '';
    const messageId = message.key.id || '';
    const isFromMe = message.key.fromMe;
    const isGroup = remoteJid.endsWith('@g.us');
    const isNewsletter = remoteJid.includes('@newsletter');
    const isBroadcast = remoteJid.includes('@broadcast');
    const isLid = remoteJid.endsWith('@lid');
    
    // ==== DEDUPLICAÇÃO DE MENSAGENS ====
    // Criar chave única: remoteJid + messageId
    const dedupKey = `${remoteJid}:${messageId}`;
    
    if (processedMessages.has(dedupKey)) {
      console.log(`[webhook-evelyn] Mensagem duplicada ignorada: ${dedupKey}`);
      return new Response(JSON.stringify({ ok: true, duplicate: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Marcar mensagem como processada
    processedMessages.set(dedupKey, Date.now());
    console.log(`[webhook-evelyn] Mensagem registrada para dedup: ${dedupKey}`);
    
    console.log(`[webhook-evelyn] remoteJid: ${remoteJid}, isLid: ${isLid}`);

    // Ignorar mensagens enviadas por nós, de grupos, newsletters ou broadcasts
    if (isFromMe || isGroup || isNewsletter || isBroadcast) {
      console.log('[webhook-evelyn] Mensagem própria, grupo, newsletter ou broadcast, ignorando');
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Processar diferentes tipos de mensagem
    let tipo = 'texto';
    let conteudo = '';
    let metadata: Record<string, any> = {};

    if (message.message?.conversation) {
      tipo = 'texto';
      conteudo = message.message.conversation;
    } else if (message.message?.extendedTextMessage) {
      tipo = 'texto';
      conteudo = message.message.extendedTextMessage.text;
    } else if (message.message?.audioMessage) {
      tipo = 'audio';
      conteudo = message.message.audioMessage.url || '';
      metadata = {
        mimetype: message.message.audioMessage.mimetype,
        seconds: message.message.audioMessage.seconds,
        ptt: message.message.audioMessage.ptt,
      };
    } else if (message.message?.documentMessage) {
      tipo = 'documento';
      conteudo = message.message.documentMessage.url || '';
      metadata = {
        mimetype: message.message.documentMessage.mimetype,
        fileName: message.message.documentMessage.fileName,
        pageCount: message.message.documentMessage.pageCount,
      };
    } else if (message.message?.imageMessage) {
      tipo = 'imagem';
      conteudo = message.message.imageMessage.url || '';
      metadata = {
        mimetype: message.message.imageMessage.mimetype,
        caption: message.message.imageMessage.caption,
      };
    } else if (message.message?.videoMessage) {
      tipo = 'video';
      conteudo = message.message.videoMessage.url || '';
      metadata = {
        mimetype: message.message.videoMessage.mimetype,
        seconds: message.message.videoMessage.seconds,
      };
    } else {
      console.log('[webhook-evelyn] Tipo de mensagem não suportado:', JSON.stringify(message.message));
      return new Response(JSON.stringify({ ok: true, unsupported: true }), { headers: corsHeaders });
    }

    console.log(`[webhook-evelyn] Processando: tipo=${tipo}, remoteJid=${remoteJid}, conteudo=${conteudo.substring(0, 100)}...`);

    // Chamar função de processamento
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.functions.invoke('processar-mensagem-evelyn', {
      body: { 
        remoteJid,  // Passar o remoteJid completo (pode ser LID ou JID)
        tipo, 
        conteudo,
        metadata,
        instanceName: payload.instance,
        messageId: message.key.id,
        messageKey: message.key, // Chave completa para baixar mídia
        pushName: message.pushName || null,
      }
    });

    if (error) {
      console.error('[webhook-evelyn] Erro ao invocar processar-mensagem-evelyn:', error);
      throw error;
    }

    console.log('[webhook-evelyn] Mensagem processada com sucesso:', data);

    return new Response(JSON.stringify({ ok: true, processado: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[webhook-evelyn] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
