import { supabase } from '@/integrations/supabase/client';

// Configuração do Firebase
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAbnRVAQxIawF9xEtz7d4CQ47_B4y9k5v0",
  authDomain: "direito-2a0f6.firebaseapp.com",
  projectId: "direito-2a0f6",
  storageBucket: "direito-2a0f6.firebasestorage.app",
  messagingSenderId: "1075192627119",
  appId: "1:1075192627119:web:faf51b31c3ee00d7a2f95a"
};

// VAPID Key para Web Push
const VAPID_KEY = "BJSm8TvypMge3_2KT2oPsC0sZj7cSSV3aUpj5u8To9Z-Gfb00YOSumR5jmA0iy5lg_LWnBfaFV08KJdrbRXXD_k";

let messagingInstance: any = null;

// Inicializar Firebase Messaging dinamicamente
export const initializeFirebaseMessaging = async () => {
  if (messagingInstance) return messagingInstance;
  
  try {
    // Importar Firebase dinamicamente
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, isSupported } = await import('firebase/messaging');
    
    // Verificar se o navegador suporta
    const supported = await isSupported();
    if (!supported) {
      console.log('Firebase Messaging não suportado neste navegador');
      return null;
    }
    
    // Inicializar app se não existir
    const app = getApps().length === 0 
      ? initializeApp(FIREBASE_CONFIG) 
      : getApps()[0];
    
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    return null;
  }
};

// Solicitar permissão e obter token
export const solicitarPermissaoNotificacao = async (): Promise<string | null> => {
  try {
    // Verificar se notificações são suportadas
    if (!('Notification' in window)) {
      console.log('Notificações não suportadas');
      return null;
    }
    
    // Verificar se Service Workers são suportados
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers não suportados');
      return null;
    }
    
    // Solicitar permissão
    const permission = await Notification.requestPermission();
    console.log('Permissão de notificação:', permission);
    
    if (permission !== 'granted') {
      console.log('Permissão negada');
      return null;
    }
    
    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('Service Worker registrado:', registration);
    
    // Aguardar SW estar pronto
    await navigator.serviceWorker.ready;
    
    // Inicializar Firebase Messaging
    const messaging = await initializeFirebaseMessaging();
    if (!messaging) return null;
    
    // Obter token
    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    console.log('Token FCM obtido:', token?.substring(0, 30) + '...');
    
    if (token) {
      // Salvar token no Supabase
      await salvarTokenNoSupabase(token);
    }
    
    return token;
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return null;
  }
};

// Salvar token no Supabase
const salvarTokenNoSupabase = async (token: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
    
    // Upsert - atualiza se já existe, insere se não
    const { error } = await supabase
      .from('dispositivos_fcm')
      .upsert({
        user_id: user?.id || null,
        fcm_token: token,
        device_info: deviceInfo,
        ativo: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'fcm_token'
      });
    
    if (error) {
      console.error('Erro ao salvar token:', error);
    } else {
      console.log('Token salvo no Supabase');
    }
  } catch (error) {
    console.error('Erro ao salvar token:', error);
  }
};

// Escutar mensagens em foreground
export const escutarNotificacoesForeground = async (
  callback: (payload: any) => void
) => {
  try {
    const messaging = await initializeFirebaseMessaging();
    if (!messaging) return null;
    
    const { onMessage } = await import('firebase/messaging');
    
    return onMessage(messaging, (payload) => {
      console.log('Mensagem recebida em foreground:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Erro ao configurar listener:', error);
    return null;
  }
};

// Verificar status da permissão
export const verificarPermissaoNotificacao = (): 'granted' | 'denied' | 'default' | 'unsupported' => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Verificar se já tem token salvo
export const verificarTokenSalvo = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data } = await supabase
      .from('dispositivos_fcm')
      .select('id')
      .eq('user_id', user.id)
      .eq('ativo', true)
      .limit(1);
    
    return (data?.length || 0) > 0;
  } catch {
    return false;
  }
};

// Desativar notificações
export const desativarNotificacoes = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase
      .from('dispositivos_fcm')
      .update({ ativo: false })
      .eq('user_id', user.id);
    
    console.log('Notificações desativadas');
  } catch (error) {
    console.error('Erro ao desativar:', error);
  }
};
