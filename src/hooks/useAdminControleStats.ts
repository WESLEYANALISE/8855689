import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NovoUsuario {
  id: string;
  nome: string | null;
  email: string | null;
  created_at: string;
  dispositivo: string | null;
  device_info: any;
  intencao: string | null;
}

interface PaginaPopular {
  page_path: string;
  page_title: string | null;
  count: number;
}

interface TermoPesquisado {
  termo: string;
  count: number;
}

interface EstatisticasGerais {
  totalUsuarios: number;
  novosNoPeriodo: number;
  ativosNoPeriodo: number;
  onlineAgora: number;
  totalPageViews: number;
}

interface DistribuicaoDispositivos {
  iOS: number;
  Android: number;
  Desktop: number;
  Outro: number;
}

interface DistribuicaoIntencoes {
  Universitario: number;
  Concurseiro: number;
  OAB: number;
  Advogado: number;
  Outro: number;
}

interface CadastrosDia {
  dia: string;
  total: number;
}

export interface UsuarioDetalhe {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  dispositivo: string | null;
  intencao?: string | null;
  page_path?: string | null;
  total_views?: number;
  last_seen?: string;
  created_at?: string;
}

// Hook para buscar novos usuários com filtro de período
export const useNovosUsuarios = (dias = 7, limite = 50) => {
  return useQuery({
    queryKey: ['admin-controle-novos', dias, limite],
    queryFn: async (): Promise<NovoUsuario[]> => {
      let query = supabase
        .from('profiles')
        .select('id, nome, email, created_at, dispositivo, device_info, intencao')
        .order('created_at', { ascending: false })
        .limit(limite);

      if (dias > 0) {
        const dataInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', dataInicio);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });
};

// Hook para buscar páginas mais acessadas via RPC
export const usePaginasPopulares = (dias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-paginas', dias],
    queryFn: async (): Promise<PaginaPopular[]> => {
      const { data, error } = await supabase.rpc('get_admin_paginas_populares', {
        p_dias: dias,
      });
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        page_path: item.page_path,
        page_title: item.page_title,
        count: Number(item.total),
      }));
    },
    refetchInterval: 60000,
  });
};

// Hook para buscar termos pesquisados
export const useTermosPesquisados = (limite = 20) => {
  return useQuery({
    queryKey: ['admin-controle-termos', limite],
    queryFn: async (): Promise<TermoPesquisado[]> => {
      const { data, error } = await supabase
        .from('cache_pesquisas')
        .select('termo_pesquisado, total_resultados')
        .order('total_resultados', { ascending: false })
        .limit(limite);
      
      if (error) throw error;
      
      return (data || []).map((item) => ({
        termo: item.termo_pesquisado || '',
        count: item.total_resultados || 1,
      }));
    },
    refetchInterval: 60000,
  });
};

// Hook para estatísticas gerais - agora com período dinâmico
export const useEstatisticasGerais = (periodoDias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-stats', periodoDias],
    queryFn: async (): Promise<EstatisticasGerais> => {
      const [
        totalRes,
        novosRes,
        ativosRes,
        onlineRes,
        pvRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.rpc('get_admin_novos_por_periodo', { p_dias: periodoDias }),
        supabase.rpc('get_admin_ativos_periodo', { p_dias: periodoDias }),
        supabase.rpc('get_admin_online_count'),
        supabase.rpc('get_admin_total_pageviews', { p_dias: periodoDias }),
      ]);

      return {
        totalUsuarios: totalRes.count || 0,
        novosNoPeriodo: novosRes.data || 0,
        ativosNoPeriodo: ativosRes.data || 0,
        onlineAgora: onlineRes.data || 0,
        totalPageViews: Number(pvRes.data) || 0,
      };
    },
    refetchInterval: 30000,
  });
};

// Hook para distribuição de dispositivos
export const useDistribuicaoDispositivos = () => {
  return useQuery({
    queryKey: ['admin-controle-dispositivos'],
    queryFn: async (): Promise<DistribuicaoDispositivos> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('dispositivo');
      
      if (error) throw error;
      
      const distribuicao: DistribuicaoDispositivos = {
        iOS: 0,
        Android: 0,
        Desktop: 0,
        Outro: 0,
      };
      
      (data || []).forEach((item) => {
        const dispositivo = item.dispositivo?.toLowerCase() || '';
        if (dispositivo.includes('ios') || dispositivo.includes('iphone') || dispositivo.includes('ipad')) {
          distribuicao.iOS++;
        } else if (dispositivo.includes('android')) {
          distribuicao.Android++;
        } else if (dispositivo.includes('desktop') || dispositivo.includes('windows') || dispositivo.includes('mac')) {
          distribuicao.Desktop++;
        } else {
          distribuicao.Outro++;
        }
      });
      
      return distribuicao;
    },
    refetchInterval: 60000,
  });
};

// Hook para distribuição de intenções
export const useDistribuicaoIntencoes = () => {
  return useQuery({
    queryKey: ['admin-controle-intencoes'],
    queryFn: async (): Promise<DistribuicaoIntencoes> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('intencao');
      
      if (error) throw error;
      
      const distribuicao: DistribuicaoIntencoes = {
        Universitario: 0,
        Concurseiro: 0,
        OAB: 0,
        Advogado: 0,
        Outro: 0,
      };
      
      (data || []).forEach((item) => {
        const intencao = item.intencao?.toLowerCase() || '';
        if (intencao === 'universitario' || intencao.includes('estudante') || intencao.includes('faculdade')) {
          distribuicao.Universitario++;
        } else if (intencao === 'concurseiro') {
          distribuicao.Concurseiro++;
        } else if (intencao === 'oab') {
          distribuicao.OAB++;
        } else if (intencao === 'advogado' || intencao.includes('profissional')) {
          distribuicao.Advogado++;
        } else if (intencao) {
          distribuicao.Outro++;
        }
      });
      
      return distribuicao;
    },
    refetchInterval: 60000,
  });
};

// Interface para métricas premium
interface MetricasPremium {
  totalPremium: number;
  taxaConversao: number;
  mediaDiasAtePremium: number | null;
  receitaTotal: number;
  receitaMensal: number;
  receitaAnual: number;
  receitaVitalicio: number;
  novosPremiumPeriodo: number;
}

// Hook para métricas de Premium com receita
export const useMetricasPremium = (periodoDias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-premium', periodoDias],
    queryFn: async (): Promise<MetricasPremium> => {
      const { count: totalUsuarios } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('user_id, created_at, status, plan_type, amount, payment_method')
        .eq('status', 'authorized');
      
      if (error) throw error;
      
      const usuariosPremium = new Set((subscriptions || []).map(s => s.user_id));
      const totalPremium = usuariosPremium.size;
      
      const taxaConversao = totalUsuarios && totalUsuarios > 0 
        ? (totalPremium / totalUsuarios) * 100 
        : 0;
      
      // Receita
      let receitaTotal = 0;
      let receitaMensal = 0;
      let receitaAnual = 0;
      let receitaVitalicio = 0;
      let novosPremiumPeriodo = 0;

      const dataLimite = periodoDias === 0 
        ? new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }).split(',')[0]).toISOString()
        : new Date(Date.now() - periodoDias * 24 * 60 * 60 * 1000).toISOString();

      (subscriptions || []).forEach(sub => {
        const amount = sub.amount || 0;
        receitaTotal += amount;
        
        const planId = (sub.plan_type || '').toLowerCase();
        if (planId.includes('mensal') || planId.includes('monthly')) receitaMensal += amount;
        else if (planId.includes('anual') || planId.includes('yearly')) receitaAnual += amount;
        else receitaVitalicio += amount;

        if (sub.created_at >= dataLimite) {
          novosPremiumPeriodo++;
        }
      });

      // Média de dias até premium
      let mediaDiasAtePremium: number | null = null;
      
      if (subscriptions && subscriptions.length > 0) {
        const userIds = [...usuariosPremium];
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, created_at')
          .in('id', userIds);
        
        if (profiles && profiles.length > 0) {
          const profileMap = new Map(profiles.map(p => [p.id, new Date(p.created_at)]));
          
          let totalDias = 0;
          let count = 0;
          
          subscriptions.forEach(sub => {
            const profileDate = profileMap.get(sub.user_id);
            if (profileDate) {
              const subDate = new Date(sub.created_at);
              const diffDias = Math.floor((subDate.getTime() - profileDate.getTime()) / (24 * 60 * 60 * 1000));
              if (diffDias >= 0) {
                totalDias += diffDias;
                count++;
              }
            }
          });
          
          if (count > 0) {
            mediaDiasAtePremium = Math.round(totalDias / count);
          }
        }
      }
      
      return {
        totalPremium,
        taxaConversao: Math.round(taxaConversao * 100) / 100,
        mediaDiasAtePremium,
        receitaTotal,
        receitaMensal,
        receitaAnual,
        receitaVitalicio,
        novosPremiumPeriodo,
      };
    },
    refetchInterval: 60000,
  });
};

// Interface para assinante premium
export interface AssinantePremium {
  email: string;
  nome: string | null;
  telefone: string | null;
  plano: string;
  valor: number;
  data: string;
  status: string;
  intencao: string | null;
  payment_method: string | null;
}

// Hook para listar assinantes premium únicos
export const useListaAssinantesPremium = () => {
  return useQuery({
    queryKey: ['admin-controle-lista-premium'],
    queryFn: async (): Promise<AssinantePremium[]> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('user_id, mp_payer_email, plan_type, amount, created_at, status, payment_method')
        .eq('status', 'authorized')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const emailMap = new Map<string, AssinantePremium>();
      const userIds: string[] = [];

      (data || []).forEach((sub: any) => {
        const email = sub.mp_payer_email || 'Email não disponível';
        if (!emailMap.has(email)) {
          const planId = (sub.plan_type || '').toLowerCase();
          let plano = 'Vitalício';
          if (planId.includes('mensal') || planId.includes('monthly')) plano = 'Mensal';
          else if (planId.includes('anual') || planId.includes('yearly')) plano = 'Anual';

          emailMap.set(email, {
            email,
            nome: null,
            telefone: null,
            plano,
            valor: sub.amount || 0,
            data: sub.created_at,
            status: sub.status,
            intencao: null,
            payment_method: sub.payment_method || null,
          });
          if (sub.user_id) userIds.push(sub.user_id);
        }
      });

      // Fetch profile details
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email, nome, telefone, intencao')
          .in('id', userIds);

        (profiles || []).forEach((p: any) => {
          const existing = emailMap.get(p.email);
          if (existing) {
            existing.nome = p.nome;
            existing.telefone = p.telefone;
            existing.intencao = p.intencao;
          }
        });
      }

      return Array.from(emailMap.values());
    },
    refetchInterval: 60000,
  });
};

// Hook para Online Agora com Supabase Realtime + RPC
export const useOnlineAgoraRealtime = () => {
  const [onlineAgora, setOnlineAgora] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnline = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_online_count');
      if (!error && data != null) {
        setOnlineAgora(data);
      }
    } catch (error) {
      console.error('Erro ao buscar online agora:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnline();

    const channel = supabase
      .channel('online-agora-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'page_views' },
        () => {
          fetchOnline();
        }
      )
      .subscribe();

    const interval = setInterval(fetchOnline, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchOnline]);

  return { onlineAgora, isLoading, refetch: fetchOnline };
};

// Hook para detalhes dos usuários online agora
export const useOnlineDetails = () => {
  return useQuery({
    queryKey: ['admin-controle-online-details'],
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const { data, error } = await supabase.rpc('get_admin_online_details');
      if (error) throw error;
      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        nome: item.nome,
        email: item.email,
        telefone: item.telefone,
        dispositivo: item.dispositivo,
        page_path: item.page_path,
        last_seen: item.last_seen,
      }));
    },
    refetchInterval: 15000,
  });
};

// Hook para detalhes dos usuários ativos no período
export const useAtivosDetalhes = (dias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-ativos-details', dias],
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const { data, error } = await supabase.rpc('get_admin_ativos_detalhes', { p_dias: dias });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        nome: item.nome,
        email: item.email,
        telefone: item.telefone,
        dispositivo: item.dispositivo,
        total_views: Number(item.total_views),
        last_seen: item.last_seen,
      }));
    },
    refetchInterval: 30000,
  });
};

// Hook para detalhes dos novos usuários no período
export const useNovosDetalhes = (dias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-novos-details', dias],
    queryFn: async (): Promise<UsuarioDetalhe[]> => {
      const { data, error } = await supabase.rpc('get_admin_novos_detalhes', { p_dias: dias });
      if (error) throw error;
      return (data || []).map((item: any) => ({
        user_id: item.user_id,
        nome: item.nome,
        email: item.email,
        telefone: item.telefone,
        dispositivo: item.dispositivo,
        intencao: item.intencao,
        created_at: item.created_at,
      }));
    },
    refetchInterval: 30000,
  });
};

// Hook para cadastros por dia (gráfico de evolução)
export const useCadastrosPorDia = (dias = 30) => {
  return useQuery({
    queryKey: ['admin-controle-cadastros-dia', dias],
    queryFn: async (): Promise<CadastrosDia[]> => {
      const { data, error } = await supabase.rpc('get_admin_cadastros_por_dia', {
        p_dias: dias,
      });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        dia: item.dia,
        total: Number(item.total),
      }));
    },
    refetchInterval: 60000,
  });
};
