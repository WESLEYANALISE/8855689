import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ==================== MAPPINGS ====================

const ROUTE_TO_FUNCAO: Record<string, string> = {
  '/flashcards': 'Flashcards',
  '/ferramentas/questoes': 'Questões',
  '/videoaulas': 'Videoaulas',
  '/vade-mecum': 'Vade Mecum',
  '/constituicao': 'Constituição',
  '/codigos': 'Códigos e Leis',
  '/evelyn': 'Evelyn IA',
  '/ferramentas/evelyn': 'Evelyn IA',
  '/bibliotecas': 'Bibliotecas',
  '/resumos-juridicos': 'Resumos',
  '/mapas-mentais': 'Mapas Mentais',
  '/oab-trilhas': 'OAB Trilhas',
  '/sumulas': 'Súmulas',
  '/audio-aulas': 'Áudio Aulas',
};

const ROUTE_TO_AREA: Record<string, string> = {
  '/constituicao': 'Constitucional',
  '/oab-trilhas': 'OAB',
  '/ferramentas/questoes': 'OAB',
  '/vade-mecum': 'Geral',
  '/bibliotecas': 'Geral',
  '/resumos-juridicos': 'Geral',
  '/codigos': 'Códigos (Geral)',
  '/flashcards': 'Estudo (Geral)',
};

function mapPathToFuncao(path: string): string | null {
  for (const [route, funcao] of Object.entries(ROUTE_TO_FUNCAO)) {
    if (path === route || path.startsWith(route + '/')) return funcao;
  }
  return null;
}

function mapPathToArea(path: string): string | null {
  for (const [route, area] of Object.entries(ROUTE_TO_AREA)) {
    if (path === route || path.startsWith(route + '/')) return area;
  }
  return null;
}

function formatMinutes(totalMin: number): string {
  if (totalMin < 60) return `${Math.round(totalMin)}min`;
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ==================== TYPES ====================

export interface RankingTempoTelaItem {
  user_id: string;
  nome: string;
  email: string;
  tempo_total_min: number;
  tempo_formatado: string;
  sessoes: number;
  ultima_atividade: string;
}

export interface RankingAreaItem {
  area: string;
  count: number;
  percentual: number;
}

export interface RankingFuncaoItem {
  funcao: string;
  count: number;
  percentual: number;
}

export interface RankingFidelidadeItem {
  user_id: string;
  nome: string;
  email: string;
  dias_ativos: number;
  streak: number;
  ultima_visita: string;
}

// ==================== HOOKS ====================

export function useRankingTempoTela(dias: number) {
  return useQuery({
    queryKey: ['ranking-tempo-tela', dias],
    queryFn: async (): Promise<RankingTempoTelaItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const { data: pageViews, error } = await supabase
        .from('page_views')
        .select('user_id, session_id, created_at')
        .not('user_id', 'is', null)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      if (error || !pageViews) return [];

      // Group by session
      const sessions: Record<string, { user_id: string; times: Date[] }> = {};
      for (const pv of pageViews) {
        if (!pv.user_id || !pv.session_id) continue;
        if (!sessions[pv.session_id]) {
          sessions[pv.session_id] = { user_id: pv.user_id, times: [] };
        }
        sessions[pv.session_id].times.push(new Date(pv.created_at));
      }

      // Calculate time per user
      const userTime: Record<string, { total: number; sessoes: Set<string>; lastSeen: Date }> = {};
      for (const [sessionId, session] of Object.entries(sessions)) {
        const uid = session.user_id;
        if (!userTime[uid]) userTime[uid] = { total: 0, sessoes: new Set(), lastSeen: new Date(0) };
        userTime[uid].sessoes.add(sessionId);

        const times = session.times.sort((a, b) => a.getTime() - b.getTime());
        let sessionTime = 0;
        for (let i = 1; i < times.length; i++) {
          const diff = (times[i].getTime() - times[i - 1].getTime()) / 60000;
          if (diff < 30) sessionTime += diff;
        }
        sessionTime += 1; // last page estimate
        userTime[uid].total += sessionTime;

        const last = times[times.length - 1];
        if (last > userTime[uid].lastSeen) userTime[uid].lastSeen = last;
      }

      // Get profiles
      const userIds = Object.keys(userTime);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds.slice(0, 50));

      const profileMap: Record<string, { nome: string; email: string }> = {};
      for (const p of profiles || []) {
        profileMap[p.id] = { nome: p.nome || '', email: p.email || '' };
      }

      const result: RankingTempoTelaItem[] = Object.entries(userTime)
        .map(([uid, data]) => ({
          user_id: uid,
          nome: profileMap[uid]?.nome || 'Sem nome',
          email: profileMap[uid]?.email || '',
          tempo_total_min: data.total,
          tempo_formatado: formatMinutes(data.total),
          sessoes: data.sessoes.size,
          ultima_atividade: data.lastSeen.toISOString(),
        }))
        .sort((a, b) => b.tempo_total_min - a.tempo_total_min)
        .slice(0, 20);

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRankingAreasAcessadas(dias: number) {
  return useQuery({
    queryKey: ['ranking-areas', dias],
    queryFn: async (): Promise<RankingAreaItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const { data, error } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', since.toISOString());

      if (error || !data) return [];

      const counts: Record<string, number> = {};
      for (const pv of data) {
        const area = mapPathToArea(pv.page_path);
        if (area) counts[area] = (counts[area] || 0) + 1;
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(counts)
        .map(([area, count]) => ({ area, count, percentual: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRankingFuncoesUtilizadas(dias: number) {
  return useQuery({
    queryKey: ['ranking-funcoes', dias],
    queryFn: async (): Promise<RankingFuncaoItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const { data, error } = await supabase
        .from('page_views')
        .select('page_path')
        .gte('created_at', since.toISOString());

      if (error || !data) return [];

      const counts: Record<string, number> = {};
      for (const pv of data) {
        const funcao = mapPathToFuncao(pv.page_path);
        if (funcao) counts[funcao] = (counts[funcao] || 0) + 1;
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      return Object.entries(counts)
        .map(([funcao, count]) => ({ funcao, count, percentual: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRankingFidelidade(dias: number) {
  return useQuery({
    queryKey: ['ranking-fidelidade', dias],
    queryFn: async (): Promise<RankingFidelidadeItem[]> => {
      const since = new Date();
      since.setDate(since.getDate() - (dias || 7));

      const { data, error } = await supabase
        .from('page_views')
        .select('user_id, created_at')
        .not('user_id', 'is', null)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });

      if (error || !data) return [];

      // Group days per user
      const userDays: Record<string, Set<string>> = {};
      const userLast: Record<string, string> = {};
      for (const pv of data) {
        if (!pv.user_id) continue;
        if (!userDays[pv.user_id]) userDays[pv.user_id] = new Set();
        const day = pv.created_at.slice(0, 10);
        userDays[pv.user_id].add(day);
        userLast[pv.user_id] = pv.created_at;
      }

      // Calculate streak
      const calcStreak = (days: Set<string>): number => {
        const sorted = [...days].sort().reverse();
        if (sorted.length === 0) return 0;
        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const prev = new Date(sorted[i - 1]);
          const curr = new Date(sorted[i]);
          const diff = (prev.getTime() - curr.getTime()) / 86400000;
          if (Math.abs(diff - 1) < 0.5) streak++;
          else break;
        }
        return streak;
      };

      const userIds = Object.keys(userDays);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, email')
        .in('id', userIds.slice(0, 50));

      const profileMap: Record<string, { nome: string; email: string }> = {};
      for (const p of profiles || []) {
        profileMap[p.id] = { nome: p.nome || '', email: p.email || '' };
      }

      return Object.entries(userDays)
        .map(([uid, days]) => ({
          user_id: uid,
          nome: profileMap[uid]?.nome || 'Sem nome',
          email: profileMap[uid]?.email || '',
          dias_ativos: days.size,
          streak: calcStreak(days),
          ultima_visita: userLast[uid],
        }))
        .sort((a, b) => b.dias_ativos - a.dias_ativos)
        .slice(0, 20);
    },
    staleTime: 5 * 60 * 1000,
  });
}
