import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se um número de telefone já está cadastrado por outro usuário
 */
export async function checkPhoneDuplicate(
  telefone: string,
  currentUserId: string
): Promise<{ exists: boolean; message?: string }> {
  // Normalizar telefone - remover tudo que não é número
  const telefoneNormalizado = telefone.replace(/\D/g, '');
  
  if (!telefoneNormalizado || telefoneNormalizado.length < 10) {
    return { exists: false };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('telefone', telefoneNormalizado)
      .neq('id', currentUserId)
      .limit(1);

    if (error) {
      console.error('Erro ao verificar telefone duplicado:', error);
      return { exists: false }; // Em caso de erro, permitir continuar
    }

    if (data && data.length > 0) {
      return {
        exists: true,
        message: 'Este número já está cadastrado por outro usuário'
      };
    }

    return { exists: false };
  } catch (err) {
    console.error('Erro inesperado ao verificar telefone:', err);
    return { exists: false };
  }
}
