import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para criar JWT assinado com RS256
async function createSignedJWT(serviceAccount: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };
  
  // Codificar header e payload
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  // Importar chave privada
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Assinar
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  );
  
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${signatureInput}.${signatureB64}`;
}

// Obter access token OAuth2
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwt = await createSignedJWT(serviceAccount);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erro ao obter access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Enviar notificação para um token
async function sendToToken(
  accessToken: string,
  projectId: string,
  token: string,
  notification: { titulo: string; mensagem: string; link?: string; imagem_url?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: notification.titulo,
              body: notification.mensagem,
              image: notification.imagem_url || undefined
            },
            data: {
              link: notification.link || '/',
              timestamp: new Date().toISOString()
            },
            webpush: {
              notification: {
                icon: '/logo.webp',
                badge: '/logo.webp',
                vibrate: [200, 100, 200],
                requireInteraction: true
              },
              fcm_options: {
                link: notification.link || '/'
              }
            },
            android: {
              notification: {
                icon: 'ic_notification',
                color: '#7C3AED',
                click_action: 'OPEN_APP'
              }
            }
          }
        })
      }
    );
    
    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.text();
      console.error(`Erro ao enviar para token ${token.substring(0, 20)}...:`, error);
      return { success: false, error };
    }
  } catch (error) {
    console.error(`Exceção ao enviar para token:`, error);
    return { success: false, error: String(error) };
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const { titulo, mensagem, link, imagem_url } = await req.json();
    
    console.log('=== ENVIAR PUSH FCM ===');
    console.log('Título:', titulo);
    console.log('Mensagem:', mensagem?.substring(0, 50) + '...');
    console.log('Link:', link);
    
    if (!titulo || !mensagem) {
      return new Response(
        JSON.stringify({ error: 'Título e mensagem são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter service account
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountJson) {
      console.error('FIREBASE_SERVICE_ACCOUNT não configurado');
      return new Response(
        JSON.stringify({ error: 'Firebase não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('Project ID:', serviceAccount.project_id);
    
    // Inicializar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Buscar todos os tokens ativos
    const { data: dispositivos, error: dbError } = await supabase
      .from('dispositivos_fcm')
      .select('fcm_token, user_id')
      .eq('ativo', true);
    
    if (dbError) {
      console.error('Erro ao buscar dispositivos:', dbError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar dispositivos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const totalDispositivos = dispositivos?.length || 0;
    console.log(`Total de dispositivos ativos: ${totalDispositivos}`);
    
    if (totalDispositivos === 0) {
      return new Response(
        JSON.stringify({ 
          sucesso: 0, 
          falha: 0, 
          total: 0,
          mensagem: 'Nenhum dispositivo registrado' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter access token
    console.log('Obtendo access token...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('Access token obtido com sucesso');
    
    // Enviar para todos os dispositivos
    let sucesso = 0;
    let falha = 0;
    const tokensComFalha: string[] = [];
    
    for (const dispositivo of dispositivos) {
      const result = await sendToToken(
        accessToken,
        serviceAccount.project_id,
        dispositivo.fcm_token,
        { titulo, mensagem, link, imagem_url }
      );
      
      if (result.success) {
        sucesso++;
      } else {
        falha++;
        // Se o token é inválido, marcar como inativo
        if (result.error?.includes('UNREGISTERED') || result.error?.includes('INVALID')) {
          tokensComFalha.push(dispositivo.fcm_token);
        }
      }
    }
    
    // Desativar tokens inválidos
    if (tokensComFalha.length > 0) {
      console.log(`Desativando ${tokensComFalha.length} tokens inválidos`);
      await supabase
        .from('dispositivos_fcm')
        .update({ ativo: false })
        .in('fcm_token', tokensComFalha);
    }
    
    // Registrar envio no histórico
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }
    
    await supabase
      .from('notificacoes_push_enviadas')
      .insert({
        titulo,
        mensagem,
        link,
        imagem_url,
        total_enviados: totalDispositivos,
        total_sucesso: sucesso,
        total_falha: falha,
        enviado_por: userId
      });
    
    console.log(`Resultado: ${sucesso} sucesso, ${falha} falha de ${totalDispositivos} total`);
    
    return new Response(
      JSON.stringify({
        sucesso,
        falha,
        total: totalDispositivos,
        mensagem: `Notificação enviada para ${sucesso} de ${totalDispositivos} dispositivos`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Erro geral:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
