import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, BookOpen, Crown, Gavel, FileText, Users, User, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LucideIcon } from 'lucide-react';

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
  enunciado?: string;
  ementa?: string;
  tese?: string;
  tribunal?: string;
  numero?: string;
  data?: string;
  relator?: string;
  link?: string;
  linkInteiroTeor?: string;
  linkTese?: string;
  linkEmenta?: string;
  textoTese?: string;
  textoEmenta?: string;
  posicionamentosSemelhantes?: number;
  destaques?: string;
  resumo?: string;
  pontosChave?: string[];
  processadoPorIA?: boolean;
}

interface JurisprudenciaCategoriaListaProps {
  categoria: string;
  itens: JurisprudenciaItem[];
  onItemClick: (item: JurisprudenciaItem, index: number) => void;
}

interface CategoriaConfig {
  label: string;
  icone: LucideIcon;
  bgPage: string;
  bgHeader: string;
  bgCard: string;
  bgCardHover: string;
  bgIcone: string;
  textPrimary: string;
  textSecondary: string;
  badgeBg: string;
  badgeText: string;
  borderCard: string;
  filterActive: string;
  filterInactive: string;
}

// Categorias com paletas de cores completas
const CATEGORIAS_CONFIG: Record<string, CategoriaConfig> = {
  sumula_vinculante: { 
    label: 'Súmulas Vinculantes', 
    icone: Crown, 
    bgPage: 'from-amber-900/80 via-amber-950/50 to-zinc-900/90',
    bgHeader: 'bg-amber-900/90',
    bgCard: 'bg-amber-900/30',
    bgCardHover: 'hover:bg-amber-900/50',
    bgIcone: 'bg-amber-800/50',
    textPrimary: 'text-amber-100',
    textSecondary: 'text-amber-300/70',
    badgeBg: 'bg-amber-700/50',
    badgeText: 'text-amber-200',
    borderCard: 'border-amber-700/20',
    filterActive: 'bg-amber-600 text-white',
    filterInactive: 'text-amber-300/70 hover:text-amber-200'
  },
  controle_constitucionalidade: { 
    label: 'Controle de Constitucionalidade', 
    icone: Gavel, 
    bgPage: 'from-rose-900/80 via-rose-950/50 to-zinc-900/90',
    bgHeader: 'bg-rose-900/90',
    bgCard: 'bg-rose-900/30',
    bgCardHover: 'hover:bg-rose-900/50',
    bgIcone: 'bg-rose-800/50',
    textPrimary: 'text-rose-100',
    textSecondary: 'text-rose-300/70',
    badgeBg: 'bg-rose-700/50',
    badgeText: 'text-rose-200',
    borderCard: 'border-rose-700/20',
    filterActive: 'bg-rose-600 text-white',
    filterInactive: 'text-rose-300/70 hover:text-rose-200'
  },
  repercussao_geral: { 
    label: 'Repercussão Geral', 
    icone: Scale, 
    bgPage: 'from-purple-900/80 via-purple-950/50 to-zinc-900/90',
    bgHeader: 'bg-purple-900/90',
    bgCard: 'bg-purple-900/30',
    bgCardHover: 'hover:bg-purple-900/50',
    bgIcone: 'bg-purple-800/50',
    textPrimary: 'text-purple-100',
    textSecondary: 'text-purple-300/70',
    badgeBg: 'bg-purple-700/50',
    badgeText: 'text-purple-200',
    borderCard: 'border-purple-700/20',
    filterActive: 'bg-purple-600 text-white',
    filterInactive: 'text-purple-300/70 hover:text-purple-200'
  },
  recurso_repetitivo: { 
    label: 'Recursos Repetitivos', 
    icone: FileText, 
    bgPage: 'from-blue-900/80 via-blue-950/50 to-zinc-900/90',
    bgHeader: 'bg-blue-900/90',
    bgCard: 'bg-blue-900/30',
    bgCardHover: 'hover:bg-blue-900/50',
    bgIcone: 'bg-blue-800/50',
    textPrimary: 'text-blue-100',
    textSecondary: 'text-blue-300/70',
    badgeBg: 'bg-blue-700/50',
    badgeText: 'text-blue-200',
    borderCard: 'border-blue-700/20',
    filterActive: 'bg-blue-600 text-white',
    filterInactive: 'text-blue-300/70 hover:text-blue-200'
  },
  sumula_stf: { 
    label: 'Súmulas do STF', 
    icone: BookOpen, 
    bgPage: 'from-indigo-900/80 via-indigo-950/50 to-zinc-900/90',
    bgHeader: 'bg-indigo-900/90',
    bgCard: 'bg-indigo-900/30',
    bgCardHover: 'hover:bg-indigo-900/50',
    bgIcone: 'bg-indigo-800/50',
    textPrimary: 'text-indigo-100',
    textSecondary: 'text-indigo-300/70',
    badgeBg: 'bg-indigo-700/50',
    badgeText: 'text-indigo-200',
    borderCard: 'border-indigo-700/20',
    filterActive: 'bg-indigo-600 text-white',
    filterInactive: 'text-indigo-300/70 hover:text-indigo-200'
  },
  sumula_stj: { 
    label: 'Súmulas do STJ', 
    icone: BookOpen, 
    bgPage: 'from-cyan-900/80 via-cyan-950/50 to-zinc-900/90',
    bgHeader: 'bg-cyan-900/90',
    bgCard: 'bg-cyan-900/30',
    bgCardHover: 'hover:bg-cyan-900/50',
    bgIcone: 'bg-cyan-800/50',
    textPrimary: 'text-cyan-100',
    textSecondary: 'text-cyan-300/70',
    badgeBg: 'bg-cyan-700/50',
    badgeText: 'text-cyan-200',
    borderCard: 'border-cyan-700/20',
    filterActive: 'bg-cyan-600 text-white',
    filterInactive: 'text-cyan-300/70 hover:text-cyan-200'
  },
  jurisprudencia_tese: { 
    label: 'Teses STJ', 
    icone: FileText, 
    bgPage: 'from-teal-900/80 via-teal-950/50 to-zinc-900/90',
    bgHeader: 'bg-teal-900/90',
    bgCard: 'bg-teal-900/30',
    bgCardHover: 'hover:bg-teal-900/50',
    bgIcone: 'bg-teal-800/50',
    textPrimary: 'text-teal-100',
    textSecondary: 'text-teal-300/70',
    badgeBg: 'bg-teal-700/50',
    badgeText: 'text-teal-200',
    borderCard: 'border-teal-700/20',
    filterActive: 'bg-teal-600 text-white',
    filterInactive: 'text-teal-300/70 hover:text-teal-200'
  },
  posicionamento_agrupado: { 
    label: 'Posicionamentos Agrupados', 
    icone: Users, 
    bgPage: 'from-emerald-900/80 via-emerald-950/50 to-zinc-900/90',
    bgHeader: 'bg-emerald-900/90',
    bgCard: 'bg-emerald-900/30',
    bgCardHover: 'hover:bg-emerald-900/50',
    bgIcone: 'bg-emerald-800/50',
    textPrimary: 'text-emerald-100',
    textSecondary: 'text-emerald-300/70',
    badgeBg: 'bg-emerald-700/50',
    badgeText: 'text-emerald-200',
    borderCard: 'border-emerald-700/20',
    filterActive: 'bg-emerald-600 text-white',
    filterInactive: 'text-emerald-300/70 hover:text-emerald-200'
  },
  posicionamento_isolado: { 
    label: 'Posicionamentos Isolados STJ', 
    icone: User, 
    bgPage: 'from-slate-800/80 via-slate-900/50 to-zinc-900/90',
    bgHeader: 'bg-slate-800/90',
    bgCard: 'bg-slate-800/30',
    bgCardHover: 'hover:bg-slate-800/50',
    bgIcone: 'bg-slate-700/50',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300/70',
    badgeBg: 'bg-slate-600/50',
    badgeText: 'text-slate-200',
    borderCard: 'border-slate-600/20',
    filterActive: 'bg-slate-600 text-white',
    filterInactive: 'text-slate-300/70 hover:text-slate-200'
  },
};

// Tipos de filtros ordenados por importância/peso (do mais para menos importante)
const FILTROS = [
  { key: 'edicao', label: 'Edições', peso: 1 },
  { key: 'hc', label: 'HC/RHC', peso: 2 },
  { key: 'resp', label: 'REsp', peso: 3 },
  { key: 'outros', label: 'Outros', peso: 4 },
];

function getTipoRecurso(titulo: string): string {
  if (/EDIÇÃO\s*N\.?\s*\d+/i.test(titulo)) return 'edicao';
  if (/\b(RHC|HC)\b/i.test(titulo)) return 'hc';
  if (/\b(AREsp|REsp|AgRg.*REsp)\b/i.test(titulo)) return 'resp';
  return 'outros';
}

// Função para parsear data no formato brasileiro ou ISO
function parseDataJurisprudencia(dataStr?: string): Date | null {
  if (!dataStr) return null;
  
  // Tenta formato brasileiro DD/MM/YYYY
  const matchBR = dataStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchBR) {
    return new Date(parseInt(matchBR[3]), parseInt(matchBR[2]) - 1, parseInt(matchBR[1]));
  }
  
  // Tenta formato ISO YYYY-MM-DD
  const matchISO = dataStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (matchISO) {
    return new Date(parseInt(matchISO[1]), parseInt(matchISO[2]) - 1, parseInt(matchISO[3]));
  }
  
  return null;
}

// Função para formatar data para exibição
function formatarData(dataStr?: string): string {
  if (!dataStr) return '';
  
  const data = parseDataJurisprudencia(dataStr);
  if (!data) return dataStr;
  
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Ordenar itens por data mais recente
function ordenarPorDataRecente(itens: JurisprudenciaItem[]): JurisprudenciaItem[] {
  return [...itens].sort((a, b) => {
    const dataA = parseDataJurisprudencia(a.data);
    const dataB = parseDataJurisprudencia(b.data);
    
    if (!dataA && !dataB) return 0;
    if (!dataA) return 1;
    if (!dataB) return -1;
    
    return dataB.getTime() - dataA.getTime();
  });
}

function getNumeroExibicao(item: JurisprudenciaItem): string {
  const matchAdi = item.titulo.match(/(ADI|ADC|ADPF)\s*\/?\s*(\d+)/i);
  if (matchAdi) return `${matchAdi[1].toUpperCase()} / ${matchAdi[2]}`;

  const matchTema = item.titulo.match(/TEMA\s*(\d+)/i);
  if (matchTema) return `Tema ${matchTema[1]}`;

  const matchSumula = item.titulo.match(/SÚMULA\s*(VINCULANTE)?\s*(\d+)/i);
  if (matchSumula) return matchSumula[1] ? `SV ${matchSumula[2]}` : `Súmula ${matchSumula[2]}`;

  const matchEdicao = item.titulo.match(/EDIÇÃO\s*N\.?\s*(\d+)/i);
  if (matchEdicao) return `Edição ${matchEdicao[1]}`;

  const matchProcesso = item.titulo.match(/(RHC|HC|REsp|AREsp)\s*([\d.]+)/i);
  if (matchProcesso) return `${matchProcesso[1]} ${matchProcesso[2]}`;

  return item.numero || item.titulo.substring(0, 20);
}

function getPreviewTexto(item: JurisprudenciaItem): string {
  const texto = item.enunciado || item.resumo || item.tese || item.ementa || item.texto || '';
  const limpo = texto.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  return limpo.length > 50 ? limpo.substring(0, 47) + '...' : limpo;
}

export default function JurisprudenciaCategoriaLista({
  categoria,
  itens,
  onItemClick,
}: JurisprudenciaCategoriaListaProps) {
  // Identificar o primeiro filtro com itens para ser o ativo inicial
  const primeiroFiltroComItens = useMemo(() => {
    for (const filtro of FILTROS) {
      const count = itens.filter(i => getTipoRecurso(i.titulo) === filtro.key).length;
      if (count > 0) return filtro.key;
    }
    return FILTROS[0].key;
  }, [itens]);
  
  const [filtroAtivo, setFiltroAtivo] = useState(primeiroFiltroComItens);
  
  const config = CATEGORIAS_CONFIG[categoria];
  const Icone = config?.icone || FileText;

  // Contagem por tipo (sem 'all')
  const contagens = useMemo(() => {
    return {
      edicao: itens.filter(i => getTipoRecurso(i.titulo) === 'edicao').length,
      hc: itens.filter(i => getTipoRecurso(i.titulo) === 'hc').length,
      resp: itens.filter(i => getTipoRecurso(i.titulo) === 'resp').length,
      outros: itens.filter(i => getTipoRecurso(i.titulo) === 'outros').length,
    };
  }, [itens]);

  // Itens filtrados e ordenados por data mais recente
  const itensFiltrados = useMemo(() => {
    const filtrados = itens.filter(i => getTipoRecurso(i.titulo) === filtroAtivo);
    return ordenarPorDataRecente(filtrados);
  }, [itens, filtroAtivo]);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${config?.bgPage || 'from-slate-950 to-slate-900/80'}`}>
      {/* Header da categoria */}
      <div className={`sticky top-0 z-10 ${config?.bgHeader || 'bg-slate-950/90'} backdrop-blur-sm`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${config?.bgIcone || 'bg-slate-800/50'} flex items-center justify-center`}>
              <Icone className={`w-5 h-5 ${config?.textSecondary || 'text-slate-300/70'}`} />
            </div>
            <span className={`font-semibold text-base ${config?.textPrimary || 'text-slate-100'}`}>
              {config?.label || categoria}
            </span>
          </div>
          <div className={`w-8 h-8 rounded-full ${config?.badgeBg || 'bg-slate-700/50'} flex items-center justify-center`}>
            <span className={`text-sm font-medium ${config?.badgeText || 'text-slate-200'}`}>
              {itens.length}
            </span>
          </div>
        </div>

        {/* Filtros - só mostra categorias que têm itens */}
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {FILTROS.map(filtro => {
            const count = contagens[filtro.key as keyof typeof contagens];
            if (count === 0) return null;
            
            return (
              <Button
                key={filtro.key}
                variant="ghost"
                size="sm"
                onClick={() => setFiltroAtivo(filtro.key)}
                className={`h-8 px-3 rounded-full text-sm transition-all ${
                  filtroAtivo === filtro.key 
                    ? config?.filterActive || 'bg-slate-600 text-white'
                    : config?.filterInactive || 'text-slate-300/70 hover:text-slate-200'
                }`}
              >
                {filtro.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Lista de itens */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="px-4 pb-4 space-y-2">
          {itensFiltrados.map((item, index) => (
            <motion.div
              key={`${item.titulo}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.25, 
                delay: index * 0.02,
                ease: "easeOut"
              }}
              onClick={() => onItemClick(item, index)}
              className={`
                flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200
                ${config?.bgCard || 'bg-slate-900/40'} ${config?.bgCardHover || 'hover:bg-slate-900/60'}
                border ${config?.borderCard || 'border-slate-700/30'}
                hover:translate-x-1 active:scale-[0.99]
              `}
            >
              {/* Ícone circular */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config?.bgIcone || 'bg-slate-800/50'} flex items-center justify-center`}>
                <Icone className={`w-5 h-5 ${config?.textSecondary || 'text-slate-300/70'}`} />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-base font-semibold ${config?.textPrimary || 'text-slate-100'}`}>
                    {getNumeroExibicao(item)}
                  </span>
                  {item.tribunal && (
                    <Badge className={`text-[10px] px-2 py-0.5 ${config?.badgeBg || 'bg-slate-700/50'} ${config?.badgeText || 'text-slate-200'} border-0 rounded-md`}>
                      {item.tribunal}
                    </Badge>
                  )}
                  {item.data && (
                    <span className={`text-[10px] ${config?.textSecondary || 'text-slate-300/70'}`}>
                      {formatarData(item.data)}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-0.5 ${config?.textSecondary || 'text-slate-300/70'} line-clamp-1`}>
                  {getPreviewTexto(item)}
                </p>
              </div>

              {/* Seta */}
              <ChevronRight className={`w-5 h-5 flex-shrink-0 ${config?.textSecondary || 'text-slate-300/70'}`} />
            </motion.div>
          ))}

          {itensFiltrados.length === 0 && (
            <p className={`text-center py-8 ${config?.textSecondary || 'text-slate-300/70'}`}>
              Nenhum item nesta categoria
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
