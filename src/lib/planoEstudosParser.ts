// Tipos para o plano de estudos estruturado
export interface TopicoData {
  horario: string;
  titulo: string;
  descricao?: string;
}

export interface DiaData {
  dia: string;
  cargaHoraria: string;
  topicos: TopicoData[];
}

export interface SemanaData {
  semana: number;
  titulo: string;
  dias: DiaData[];
}

export interface MaterialData {
  tipo: string;
  titulo: string;
  autor?: string;
  detalhes?: string;
}

export interface EstrategiaData {
  titulo: string;
  descricao: string;
}

export interface ChecklistData {
  semana: number;
  meta: string;
}

export interface VisaoGeralData {
  cargaTotal: string;
  duracao: string;
  frequencia: string;
  intensidade: string;
  descricao?: string;
}

export interface RevisaoFinalData {
  descricao: string;
  simulado?: {
    duracao: string;
    formato: string;
  };
}

export interface PlanoEstudosData {
  objetivo: string;
  visaoGeral: VisaoGeralData;
  cronograma: SemanaData[];
  materiais: MaterialData[];
  estrategias: EstrategiaData[];
  checklist: ChecklistData[];
  revisaoFinal: RevisaoFinalData;
}

// Função para processar o plano de estudos da API
export function processarPlanoEstudos(dados: any): PlanoEstudosData {
  // Se já for um objeto estruturado, apenas normaliza
  if (dados && typeof dados === 'object' && dados.cronograma) {
    return {
      objetivo: dados.objetivo || '',
      visaoGeral: dados.visaoGeral || {
        cargaTotal: '',
        duracao: '',
        frequencia: '',
        intensidade: '',
      },
      cronograma: (dados.cronograma || []).map((sem: any) => ({
        semana: sem.semana || 1,
        titulo: sem.titulo || `Semana ${sem.semana || 1}`,
        dias: (sem.dias || []).map((dia: any) => ({
          dia: dia.dia || '',
          cargaHoraria: dia.cargaHoraria || '',
          topicos: (dia.topicos || []).map((t: any) => ({
            horario: t.horario || '',
            titulo: t.titulo || '',
            descricao: t.descricao || '',
          })),
        })),
      })),
      materiais: (dados.materiais || []).map((m: any) => ({
        tipo: m.tipo || '',
        titulo: m.titulo || '',
        autor: m.autor || '',
        detalhes: m.detalhes || '',
      })),
      estrategias: (dados.estrategias || []).map((e: any) => ({
        titulo: e.titulo || '',
        descricao: e.descricao || '',
      })),
      checklist: (dados.checklist || []).map((c: any) => ({
        semana: c.semana || 1,
        meta: c.meta || '',
      })),
      revisaoFinal: {
        descricao: dados.revisaoFinal?.descricao || '',
        simulado: dados.revisaoFinal?.simulado || undefined,
      },
    };
  }

  // Fallback para dados vazios
  return {
    objetivo: '',
    visaoGeral: {
      cargaTotal: '',
      duracao: '',
      frequencia: '',
      intensidade: '',
    },
    cronograma: [],
    materiais: [],
    estrategias: [],
    checklist: [],
    revisaoFinal: {
      descricao: '',
    },
  };
}
