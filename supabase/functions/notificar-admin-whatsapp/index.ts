import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_PHONE = '5511991897603';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, dados } = await req.json();
    console.log('Notificação admin:', tipo, dados);

    if (!tipo || !dados) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios: tipo, dados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionKey = Deno.env.get('EVOLUTION_API_KEY');
    const instanceName = Deno.env.get('EVOLUTION_INSTANCE_NAME') || 'direitopremium';

    if (!evolutionUrl || !evolutionKey) {
      throw new Error('Evolution API não configurada');
    }

    let mensagem = '';

    if (tipo === 'novo_cadastro') {
      // Novo usuário cadastrado no app
      const { nome, email, telefone, dispositivo, area, created_at, device_info } = dados;
      const dataHora = new Date(created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      // Verificar se temos device_info detalhado
      if (device_info && typeof device_info === 'object') {
        // Usar informações detalhadas do dispositivo
        const {
          os = 'Desconhecido',
          os_version = '',
          device_name = 'Desconhecido',
          browser = 'Desconhecido',
          browser_version = '',
          screen_width = 0,
          screen_height = 0,
          language = 'pt-BR',
          connection_type = null,
        } = device_info;
        
        // Determinar emoji baseado no OS
        let osEmoji = '📱';
        const osLower = os.toLowerCase();
        if (osLower.includes('ios') || osLower.includes('ipad')) {
          osEmoji = '🍎';
        } else if (osLower.includes('android')) {
          osEmoji = '🤖';
        } else if (osLower.includes('windows')) {
          osEmoji = '🪟';
        } else if (osLower.includes('mac')) {
          osEmoji = '🍎';
        } else if (osLower.includes('linux')) {
          osEmoji = '🐧';
        }
        
        // Mapear área/perfil para nome amigável
        let areaLabel = 'Não informado';
        if (area) {
          const areaLower = area.toLowerCase();
          if (areaLower.includes('estudante')) {
            areaLabel = '📚 Estudante';
          } else if (areaLower.includes('concurseiro')) {
            areaLabel = '🎯 Concurseiro';
          } else if (areaLower.includes('advogado')) {
            areaLabel = '⚖️ Advogado';
          } else {
            areaLabel = area;
          }
        }
        
        // Montar mensagem detalhada
        let dispositivoDetalhado = `   • Sistema: ${osEmoji} ${os}`;
        if (os_version) {
          dispositivoDetalhado += ` ${os_version}`;
        }
        dispositivoDetalhado += `\n   • Modelo: ${device_name}`;
        dispositivoDetalhado += `\n   • Navegador: ${browser}`;
        if (browser_version) {
          dispositivoDetalhado += ` ${browser_version}`;
        }
        if (screen_width && screen_height) {
          dispositivoDetalhado += `\n   • Tela: ${screen_width}x${screen_height}`;
        }
        if (connection_type) {
          const connectionLabels: Record<string, string> = {
            'slow-2g': '2G Lento',
            '2g': '2G',
            '3g': '3G',
            '4g': '4G/LTE',
            'wifi': 'WiFi',
          };
          dispositivoDetalhado += `\n   • Conexão: ${connectionLabels[connection_type] || connection_type.toUpperCase()}`;
        }
        if (language) {
          dispositivoDetalhado += `\n   • Idioma: ${language}`;
        }
        
        mensagem = `📱 *Novo Cadastro no App*

👤 *Nome:* ${nome || 'Não informado'}
📧 *E-mail:* ${email}
📞 *Telefone:* ${telefone || 'Não informado'}
🎓 *Área:* ${areaLabel}

📲 *Dispositivo:*
${dispositivoDetalhado}

🕐 *Data/Hora:* ${dataHora}`;
        
      } else {
        // Fallback: usar campo dispositivo simples (legado)
        let dispositivoLabel = '❓ Desconhecido';
        if (dispositivo) {
          const d = dispositivo.toLowerCase();
          if (d.includes('iphone') || d.includes('ios')) {
            dispositivoLabel = '🍎 iPhone';
          } else if (d.includes('android')) {
            dispositivoLabel = '🤖 Android';
          } else if (d.includes('windows') || d.includes('mac') || d.includes('linux') || d.includes('desktop')) {
            dispositivoLabel = '💻 Computador';
          } else {
            dispositivoLabel = `📱 ${dispositivo}`;
          }
        }
        
        // Mapear área/perfil para nome amigável
        let areaLabel = 'Não informado';
        if (area) {
          const areaLower = area.toLowerCase();
          if (areaLower.includes('estudante')) {
            areaLabel = '📚 Estudante';
          } else if (areaLower.includes('concurseiro')) {
            areaLabel = '🎯 Concurseiro';
          } else if (areaLower.includes('advogado')) {
            areaLabel = '⚖️ Advogado';
          } else {
            areaLabel = area;
          }
        }
        
        mensagem = `📱 *Novo Cadastro no App*

👤 *Nome:* ${nome || 'Não informado'}
📧 *E-mail:* ${email}
📞 *Telefone:* ${telefone || 'Não informado'}
📲 *Dispositivo:* ${dispositivoLabel}
🎓 *Área:* ${areaLabel}
🕐 *Data/Hora:* ${dataHora}`;
      }

    } else if (tipo === 'novo_premium') {
      // Usuário se tornou premium
      const { nome, email, plano, valor, tempo_ate_conversao, created_at } = dados;
      const dataHora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      
      mensagem = `💎 *Novo Premium!*

👤 *Nome:* ${nome || 'Não informado'}
📧 *E-mail:* ${email}
📦 *Plano:* ${plano}
💰 *Valor:* R$ ${valor?.toFixed(2) || '0.00'}
⏱️ *Tempo até conversão:* ${tempo_ate_conversao}
🕐 *Data/Hora:* ${dataHora}`;

    } else {
      return new Response(
        JSON.stringify({ error: 'Tipo de notificação desconhecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar via Evolution API para o admin
    const response = await fetch(`${evolutionUrl}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionKey,
      },
      body: JSON.stringify({
        number: `${ADMIN_PHONE}@s.whatsapp.net`,
        text: mensagem,
      }),
    });

    const result = await response.json();
    console.log('Resultado envio admin:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao enviar mensagem para admin');
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.key?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro notificação admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
