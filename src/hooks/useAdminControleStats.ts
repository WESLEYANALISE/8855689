import { useQuery } from '@tanstack/react-query';
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
  novosHoje: number;
  ativosUltimos7Dias: number;
  onlineAgora: number;
}

interface DistribuicaoDispositivos {
  iOS: number;
  Android: number;
  Desktop: number;
  Outro: number;
}

interface DistribuicaoIntencoes {
  Estudante: number;
  OAB: number;
  Advogado: number;
  Outro: number;
}

// Hook para buscar novos usuários
export const useNovosUsuarios = (limite = 50) => {
  return useQuery({
    queryKey: ['admin-controle-novos', limite],
    queryFn: async (): Promise<NovoUsuario[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, created_at, dispositivo, device_info, intencao')
        .order('created_at', { ascending: false })
        .limit(limite);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Atualiza a cada 30s
  });
};

// Hook para buscar páginas mais acessadas
export const usePaginasPopulares = (dias = 7) => {
  return useQuery({
    queryKey: ['admin-controle-paginas', dias],
    queryFn: async (): Promise<PaginaPopular[]> => {
      const dataInicio = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('page_views')
        .select('page_path, page_title')
        .gte('created_at', dataInicio);
      
      if (error) throw error;
      
      // Agrupar e contar no frontend
      const contagem: Record<string, { path: string; title: string | null; count: number }> = {};
      
      (data || []).forEach((item) => {
        if (!contagem[item.page_path]) {
          contagem[item.page_path] = {
            path: item.page_path,
            title: item.page_title,
            count: 0,
          };
        }
        contagem[item.page_path].count++;
      });
      
      return Object.values(contagem)
        .map((item) => ({
          page_path: item.path,
          page_title: item.title,
          count: item.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
    },
    refetchInterval: 60000, // Atualiza a cada 1 min
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

// Hook para estatísticas gerais
export const useEstatisticasGerais = () => {
  return useQuery({
    queryKey: ['admin-controle-stats'],
    queryFn: async (): Promise<EstatisticasGerais> => {
      // Usar UTC para garantir consistência com o banco de dados
      const now = new Date();
      const hojeUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const hojeISO = hojeUTC.toISOString();
      
      const ultimos7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const ultimos5Min = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Total de usuários
      const { count: totalUsuarios } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      // Novos hoje (usando data UTC)
      const { count: novosHoje } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', hojeISO);
      
      // Ativos últimos 7 dias (usuários únicos com page_views)
      const { data: ativosData } = await supabase
        .from('page_views')
        .select('user_id')
        .gte('created_at', ultimos7Dias)
        .not('user_id', 'is', null);
      
      const usuariosUnicos = new Set((ativosData || []).map((d) => d.user_id));
      
      // Online agora (page_views nos últimos 5 minutos)
      const { data: onlineData } = await supabase
        .from('page_views')
        .select('session_id')
        .gte('created_at', ultimos5Min);
      
      const sessoesUnicas = new Set((onlineData || []).map((d) => d.session_id));
      
      return {
        totalUsuarios: totalUsuarios || 0,
        novosHoje: novosHoje || 0,
        ativosUltimos7Dias: usuariosUnicos.size,
        onlineAgora: sessoesUnicas.size,
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
        Estudante: 0,
        OAB: 0,
        Advogado: 0,
        Outro: 0,
      };
      
      (data || []).forEach((item) => {
        const intencao = item.intencao?.toLowerCase() || '';
        if (intencao.includes('estudante') || intencao.includes('faculdade')) {
          distribuicao.Estudante++;
        } else if (intencao.includes('oab')) {
          distribuicao.OAB++;
        } else if (intencao.includes('advogado') || intencao.includes('profissional')) {
          distribuicao.Advogado++;
        } else {
          distribuicao.Outro++;
        }
      });
      
      return distribuicao;
    },
    refetchInterval: 60000,
  });
};
