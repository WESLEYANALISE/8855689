import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface ResultadoBusca {
  legislacao: string;
  artigo: string;
  texto_artigo: string;
  jurisprudencias: JurisprudenciaItem[];
  url_fonte: string;
}

interface JurisprudenciaResultadosAnimadosProps {
  resultado: ResultadoBusca;
  legislacaoInfo?: { sigla?: string; nome_completo: string } | null;
  onVoltar: () => void;
  onJurisprudenciaClick: (item: JurisprudenciaItem, index: number) => void;
  onAbrirFonte: (url: string) => void;
  onVerMaisCategoria?: (categoria: string, itens: JurisprudenciaItem[]) => void;
}

interface CategoriaConfig {
  label: string;
  icone: LucideIcon;
  // Cores do tema
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
}

// Paleta harmonizada usando tons de azul-violeta com variações sutis
const CATEGORIAS_CONFIG: Record<string, CategoriaConfig> = {
  sumula_vinculante: { 
    label: 'Súmulas Vinculantes', 
    icone: Crown, 
    bgPage: 'from-violet-900/80 via-violet-950/50 to-zinc-900/90',
    bgHeader: 'bg-violet-800/90',
    bgCard: 'bg-violet-900/25',
    bgCardHover: 'hover:bg-violet-800/40',
    bgIcone: 'bg-violet-700/50',
    textPrimary: 'text-violet-100',
    textSecondary: 'text-violet-300/70',
    badgeBg: 'bg-violet-600/50',
    badgeText: 'text-violet-200',
    borderCard: 'border-violet-600/20'
  },
  controle_constitucionalidade: { 
    label: 'Controle de Constitucionalidade', 
    icone: Gavel, 
    bgPage: 'from-fuchsia-900/80 via-fuchsia-950/50 to-zinc-900/90',
    bgHeader: 'bg-fuchsia-800/90',
    bgCard: 'bg-fuchsia-900/25',
    bgCardHover: 'hover:bg-fuchsia-800/40',
    bgIcone: 'bg-fuchsia-700/50',
    textPrimary: 'text-fuchsia-100',
    textSecondary: 'text-fuchsia-300/70',
    badgeBg: 'bg-fuchsia-600/50',
    badgeText: 'text-fuchsia-200',
    borderCard: 'border-fuchsia-600/20'
  },
  repercussao_geral: { 
    label: 'Repercussão Geral', 
    icone: Scale, 
    bgPage: 'from-purple-900/80 via-purple-950/50 to-zinc-900/90',
    bgHeader: 'bg-purple-800/90',
    bgCard: 'bg-purple-900/25',
    bgCardHover: 'hover:bg-purple-800/40',
    bgIcone: 'bg-purple-700/50',
    textPrimary: 'text-purple-100',
    textSecondary: 'text-purple-300/70',
    badgeBg: 'bg-purple-600/50',
    badgeText: 'text-purple-200',
    borderCard: 'border-purple-600/20'
  },
  recurso_repetitivo: { 
    label: 'Recursos Repetitivos', 
    icone: FileText, 
    bgPage: 'from-indigo-900/80 via-indigo-950/50 to-zinc-900/90',
    bgHeader: 'bg-indigo-800/90',
    bgCard: 'bg-indigo-900/25',
    bgCardHover: 'hover:bg-indigo-800/40',
    bgIcone: 'bg-indigo-700/50',
    textPrimary: 'text-indigo-100',
    textSecondary: 'text-indigo-300/70',
    badgeBg: 'bg-indigo-600/50',
    badgeText: 'text-indigo-200',
    borderCard: 'border-indigo-600/20'
  },
  sumula_stf: { 
    label: 'Súmulas do STF', 
    icone: BookOpen, 
    bgPage: 'from-blue-900/80 via-blue-950/50 to-zinc-900/90',
    bgHeader: 'bg-blue-800/90',
    bgCard: 'bg-blue-900/25',
    bgCardHover: 'hover:bg-blue-800/40',
    bgIcone: 'bg-blue-700/50',
    textPrimary: 'text-blue-100',
    textSecondary: 'text-blue-300/70',
    badgeBg: 'bg-blue-600/50',
    badgeText: 'text-blue-200',
    borderCard: 'border-blue-600/20'
  },
  sumula_stj: { 
    label: 'Súmulas do STJ', 
    icone: BookOpen, 
    bgPage: 'from-sky-900/80 via-sky-950/50 to-zinc-900/90',
    bgHeader: 'bg-sky-800/90',
    bgCard: 'bg-sky-900/25',
    bgCardHover: 'hover:bg-sky-800/40',
    bgIcone: 'bg-sky-700/50',
    textPrimary: 'text-sky-100',
    textSecondary: 'text-sky-300/70',
    badgeBg: 'bg-sky-600/50',
    badgeText: 'text-sky-200',
    borderCard: 'border-sky-600/20'
  },
  jurisprudencia_tese: { 
    label: 'Teses STJ', 
    icone: FileText, 
    bgPage: 'from-cyan-900/80 via-cyan-950/50 to-zinc-900/90',
    bgHeader: 'bg-cyan-800/90',
    bgCard: 'bg-cyan-900/25',
    bgCardHover: 'hover:bg-cyan-800/40',
    bgIcone: 'bg-cyan-700/50',
    textPrimary: 'text-cyan-100',
    textSecondary: 'text-cyan-300/70',
    badgeBg: 'bg-cyan-600/50',
    badgeText: 'text-cyan-200',
    borderCard: 'border-cyan-600/20'
  },
  posicionamento_agrupado: { 
    label: 'Posicionamentos Agrupados', 
    icone: Users, 
    bgPage: 'from-slate-800/80 via-slate-900/50 to-zinc-900/90',
    bgHeader: 'bg-slate-700/90',
    bgCard: 'bg-slate-800/25',
    bgCardHover: 'hover:bg-slate-700/40',
    bgIcone: 'bg-slate-600/50',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300/70',
    badgeBg: 'bg-slate-500/50',
    badgeText: 'text-slate-200',
    borderCard: 'border-slate-500/20'
  },
  posicionamento_isolado: { 
    label: 'Posicionamentos Isolados STJ', 
    icone: User, 
    bgPage: 'from-zinc-800/80 via-zinc-900/50 to-zinc-900/90',
    bgHeader: 'bg-zinc-700/90',
    bgCard: 'bg-zinc-800/25',
    bgCardHover: 'hover:bg-zinc-700/40',
    bgIcone: 'bg-zinc-600/50',
    textPrimary: 'text-zinc-100',
    textSecondary: 'text-zinc-300/70',
    badgeBg: 'bg-zinc-500/50',
    badgeText: 'text-zinc-200',
    borderCard: 'border-zinc-500/20'
  },
};

// Ordem de prioridade das categorias (da mais vinculante para menos)
const ORDEM_CATEGORIAS = [
  'sumula_vinculante',
  'controle_constitucionalidade',
  'repercussao_geral',
  'recurso_repetitivo',
  'sumula_stf',
  'sumula_stj',
  'jurisprudencia_tese',
  'posicionamento_agrupado',
  'posicionamento_isolado',
];

// Categorias que mostram apenas 3 itens + "ver mais"
const CATEGORIAS_COM_LIMITE = ['posicionamento_isolado', 'posicionamento_agrupado'];
const LIMITE_ITENS = 3;

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
  return limpo.length > 60 ? limpo.substring(0, 57) + '...' : limpo;
}

export default function JurisprudenciaResultadosAnimados({
  resultado,
  legislacaoInfo,
  onJurisprudenciaClick,
  onVerMaisCategoria,
}: JurisprudenciaResultadosAnimadosProps) {
  const [animacaoIniciada, setAnimacaoIniciada] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimacaoIniciada(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Agrupar jurisprudências por tipo (reclassificando EDIÇÃO N. para jurisprudencia_tese)
  const grupos = resultado.jurisprudencias.reduce((acc, item) => {
    // Reclassificar: itens com "EDIÇÃO N." no título vão para jurisprudencia_tese
    let tipoFinal = item.tipo;
    if (item.tipo === 'posicionamento_isolado' && /EDIÇÃO\s*N\.?\s*\d+/i.test(item.titulo)) {
      tipoFinal = 'jurisprudencia_tese';
    }
    
    if (!acc[tipoFinal]) acc[tipoFinal] = [];
    acc[tipoFinal].push({ ...item, tipo: tipoFinal });
    return acc;
  }, {} as Record<string, JurisprudenciaItem[]>);
  
  // Função para extrair identificador único para deduplicação
  const extrairChaveDeduplicacao = (item: JurisprudenciaItem): string => {
    const titulo = item.titulo.trim().toUpperCase();
    
    // Para repercussão geral: qualquer número no título é um tema
    // Isso trata tanto "Tema 592" quanto apenas "592" como o mesmo item
    if (item.tipo === 'repercussao_geral') {
      const matchNumero = titulo.match(/(\d+)/);
      if (matchNumero) return `tema_${matchNumero[1]}`;
    }
    
    // Para títulos que contêm "TEMA" explicitamente
    const matchTemaExplicito = titulo.match(/TEMA\s*(\d+)/i);
    if (matchTemaExplicito) return `tema_${matchTemaExplicito[1]}`;
    
    // Para ADI/ADC/ADPF: extrair tipo + número
    const matchAdi = titulo.match(/(ADI|ADC|ADPF)\s*\/?\s*(\d+)/i);
    if (matchAdi) return `${matchAdi[1].toLowerCase()}_${matchAdi[2]}`;
    
    // Para Súmulas: extrair tipo + número
    const matchSumula = titulo.match(/SÚMULA\s*(VINCULANTE)?\s*(\d+)/i);
    if (matchSumula) return matchSumula[1] ? `sv_${matchSumula[2]}` : `sumula_${matchSumula[2]}`;
    
    // Para Edições: extrair número
    const matchEdicao = titulo.match(/EDIÇÃO\s*N\.?\s*(\d+)/i);
    if (matchEdicao) return `edicao_${matchEdicao[1]}`;
    
    // Para processos: extrair tipo + número
    const matchProcesso = titulo.match(/(RHC|HC|REsp|AREsp)\s*([\d.]+)/i);
    if (matchProcesso) return `${matchProcesso[1].toLowerCase()}_${matchProcesso[2]}`;
    
    // Fallback: usar título normalizado
    return titulo.toLowerCase().replace(/\s+/g, '_');
  };
  
  // Deduplicar por identificador único dentro de cada grupo
  Object.keys(grupos).forEach(tipo => {
    const vistos = new Set<string>();
    grupos[tipo] = grupos[tipo].filter(item => {
      const chave = extrairChaveDeduplicacao(item);
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
  });
  
  // Ordenar cada grupo por data mais recente
  Object.keys(grupos).forEach(tipo => {
    grupos[tipo] = ordenarPorDataRecente(grupos[tipo]);
  });

  // Ordenar categorias pela ordem definida
  const categoriasOrdenadas = ORDEM_CATEGORIAS.filter(cat => grupos[cat]?.length > 0);

  // Calcular índice global para navegação
  const getGlobalIndex = (categoria: string, localIndex: number) => {
    let offset = 0;
    for (const cat of categoriasOrdenadas) {
      if (cat === categoria) break;
      offset += grupos[cat]?.length || 0;
    }
    return offset + localIndex;
  };

  return (
    <div className="min-h-screen bg-background/95">
      {/* Header com informações do artigo - alinhado à esquerda */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">
              Art. {resultado.artigo} - {legislacaoInfo?.sigla || legislacaoInfo?.nome_completo}
            </h1>
            <p className="text-muted-foreground text-xs">
              {resultado.jurisprudencias.length} jurisprudência(s) encontrada(s)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Lista de resultados por categoria */}
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="space-y-0">
          <AnimatePresence mode="wait">
            {categoriasOrdenadas.map((categoria, catIndex) => {
              const config = CATEGORIAS_CONFIG[categoria];
              const todosItens = grupos[categoria] || [];
              const temLimite = CATEGORIAS_COM_LIMITE.includes(categoria);
              const itensExibidos = temLimite ? todosItens.slice(0, LIMITE_ITENS) : todosItens;
              const temMais = temLimite && todosItens.length > LIMITE_ITENS;
              const Icone = config?.icone || FileText;

              return (
                <motion.div
                  key={categoria}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: catIndex * 0.1,
                    ease: [0.25, 0.1, 0.25, 1]
                  }}
                  className={`bg-gradient-to-b ${config?.bgPage || 'from-slate-950 to-slate-900/80'} bg-opacity-60`}
                >
                  {/* Header da categoria - degradê suave com bordas arredondadas */}
                  <div className="relative overflow-hidden mx-3 mt-3 rounded-xl">
                    {/* Degradê de fundo do header */}
                    <div className={`absolute inset-0 bg-gradient-to-r rounded-xl ${
                      categoria === 'sumula_vinculante' ? 'from-amber-600/30 via-amber-800/20 to-transparent' :
                      categoria === 'controle_constitucionalidade' ? 'from-rose-600/30 via-rose-800/20 to-transparent' :
                      categoria === 'repercussao_geral' ? 'from-purple-600/30 via-purple-800/20 to-transparent' :
                      categoria === 'recurso_repetitivo' ? 'from-blue-600/30 via-blue-800/20 to-transparent' :
                      categoria === 'sumula_stf' ? 'from-indigo-600/30 via-indigo-800/20 to-transparent' :
                      categoria === 'sumula_stj' ? 'from-cyan-600/30 via-cyan-800/20 to-transparent' :
                      categoria === 'jurisprudencia_tese' ? 'from-teal-600/30 via-teal-800/20 to-transparent' :
                      categoria === 'posicionamento_agrupado' ? 'from-emerald-600/30 via-emerald-800/20 to-transparent' :
                      'from-rose-600/30 via-rose-800/20 to-transparent'
                    }`} />
                    
                    <div className="relative flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${config?.bgIcone || 'bg-slate-800/50'} flex items-center justify-center backdrop-blur-sm`}>
                          <Icone className={`w-5 h-5 ${config?.textPrimary || 'text-slate-100'}`} />
                        </div>
                        <span className={`font-semibold text-base ${config?.textPrimary || 'text-slate-100'}`}>
                          {config?.label || categoria}
                        </span>
                      </div>
                      <div className={`min-w-7 h-7 px-2 rounded-full ${config?.badgeBg || 'bg-slate-700/50'} flex items-center justify-center backdrop-blur-sm`}>
                        <span className={`text-sm font-semibold ${config?.badgeText || 'text-slate-200'}`}>
                          {todosItens.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Itens da categoria - cards estilo da imagem */}
                  <div className="px-4 pt-2 pb-4 space-y-2">
                    {itensExibidos.map((item, itemIndex) => (
                      <motion.div
                        key={`${categoria}-${itemIndex}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: catIndex * 0.1 + itemIndex * 0.05,
                          ease: "easeOut"
                        }}
                        onClick={() => onJurisprudenciaClick(item, getGlobalIndex(categoria, itemIndex))}
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

                    {/* Botão "Ver mais" */}
                    {temMais && onVerMaisCategoria && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: catIndex * 0.1 + 0.3 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={() => onVerMaisCategoria(categoria, todosItens)}
                          className={`w-full mt-1 ${config?.textSecondary || 'text-slate-300/70'} hover:bg-white/5 justify-center gap-2`}
                        >
                          <span>Ver mais {todosItens.length - LIMITE_ITENS} itens</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {categoriasOrdenadas.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center px-4"
            >
              <Scale className="w-12 h-12 text-amber-500/50 mb-4" />
              <p className="text-white/60">Nenhuma jurisprudência encontrada para este artigo.</p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
