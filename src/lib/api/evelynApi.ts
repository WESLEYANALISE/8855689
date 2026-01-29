import { supabase } from "@/integrations/supabase/client";

// Formatar telefone para padrão brasileiro com código do país (55)
export function formatarTelefone(telefone: string): string {
  // Remove tudo que não é número
  let numeros = telefone.replace(/\D/g, '');
  
  // Se já começa com 55 e tem 12-13 dígitos, já está no formato internacional
  if (numeros.startsWith('55') && numeros.length >= 12 && numeros.length <= 13) {
    return numeros;
  }
  
  // Se tem 10-11 dígitos (DDD + número), adiciona o 55
  if (numeros.length >= 10 && numeros.length <= 11) {
    return '55' + numeros;
  }
  
  return numeros;
}

// Tipos de perfil disponíveis
export type PerfilEvelyn = 'estudante' | 'concurseiro' | 'advogado';

// Cadastrar ou autorizar usuário para usar a Evelyn
export async function cadastrarUsuarioEvelyn(
  nome: string, 
  telefone: string,
  perfil: PerfilEvelyn
) {
  const telefoneFormatado = formatarTelefone(telefone);
  
  if (telefoneFormatado.length < 10 || telefoneFormatado.length > 13) {
    throw new Error('Telefone inválido. Use o formato: (XX) XXXXX-XXXX');
  }
  
  // Verificar se já existe
  const { data: existente, error: searchError } = await supabase
    .from('evelyn_usuarios')
    .select('id, autorizado, nome')
    .eq('telefone', telefoneFormatado)
    .maybeSingle();
  
  if (searchError) {
    console.error('Erro ao buscar usuário:', searchError);
    throw new Error('Erro ao verificar cadastro');
  }
  
  if (existente) {
    if (existente.autorizado) {
      return { 
        success: true, 
        message: 'Você já está autorizado! Pode conversar com a Evelyn no WhatsApp.',
        jaExistia: true 
      };
    }
    
    // Atualizar para autorizado
    const { error: updateError } = await supabase
      .from('evelyn_usuarios')
      .update({ 
        nome, 
        autorizado: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existente.id);
    
    if (updateError) {
      console.error('Erro ao autorizar usuário:', updateError);
      throw new Error('Erro ao autorizar acesso');
    }
    
    return { 
      success: true, 
      message: 'Acesso autorizado! Agora você pode conversar com a Evelyn no WhatsApp.',
      jaExistia: true 
    };
  }
  
  // Criar novo usuário já autorizado
  const { error: insertError } = await supabase
    .from('evelyn_usuarios')
    .insert({
      telefone: telefoneFormatado,
      nome,
      perfil,
      autorizado: true,
      ativo: true,
      total_mensagens: 0
    });
  
  if (insertError) {
    console.error('Erro ao criar usuário:', insertError);
    throw new Error('Erro ao criar cadastro');
  }
  
  return { 
    success: true, 
    message: 'Cadastro realizado! Agora você pode conversar com a Evelyn no WhatsApp.',
    jaExistia: false 
  };
}

// Verificar se usuário está autorizado
export async function verificarAutorizacao(telefone: string) {
  const telefoneFormatado = formatarTelefone(telefone);
  
  const { data, error } = await supabase
    .from('evelyn_usuarios')
    .select('id, nome, autorizado')
    .eq('telefone', telefoneFormatado)
    .maybeSingle();
  
  if (error) {
    console.error('Erro ao verificar autorização:', error);
    return { autorizado: false, nome: null };
  }
  
  return {
    autorizado: data?.autorizado ?? false,
    nome: data?.nome ?? null
  };
}

// Interface para preferências de notificação
export interface PreferenciasNotificacao {
  receber_resumo_dia: boolean;
  receber_noticias_concursos: boolean;
  receber_novas_leis: boolean;
  receber_atualizacoes_leis: boolean;
  horario_envio: '18:00' | '22:00';
}

// Buscar preferências de notificação do usuário
export async function buscarPreferenciasNotificacao(telefone: string): Promise<PreferenciasNotificacao | null> {
  const telefoneFormatado = formatarTelefone(telefone);
  
  const { data, error } = await supabase
    .from('evelyn_preferencias_notificacao')
    .select('*')
    .eq('telefone', telefoneFormatado)
    .maybeSingle();
  
  if (error) {
    console.error('Erro ao buscar preferências:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    receber_resumo_dia: data.receber_resumo_dia ?? false,
    receber_noticias_concursos: data.receber_noticias_concursos ?? false,
    receber_novas_leis: data.receber_novas_leis ?? false,
    receber_atualizacoes_leis: data.receber_atualizacoes_leis ?? false,
    horario_envio: (data.horario_envio as '18:00' | '22:00') ?? '18:00'
  };
}

// Salvar preferências de notificação
export async function salvarPreferenciasNotificacao(
  telefone: string, 
  preferencias: PreferenciasNotificacao
): Promise<{ success: boolean; message: string }> {
  const telefoneFormatado = formatarTelefone(telefone);
  
  if (telefoneFormatado.length < 10) {
    throw new Error('Telefone inválido');
  }
  
  // Buscar usuario_id
  const { data: usuario } = await supabase
    .from('evelyn_usuarios')
    .select('id')
    .eq('telefone', telefoneFormatado)
    .maybeSingle();
  
  const { error } = await supabase
    .from('evelyn_preferencias_notificacao')
    .upsert({
      telefone: telefoneFormatado,
      usuario_id: usuario?.id ?? null,
      receber_resumo_dia: preferencias.receber_resumo_dia,
      receber_noticias_concursos: preferencias.receber_noticias_concursos,
      receber_novas_leis: preferencias.receber_novas_leis,
      receber_atualizacoes_leis: preferencias.receber_atualizacoes_leis,
      horario_envio: preferencias.horario_envio,
      ativo: true,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'telefone' 
    });
  
  if (error) {
    console.error('Erro ao salvar preferências:', error);
    throw new Error('Erro ao salvar preferências');
  }
  
  return { success: true, message: 'Preferências salvas com sucesso!' };
}
