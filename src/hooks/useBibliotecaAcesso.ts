import { supabase } from "@/integrations/supabase/client";

// Gerar ou recuperar session_id persistente na sessão
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('biblioteca_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('biblioteca_session_id', sessionId);
  }
  return sessionId;
};

export const useBibliotecaAcesso = () => {
  const registrarAcesso = async (
    bibliotecaTabela: string,
    itemId: number,
    area?: string,
    livro?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('bibliotecas_acessos' as any).insert({
        biblioteca_tabela: bibliotecaTabela,
        item_id: itemId,
        area: area || null,
        livro: livro || null,
        user_id: user?.id || null,
        session_id: getSessionId(),
      });
    } catch (error) {
      // Silently fail - não bloquear UX por tracking
      console.warn('Erro ao registrar acesso biblioteca:', error);
    }
  };
  
  return { registrarAcesso };
};

export default useBibliotecaAcesso;
