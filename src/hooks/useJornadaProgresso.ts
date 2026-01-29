import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface JornadaProgresso {
  id: string;
  dia_atual: number;
  area_selecionada: string | null;
  dias_completos: number[];
  total_dias: number;
  streak_atual: number;
  maior_streak: number;
  ultimo_estudo: string | null;
  duracao: number | null;
  artigos_por_dia: number;
  total_artigos: number;
}

export const useJornadaProgresso = () => {
  const { user } = useAuth();
  const [progresso, setProgresso] = useState<JornadaProgresso | null>(null);
  const [loading, setLoading] = useState(true);
  const [jornadasExistentes, setJornadasExistentes] = useState<JornadaProgresso[]>([]);

  const fetchProgresso = useCallback(async (area?: string) => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("jornada_progresso_usuario")
        .select("*")
        .eq("user_id", user.id);

      if (area) {
        query = query.eq("area_selecionada", area);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Se buscou por área específica, retorna essa
        const registro = area 
          ? data.find(d => d.area_selecionada === area) || data[0]
          : data[0];

        setProgresso({
          ...registro,
          dias_completos: (registro.dias_completos as number[]) || [],
          duracao: registro.duracao,
          artigos_por_dia: registro.artigos_por_dia || 1,
          total_artigos: registro.total_artigos || 0,
        });

        // Guardar todas as jornadas existentes
        setJornadasExistentes(data.map(d => ({
          ...d,
          dias_completos: (d.dias_completos as number[]) || [],
          duracao: d.duracao,
          artigos_por_dia: d.artigos_por_dia || 1,
          total_artigos: d.total_artigos || 0,
        })));
      } else {
        setProgresso(null);
      }
    } catch (error) {
      console.error("Erro ao buscar progresso:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const iniciarJornada = useCallback(async (
    area: string, 
    duracao: number | null, 
    totalArtigos: number
  ) => {
    if (!user) return null;

    const artigosPorDia = duracao ? Math.ceil(totalArtigos / duracao) : 1;
    const totalDias = duracao || totalArtigos;

    try {
      // Verificar se já existe jornada para essa área
      const { data: existente } = await supabase
        .from("jornada_progresso_usuario")
        .select("id")
        .eq("user_id", user.id)
        .eq("area_selecionada", area)
        .maybeSingle();

      if (existente) {
        // Atualizar jornada existente
        const { data, error } = await supabase
          .from("jornada_progresso_usuario")
          .update({
            duracao,
            artigos_por_dia: artigosPorDia,
            total_artigos: totalArtigos,
            total_dias: totalDias,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existente.id)
          .select()
          .single();

        if (error) throw error;

        const novoProgresso = {
          ...data,
          dias_completos: (data.dias_completos as number[]) || [],
          duracao: data.duracao,
          artigos_por_dia: data.artigos_por_dia || 1,
          total_artigos: data.total_artigos || 0,
        };

        setProgresso(novoProgresso);
        return novoProgresso;
      }

      // Criar nova jornada
      const novaJornada = {
        user_id: user.id,
        dia_atual: 1,
        modo: "area",
        area_selecionada: area,
        dias_completos: [],
        total_dias: totalDias,
        streak_atual: 0,
        maior_streak: 0,
        ultimo_estudo: null,
        duracao,
        artigos_por_dia: artigosPorDia,
        total_artigos: totalArtigos,
      };

      const { data, error } = await supabase
        .from("jornada_progresso_usuario")
        .insert(novaJornada)
        .select()
        .single();

      if (error) throw error;

      const novoProgresso = {
        ...data,
        dias_completos: [],
        duracao: data.duracao,
        artigos_por_dia: data.artigos_por_dia || 1,
        total_artigos: data.total_artigos || 0,
      };

      setProgresso(novoProgresso);
      return novoProgresso;
    } catch (error) {
      console.error("Erro ao iniciar jornada:", error);
      return null;
    }
  }, [user]);

  const marcarDiaCompleto = useCallback(async (dia: number) => {
    if (!user || !progresso) return;

    const novosDiasCompletos = [...progresso.dias_completos, dia];
    const agora = new Date().toISOString();

    // Calcular streak
    let novoStreak = progresso.streak_atual;
    if (progresso.ultimo_estudo) {
      const ultimoEstudo = new Date(progresso.ultimo_estudo);
      const horasDesde = (Date.now() - ultimoEstudo.getTime()) / (1000 * 60 * 60);

      if (horasDesde < 48) {
        novoStreak++;
      } else {
        novoStreak = 1;
      }
    } else {
      novoStreak = 1;
    }

    const maiorStreak = Math.max(progresso.maior_streak, novoStreak);

    const { error } = await supabase
      .from("jornada_progresso_usuario")
      .update({
        dias_completos: novosDiasCompletos,
        dia_atual: dia + 1,
        streak_atual: novoStreak,
        maior_streak: maiorStreak,
        ultimo_estudo: agora,
        updated_at: agora,
      })
      .eq("id", progresso.id);

    if (error) {
      console.error("Erro ao marcar dia completo:", error);
      return;
    }

    setProgresso((prev) =>
      prev
        ? {
            ...prev,
            dias_completos: novosDiasCompletos,
            dia_atual: dia + 1,
            streak_atual: novoStreak,
            maior_streak: maiorStreak,
            ultimo_estudo: agora,
          }
        : null
    );
  }, [user, progresso]);

  useEffect(() => {
    fetchProgresso();
  }, [fetchProgresso]);

  return {
    progresso,
    loading,
    jornadasExistentes,
    fetchProgresso,
    iniciarJornada,
    marcarDiaCompleto,
  };
};
