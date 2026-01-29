import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, User, FileText, ChevronRight } from 'lucide-react';

interface JurisprudenciaItem {
  tipo: string;
  titulo: string;
  texto: string;
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

interface JurisprudenciaListaCompactaProps {
  jurisprudencias: JurisprudenciaItem[];
  onJurisprudenciaClick: (item: JurisprudenciaItem, index: number) => void;
  categoriaAtiva?: string;
}

// Tipos de recursos com labels
const TIPOS_RECURSO = [
  { key: 'all', label: 'Todos' },
  { key: 'edicao', label: 'Edições' },
  { key: 'hc', label: 'HC/RHC' },
  { key: 'resp', label: 'REsp' },
  { key: 'outros', label: 'Outros' },
];

// Identificar tipo de recurso do título
function getTipoRecurso(titulo: string): string {
  if (/EDIÇÃO\s*N\.?\s*\d+/i.test(titulo)) return 'edicao';
  if (/\b(RHC|HC)\b/i.test(titulo)) return 'hc';
  if (/\b(AREsp|REsp|AgRg.*REsp)\b/i.test(titulo)) return 'resp';
  return 'outros';
}

// Função para extrair número do processo
function getNumeroProcesso(item: JurisprudenciaItem): string {
  // Edição de Jurisprudência em Teses
  const matchEdicao = item.titulo.match(/EDIÇÃO\s*N\.?\s*(\d+)[:\s]*(.{0,20})/i);
  if (matchEdicao) return `Edição ${matchEdicao[1]}${matchEdicao[2] ? ': ' + matchEdicao[2].trim() : ''}`;
  
  // RHC ou HC
  const matchHC = item.titulo.match(/(RHC|HC)\s*([\d.]+)/i);
  if (matchHC) return `${matchHC[1].toUpperCase()} ${matchHC[2]}`;
  
  // REsp, AREsp
  const matchResp = item.titulo.match(/(AREsp|REsp)\s*([\d.]+)/i);
  if (matchResp) return `${matchResp[1]} ${matchResp[2]}`;
  
  // AgRg
  const matchAgRg = item.titulo.match(/AgRg.*?([\d.]+)/i);
  if (matchAgRg) return `AgRg ${matchAgRg[1]}`;
  
  return item.titulo.substring(0, 25);
}

// Preview curto
function getPreviewTexto(item: JurisprudenciaItem): string {
  const texto = item.resumo || item.ementa || item.texto || '';
  const limpo = texto.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  return limpo.length > 60 ? limpo.substring(0, 57) + '...' : limpo;
}

export default function JurisprudenciaListaCompacta({
  jurisprudencias,
  onJurisprudenciaClick,
  categoriaAtiva,
}: JurisprudenciaListaCompactaProps) {
  const [displayCount, setDisplayCount] = useState(20);
  const [filtroTipo, setFiltroTipo] = useState('all');

  // Filtrar por categoria e tipo
  const itensFiltrados = useMemo(() => {
    let itens = categoriaAtiva
      ? jurisprudencias.filter(j => j.tipo === categoriaAtiva)
      : jurisprudencias;
    
    if (filtroTipo !== 'all') {
      itens = itens.filter(j => getTipoRecurso(j.titulo) === filtroTipo);
    }
    
    return itens;
  }, [jurisprudencias, categoriaAtiva, filtroTipo]);

  // Contagem por tipo
  const contagemTipos = useMemo(() => {
    const base = categoriaAtiva
      ? jurisprudencias.filter(j => j.tipo === categoriaAtiva)
      : jurisprudencias;
    
    return {
      all: base.length,
      edicao: base.filter(j => getTipoRecurso(j.titulo) === 'edicao').length,
      hc: base.filter(j => getTipoRecurso(j.titulo) === 'hc').length,
      resp: base.filter(j => getTipoRecurso(j.titulo) === 'resp').length,
      outros: base.filter(j => getTipoRecurso(j.titulo) === 'outros').length,
    };
  }, [jurisprudencias, categoriaAtiva]);

  const itensExibidos = itensFiltrados.slice(0, displayCount);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < itensFiltrados.length) {
          setDisplayCount(prev => Math.min(prev + 15, itensFiltrados.length));
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('jurisprudencia-sentinel-lista');
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, [displayCount, itensFiltrados.length]);

  useEffect(() => {
    setDisplayCount(20);
  }, [categoriaAtiva, filtroTipo]);

  if (jurisprudencias.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-muted-foreground text-xs">
        <FileText className="w-3.5 h-3.5 mr-1.5 opacity-50" />
        Nenhum posicionamento
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Filtros por tipo */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-rose-500/20">
        {TIPOS_RECURSO.map(tipo => (
          <Button
            key={tipo.key}
            variant={filtroTipo === tipo.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFiltroTipo(tipo.key)}
            className={`h-6 px-2 text-[10px] ${
              filtroTipo === tipo.key 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
            disabled={contagemTipos[tipo.key as keyof typeof contagemTipos] === 0}
          >
            {tipo.label}
            <span className="ml-1 opacity-70">
              ({contagemTipos[tipo.key as keyof typeof contagemTipos]})
            </span>
          </Button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
        {itensExibidos.map((item, idx) => {
          const isAgrupado = item.tipo === 'posicionamento_agrupado';
          const tipoRecurso = getTipoRecurso(item.titulo);
          
          return (
            <div
              key={`${item.titulo}-${idx}`}
              onClick={() => onJurisprudenciaClick(item, idx)}
              className="
                flex items-center gap-2 p-2 rounded-md cursor-pointer
                bg-rose-500/10 hover:bg-rose-500/20 transition-colors group
                border-l-2 border-rose-500/50
              "
            >
              {/* Ícone tipo */}
              <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                isAgrupado ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              }`}>
                {isAgrupado ? (
                  <Users className="w-3 h-3 text-emerald-400" />
                ) : (
                  <User className="w-3 h-3 text-rose-400" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-rose-100 truncate">
                    {getNumeroProcesso(item)}
                  </span>
                  {item.tribunal && (
                    <Badge 
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-3.5 font-normal border-rose-500/40 text-rose-400"
                    >
                      {item.tribunal}
                    </Badge>
                  )}
                  {item.posicionamentosSemelhantes && item.posicionamentosSemelhantes > 1 && (
                    <span className="text-[9px] text-emerald-400 font-medium">
                      +{item.posicionamentosSemelhantes}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-rose-300/70 line-clamp-1 mt-0.5">
                  {getPreviewTexto(item)}
                </p>
              </div>

              {/* Seta */}
              <ChevronRight className="w-3 h-3 text-rose-500/40 group-hover:text-rose-400 transition-colors flex-shrink-0" />
            </div>
          );
        })}

        {displayCount < itensFiltrados.length && (
          <div id="jurisprudencia-sentinel-lista" className="flex justify-center py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500/50" />
          </div>
        )}

        {itensFiltrados.length === 0 && (
          <p className="text-center text-[10px] text-rose-400/60 py-3">
            Nenhum item nesta categoria
          </p>
        )}
      </div>
    </div>
  );
}
