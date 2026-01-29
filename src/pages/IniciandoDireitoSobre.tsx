import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle, BookOpen, GraduationCap } from "lucide-react";
import { useCursosCache } from "@/hooks/useCursosCache";

const CORES_AREAS: Record<string, { hex: string; glow: string }> = {
  "Direito Penal": { 
    hex: "#ef4444",
    glow: "0 0 30px rgba(239, 68, 68, 0.5)"
  },
  "Direito Civil": { 
    hex: "#3b82f6",
    glow: "0 0 30px rgba(59, 130, 246, 0.5)"
  },
  "Direito Constitucional": { 
    hex: "#10b981",
    glow: "0 0 30px rgba(16, 185, 129, 0.5)"
  },
  "Direito Administrativo": { 
    hex: "#a855f7",
    glow: "0 0 30px rgba(168, 85, 247, 0.5)"
  },
  "Direito Trabalhista": { 
    hex: "#f59e0b",
    glow: "0 0 30px rgba(245, 158, 11, 0.5)"
  },
  "Direito Empresarial": { 
    hex: "#ec4899",
    glow: "0 0 30px rgba(236, 72, 153, 0.5)"
  },
  "Direito Tributário": { 
    hex: "#6366f1",
    glow: "0 0 30px rgba(99, 102, 241, 0.5)"
  },
  "Direito Processual Civil": { 
    hex: "#06b6d4",
    glow: "0 0 30px rgba(6, 182, 212, 0.5)"
  },
  "Processo Civil": { 
    hex: "#06b6d4",
    glow: "0 0 30px rgba(6, 182, 212, 0.5)"
  },
  "Direito Processual Penal": { 
    hex: "#f97316",
    glow: "0 0 30px rgba(249, 115, 22, 0.5)"
  },
  "Direito do Trabalho": { 
    hex: "#f59e0b",
    glow: "0 0 30px rgba(245, 158, 11, 0.5)"
  }
};

const DESCRICOES_AREAS: Record<string, string> = {
  "Direito Penal": "Desvende o Direito Penal: fundamentos, evolução e princípios que moldam a justiça e limitam o poder punitivo do Estado. Prepare-se!",
  "Direito Civil": "Explore os fundamentos do Direito Civil: contratos, propriedade, família e sucessões. Base essencial para sua formação jurídica!",
  "Direito Constitucional": "Compreenda a Constituição: direitos fundamentais, organização do Estado e princípios que regem nossa democracia.",
  "Direito Administrativo": "Entenda a estrutura e funcionamento da Administração Pública: atos, contratos, licitações e responsabilidade do Estado.",
  "Direito Trabalhista": "Domine as relações de trabalho: direitos do trabalhador, contrato de trabalho, jornada e rescisão. Essencial para o mercado!",
  "Direito Empresarial": "Aprenda sobre sociedades, contratos empresariais, títulos de crédito e recuperação judicial. O Direito dos negócios!",
  "Direito Tributário": "Desvende o sistema tributário brasileiro: impostos, taxas, contribuições e os princípios que regem a tributação.",
  "Direito Processual Civil": "Domine o processo civil: procedimentos, recursos, prazos e estratégias para defesa de direitos na Justiça.",
  "Direito Processual Penal": "Entenda o processo penal: investigação, ação penal, provas, recursos e garantias do acusado. Justiça criminal na prática!"
};

export default function IniciandoDireitoSobre() {
  const navigate = useNavigate();
  const { area } = useParams<{ area: string }>();
  const [totalTemas, setTotalTemas] = useState(0);
  const [primeiraCapaUrl, setPrimeiraCapaUrl] = useState<string>("");
  const { cursos, loading: cursosLoading } = useCursosCache();
  
  const areaDecoded = area ? decodeURIComponent(area) : '';
  const corData = CORES_AREAS[areaDecoded] || { hex: '#6b7280', glow: '0 0 30px rgba(107, 114, 128, 0.5)' };
  const descricao = DESCRICOES_AREAS[areaDecoded] || "Explore os conceitos fundamentais desta área do Direito através de videoaulas e conteúdo detalhado.";

  useEffect(() => {
    if (!cursosLoading && areaDecoded) {
      const temasArea = cursos.filter(c => c.area === areaDecoded);
      setTotalTemas(temasArea.length);
      
      // Pegar a primeira capa disponível
      const primeiraCapa = temasArea.find(c => c['capa-aula']);
      if (primeiraCapa) {
        setPrimeiraCapaUrl(primeiraCapa['capa-aula']);
      }
    }
  }, [cursosLoading, cursos, areaDecoded]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-20">
      <div className="max-w-md w-full">
        <div 
          className="relative overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 70%, ${corData.hex}30 100%)`,
            border: `2px solid ${corData.hex}40`,
            boxShadow: corData.glow
          }}
        >
          {/* Capa/Imagem superior */}
          <div className="relative h-56 bg-muted overflow-hidden">
            {primeiraCapaUrl ? (
              <>
                <img 
                  src={primeiraCapaUrl} 
                  alt={areaDecoded}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80" />
              </>
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: `${corData.hex}20` }}
              >
                <GraduationCap className="w-20 h-20 opacity-50" style={{ color: corData.hex }} />
              </div>
            )}
            
            {/* Título sobreposto à imagem */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="text-center">
                <p className="text-white/90 text-sm font-medium mb-1">
                  {areaDecoded} • Aula 1
                </p>
                <h1 className="text-white text-2xl font-bold leading-tight">
                  {areaDecoded}
                </h1>
              </div>
            </div>
          </div>

          {/* Conteúdo inferior */}
          <div className="bg-card/95 backdrop-blur-sm p-6">
            <p className="text-muted-foreground text-center leading-relaxed mb-6">
              {descricao}
            </p>

            {/* Botão Iniciar Aula */}
            <button
              onClick={() => navigate(`/iniciando-direito/${encodeURIComponent(areaDecoded)}/temas`)}
              className="w-full py-4 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: corData.hex,
                boxShadow: `0 4px 20px ${corData.hex}60`
              }}
            >
              <PlayCircle className="w-5 h-5" />
              Iniciar Aula
            </button>

            {/* Botão Voltar para Módulos - abaixo do Iniciar */}
            <button
              onClick={() => navigate('/iniciando-direito')}
              className="mt-3 w-full py-3 rounded-xl font-medium text-muted-foreground border border-border hover:border-primary hover:text-foreground transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para módulos
            </button>

            {/* Info adicional */}
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" style={{ color: corData.hex }} />
                <span>{totalTemas} {totalTemas === 1 ? 'tema' : 'temas'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
