import { Badge } from '@/components/ui/badge';
import { Scale, BookMarked, FileText, Gavel, BookOpen } from 'lucide-react';

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
  textoTese?: string;
  textoEmenta?: string;
  posicionamentosSemelhantes?: number;
  destaques?: string;
  resumo?: string;
  pontosChave?: string[];
  processadoPorIA?: boolean;
}

interface JurisprudenciaCardsGridProps {
  jurisprudencias: JurisprudenciaItem[];
  onJurisprudenciaClick: (item: JurisprudenciaItem, index: number) => void;
}

// Configuração de cores por tipo - paleta rose/vermelha
const TIPO_CONFIG: Record<string, { 
  corIcone: string;
  corBg: string;
  icone: React.ElementType;
}> = {
  controle_constitucionalidade: { 
    corIcone: 'text-rose-400',
    corBg: 'bg-rose-500/20',
    icone: Gavel,
  },
  sumula_vinculante: { 
    corIcone: 'text-amber-400',
    corBg: 'bg-amber-500/20',
    icone: BookMarked,
  },
  repercussao_geral: { 
    corIcone: 'text-purple-400',
    corBg: 'bg-purple-500/20',
    icone: Scale,
  },
  recurso_repetitivo: { 
    corIcone: 'text-blue-400',
    corBg: 'bg-blue-500/20',
    icone: FileText,
  },
  sumula_stj: { 
    corIcone: 'text-cyan-400',
    corBg: 'bg-cyan-500/20',
    icone: BookOpen,
  },
  sumula_stf: { 
    corIcone: 'text-indigo-400',
    corBg: 'bg-indigo-500/20',
    icone: BookOpen,
  },
  jurisprudencia_tese: { 
    corIcone: 'text-teal-400',
    corBg: 'bg-teal-500/20',
    icone: FileText,
  },
};

// Extrair identificador do título
function extrairIdentificador(titulo: string, tipo: string): string {
  const matchControle = titulo.match(/(ADI|ADC|ADPF)\s*(\d+)/i);
  if (matchControle) return `${matchControle[1].toUpperCase()} ${matchControle[2]}`;
  
  const matchTema = titulo.match(/Tema\s*(?:n[°º]?\s*)?(\d+)/i);
  if (matchTema) return `Tema ${matchTema[1]}`;
  
  const matchSumula = titulo.match(/Súmula\s*(?:Vinculante\s*)?(?:n[°º]?\s*)?(\d+)/i);
  if (matchSumula) {
    if (tipo === 'sumula_vinculante') return `SV ${matchSumula[1]}`;
    return `Súmula ${matchSumula[1]}`;
  }
  
  const matchRecurso = titulo.match(/(REsp|AREsp|AgRg|RE|ARE)\s*([\d./-]+)/i);
  if (matchRecurso) return `${matchRecurso[1]} ${matchRecurso[2]}`;
  
  if (tipo === 'jurisprudencia_tese') return 'Jurisprudência';
  
  return titulo.substring(0, 12);
}

// Preview curto
function getPreviewTexto(item: JurisprudenciaItem): string {
  const texto = item.enunciado || item.texto || item.ementa || '';
  const limpo = texto.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (limpo.length <= 55) return limpo;
  return limpo.substring(0, 52) + '...';
}

export default function JurisprudenciaCardsGrid({ 
  jurisprudencias, 
  onJurisprudenciaClick 
}: JurisprudenciaCardsGridProps) {
  if (!jurisprudencias || jurisprudencias.length === 0) {
    return (
      <div className="text-center py-4 text-rose-400/60 text-xs">
        Nenhum precedente encontrado
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {jurisprudencias.map((item, idx) => {
        const config = TIPO_CONFIG[item.tipo] || {
          corIcone: 'text-rose-400',
          corBg: 'bg-rose-500/20',
          icone: FileText,
        };
        const Icone = config.icone;
        const identificador = extrairIdentificador(item.titulo, item.tipo);
        const previewTexto = getPreviewTexto(item);

        return (
          <div 
            key={idx}
            onClick={() => onJurisprudenciaClick(item, idx)}
            className="
              p-2.5 rounded-lg cursor-pointer
              bg-rose-500/10 hover:bg-rose-500/20 
              border-l-2 border-rose-500/50
              transition-all duration-150 active:scale-[0.98]
            "
          >
            {/* Header: Ícone + Identificador + Tribunal */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-5 h-5 rounded flex items-center justify-center ${config.corBg}`}>
                <Icone className={`w-3 h-3 ${config.corIcone}`} />
              </div>
              <span className="font-semibold text-xs text-rose-100">
                {identificador}
              </span>
              {item.tribunal && (
                <Badge 
                  variant="outline"
                  className={`text-[9px] px-1 py-0 h-3.5 font-medium ml-auto ${
                    item.tribunal === 'STF' 
                      ? 'border-green-500/50 text-green-400' 
                      : 'border-blue-500/50 text-blue-400'
                  }`}
                >
                  {item.tribunal}
                </Badge>
              )}
            </div>

            {/* Preview */}
            <p className="text-[10px] text-rose-300/70 line-clamp-2 leading-relaxed">
              {previewTexto}
            </p>
          </div>
        );
      })}
    </div>
  );
}
