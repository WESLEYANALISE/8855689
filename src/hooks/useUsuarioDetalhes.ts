import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UsuarioProfile {
  id: string;
  nome: string | null;
  email: string | null;
  created_at: string;
  dispositivo: string | null;
  device_info: any;
  intencao: string | null;
  avatar_url: string | null;
}

interface PageView {
  id: string;
  page_path: string;
  page_title: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
}

interface PaginaAcessada {
  page_path: string;
  page_title: string | null;
  count: number;
}

interface AreaPreferida {
  area: string;
  count: number;
  percentual: number;
}

interface MetricasUsuario {
  totalAcessos: number;
  paginasUnicas: number;
  diasConsecutivos: number;
  tempoMedioOnline: string;
  primeiraVisita: Date | null;
  ultimaVisita: Date | null;
  isPremium: boolean;
  diasAtePremium: number | null;
  paginasAcessadas: PaginaAcessada[];
  areasPreferidas: AreaPreferida[];
  historicoNavegacao: PageView[];
}

// Função para categorizar paths em áreas
function categorizarArea(path: string): string {
  const p = path.toLowerCase();
  if (p.includes('/conceitos') || p.includes('/estudos') || p.includes('/resumos')) return 'Estudos';
  if (p.includes('/oab')) return 'OAB';
  if (p.includes('/videoaulas') || p.includes('/video')) return 'Videoaulas';
  if (p.includes('/politica') || p.includes('/camara') || p.includes('/senado') || p.includes('/tres-poderes')) return 'Política';
  if (p.includes('/biblioteca')) return 'Biblioteca';
  if (p.includes('/flashcard')) return 'Flashcards';
  if (p.includes('/questoes') || p.includes('/simulado')) return 'Questões';
  if (p.includes('/ferramentas')) return 'Ferramentas';
  if (p.includes('/vademecum') || p.includes('/codigo') || p.includes('/constituicao')) return 'Legislação';
  if (p.includes('/advogado')) return 'Advogado';
  if (p === '/' || p.includes('/index')) return 'Início';
  return 'Outros';
}

// Função para calcular dias consecutivos de acesso
function calcularDiasConsecutivos(datas: Date[]): number {
  if (datas.length === 0) return 0;
  
  // Remover duplicatas (mesmo dia) e ordenar decrescente
  const diasUnicos = [...new Set(datas.map(d => d.toISOString().split('T')[0]))];
  diasUnicos.sort((a, b) => b.localeCompare(a)); // Mais recente primeiro
  
  const hoje = new Date().toISOString().split('T')[0];
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Se não acessou hoje nem ontem, sequência é 0
  if (diasUnicos[0] !== hoje && diasUnicos[0] !== ontem) return 0;
  
  let sequencia = 1;
  let dataAtual = new Date(diasUnicos[0]);
  
  for (let i = 1; i < diasUnicos.length; i++) {
    const dataAnterior = new Date(diasUnicos[i]);
    const diffDias = Math.floor((dataAtual.getTime() - dataAnterior.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDias === 1) {
      sequencia++;
      dataAtual = dataAnterior;
    } else {
      break;
    }
  }
  
  return sequencia;
}

// Função para calcular tempo médio online por dia
function calcularTempoMedioOnline(pageViews: PageView[]): string {
  if (pageViews.length === 0) return '0m';
  
  // Agrupar por dia
  const porDia: Record<string, Date[]> = {};
  
  pageViews.forEach(pv => {
    const dia = pv.created_at.split('T')[0];
    if (!porDia[dia]) porDia[dia] = [];
    porDia[dia].push(new Date(pv.created_at));
  });
  
  // Calcular tempo de sessão por dia
  let tempoTotalMs = 0;
  let diasComSessao = 0;
  
  Object.values(porDia).forEach(timestamps => {
    if (timestamps.length < 2) return;
    
    timestamps.sort((a, b) => a.getTime() - b.getTime());
    const primeira = timestamps[0];
    const ultima = timestamps[timestamps.length - 1];
    const diffMs = ultima.getTime() - primeira.getTime();
    
    if (diffMs > 0) {
      tempoTotalMs += diffMs;
      diasComSessao++;
    }
  });
  
  if (diasComSessao === 0) return '< 1m';
  
  const tempoMedioMs = tempoTotalMs / diasComSessao;
  const minutos = Math.floor(tempoMedioMs / (1000 * 60));
  const horas = Math.floor(minutos / 60);
  const minutosRestantes = minutos % 60;
  
  if (horas > 0) {
    return `${horas}h ${minutosRestantes}m`;
  }
  return `${minutos}m`;
}

export const useUsuarioDetalhes = (userId: string) => {
  return useQuery({
    queryKey: ['usuario-detalhes', userId],
    queryFn: async (): Promise<{ profile: UsuarioProfile; metricas: MetricasUsuario }> => {
      // Buscar dados do profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, nome, email, created_at, dispositivo, device_info, intencao, avatar_url')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Buscar page_views do usuário
      const { data: pageViews, error: pageViewsError } = await supabase
        .from('page_views')
        .select('id, page_path, page_title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (pageViewsError) throw pageViewsError;
      
      // Buscar subscription do usuário
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('id, user_id, status, created_at')
        .eq('user_id', userId)
        .eq('status', 'authorized')
        .limit(1);
      
      const views = pageViews || [];
      
      // Calcular páginas mais acessadas
      const contagemPaginas: Record<string, { path: string; title: string | null; count: number }> = {};
      views.forEach((pv) => {
        if (!contagemPaginas[pv.page_path]) {
          contagemPaginas[pv.page_path] = {
            path: pv.page_path,
            title: pv.page_title,
            count: 0,
          };
        }
        contagemPaginas[pv.page_path].count++;
      });
      
      const paginasAcessadas = Object.values(contagemPaginas)
        .map((item) => ({
          page_path: item.path,
          page_title: item.title,
          count: item.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Calcular áreas preferidas
      const contagemAreas: Record<string, number> = {};
      views.forEach((pv) => {
        const area = categorizarArea(pv.page_path);
        contagemAreas[area] = (contagemAreas[area] || 0) + 1;
      });
      
      const totalViews = views.length;
      const areasPreferidas = Object.entries(contagemAreas)
        .map(([area, count]) => ({
          area,
          count,
          percentual: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calcular páginas únicas
      const paginasUnicas = new Set(views.map((pv) => pv.page_path)).size;
      
      // Calcular dias consecutivos
      const datas = views.map((pv) => new Date(pv.created_at));
      const diasConsecutivos = calcularDiasConsecutivos(datas);
      
      // Calcular tempo médio online
      const tempoMedioOnline = calcularTempoMedioOnline(views);
      
      // Primeira e última visita
      const primeiraVisita = views.length > 0 ? new Date(views[views.length - 1].created_at) : null;
      const ultimaVisita = views.length > 0 ? new Date(views[0].created_at) : null;
      
      // Status premium
      const isPremium = (subscriptions && subscriptions.length > 0);
      
      // Dias até virar premium
      let diasAtePremium: number | null = null;
      if (isPremium && subscriptions && subscriptions.length > 0) {
        const subscriptionDate = new Date(subscriptions[0].created_at);
        const profileDate = new Date(profile.created_at);
        const diffMs = subscriptionDate.getTime() - profileDate.getTime();
        diasAtePremium = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      }
      
      // Histórico de navegação (últimos 50)
      const historicoNavegacao = views.slice(0, 50);
      
      return {
        profile: profile as UsuarioProfile,
        metricas: {
          totalAcessos: views.length,
          paginasUnicas,
          diasConsecutivos,
          tempoMedioOnline,
          primeiraVisita,
          ultimaVisita,
          isPremium,
          diasAtePremium,
          paginasAcessadas,
          areasPreferidas,
          historicoNavegacao,
        },
      };
    },
    enabled: !!userId,
  });
};
