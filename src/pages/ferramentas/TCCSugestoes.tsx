import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lightbulb, Sparkles, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TCCTemaCard from "@/components/tcc/TCCTemaCard";

interface TCCTema {
  id: string;
  area_direito: string;
  tema: string;
  descricao: string | null;
  nivel_dificuldade: string | null;
  tema_saturado: boolean;
  relevancia: number;
  anos_recomendados: number[] | null;
  legislacao_relacionada: string[] | null;
  oportunidade: boolean;
}

// Ano atual para cálculos de formatura
const ANO_ATUAL = new Date().getFullYear();

const ANOS_FACULDADE = [
  { value: 1, label: "1º Ano", anoFormatura: ANO_ATUAL + 4 },
  { value: 2, label: "2º Ano", anoFormatura: ANO_ATUAL + 3 },
  { value: 3, label: "3º Ano", anoFormatura: ANO_ATUAL + 2 },
  { value: 4, label: "4º Ano", anoFormatura: ANO_ATUAL + 1 },
  { value: 5, label: "5º Ano", anoFormatura: ANO_ATUAL },
];

// Áreas com tendências futuras destacadas
const AREAS = [
  "Constitucional", "Penal", "Civil", "Trabalhista", "Tributário",
  "Digital", "Ambiental", "Empresarial", "Internacional"
];

// Áreas emergentes que devem ser priorizadas para anos futuros
const AREAS_EMERGENTES = ["Digital", "Ambiental", "Internacional"];

// Temas de tendência futura baseados no contexto 2025-2027
const TEMAS_TENDENCIA_FUTURA = [
  "inteligência artificial", "ia", "machine learning", "lgpd", "dados pessoais",
  "criptomoedas", "blockchain", "metaverso", "esg", "compliance digital",
  "direito digital", "crimes cibernéticos", "deepfake", "regulação de ia"
];

const TCCSugestoes = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null);
  const [areasSelecionadas, setAreasSelecionadas] = useState<string[]>([]);
  const [temas, setTemas] = useState<TCCTema[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);

  useEffect(() => {
    const areaParam = searchParams.get("area");
    if (areaParam) {
      setAreasSelecionadas([areaParam]);
      carregarTemas([areaParam]);
    } else {
      carregarTemas();
    }
  }, []);

  const carregarTemas = async (areas?: string[], ano?: number) => {
    setLoading(true);
    try {
      let query = supabase
        .from("tcc_temas_sugeridos")
        .select("*")
        .order("relevancia", { ascending: false });

      if (areas && areas.length > 0) {
        query = query.in("area_direito", areas);
      }

      if (ano) {
        query = query.contains("anos_recomendados", [ano]);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      // Aplicar lógica inteligente baseada no ano de formatura
      let temasProcessados = data || [];
      
      if (ano) {
        const infoAno = ANOS_FACULDADE.find(a => a.value === ano);
        const anoFormatura = infoAno?.anoFormatura || ANO_ATUAL;
        const anosAteFormalura = anoFormatura - ANO_ATUAL;
        
        temasProcessados = temasProcessados.map(tema => {
          let bonusRelevancia = 0;
          const temaLower = tema.tema.toLowerCase();
          const descricaoLower = (tema.descricao || '').toLowerCase();
          const textoCompleto = `${temaLower} ${descricaoLower}`;
          
          // Bonus para temas de tendência futura (IA, Digital, etc)
          const ehTendenciaFutura = TEMAS_TENDENCIA_FUTURA.some(t => textoCompleto.includes(t));
          const ehAreaEmergente = AREAS_EMERGENTES.some(a => 
            tema.area_direito.toLowerCase().includes(a.toLowerCase())
          );
          
          // Para alunos que vão se formar em 2+ anos, priorizar tendências
          if (anosAteFormalura >= 2 && (ehTendenciaFutura || ehAreaEmergente)) {
            bonusRelevancia += 30;
          }
          
          // Para alunos do 1º-2º ano, sugerir temas clássicos + introdução a tendências
          if (ano <= 2) {
            if (ehTendenciaFutura) bonusRelevancia += 20; // Tendências são boas para explorar
            if (tema.nivel_dificuldade === 'basico') bonusRelevancia += 10;
          }
          
          // Para alunos do 3º ano, equilibrar
          if (ano === 3) {
            if (ehTendenciaFutura) bonusRelevancia += 25;
            if (ehAreaEmergente) bonusRelevancia += 15;
          }
          
          // Para alunos do 4º-5º ano, focar em diferenciação e atualidade
          if (ano >= 4) {
            if (!tema.tema_saturado) bonusRelevancia += 15;
            if (ehTendenciaFutura) bonusRelevancia += 35; // IA é diferencial
            if (tema.oportunidade) bonusRelevancia += 20;
          }
          
          return {
            ...tema,
            relevancia: tema.relevancia + bonusRelevancia,
            _ehTendenciaFutura: ehTendenciaFutura || ehAreaEmergente
          };
        });
        
        // Reordenar com nova relevância
        temasProcessados.sort((a, b) => b.relevancia - a.relevancia);
      }
      
      setTemas(temasProcessados);
      setFiltrosAplicados(true);
    } catch (error) {
      console.error("Erro ao carregar temas:", error);
      toast.error("Erro ao carregar sugestões");
    } finally {
      setLoading(false);
    }
  };

  const toggleArea = (area: string) => {
    setAreasSelecionadas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const aplicarFiltros = () => {
    carregarTemas(
      areasSelecionadas.length > 0 ? areasSelecionadas : undefined,
      anoSelecionado || undefined
    );
  };

  const handleBuscarTCCs = (tema: string) => {
    navigate(`/ferramentas/tcc/buscar?q=${encodeURIComponent(tema)}`);
  };

  // Separar temas por categoria
  const temasTendencia = temas.filter((t: any) => t._ehTendenciaFutura && !t.tema_saturado);
  const temasOportunidade = temas.filter((t) => t.oportunidade && !(t as any)._ehTendenciaFutura);
  const temasRegulares = temas.filter((t) => !t.oportunidade && !t.tema_saturado && !(t as any)._ehTendenciaFutura);
  const temasSaturados = temas.filter((t) => t.tema_saturado);

  // Calcular ano de formatura para exibição
  const infoAnoSelecionado = ANOS_FACULDADE.find(a => a.value === anoSelecionado);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas/tcc")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Sugestões de Temas
            </h1>
            <p className="text-xs text-muted-foreground">
              Escolha seu ano e áreas de interesse
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Ano da Faculdade */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Em qual ano você está?</p>
              <div className="flex flex-wrap gap-2">
                {ANOS_FACULDADE.map((ano) => (
                  <Badge
                    key={ano.value}
                    variant={anoSelecionado === ano.value ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setAnoSelecionado(
                      anoSelecionado === ano.value ? null : ano.value
                    )}
                  >
                    {ano.label}
                  </Badge>
                ))}
              </div>
              {infoAnoSelecionado && (
                <p className="text-xs text-muted-foreground">
                  Formatura prevista em {infoAnoSelecionado.anoFormatura} • 
                  Temas priorizados para esse contexto
                </p>
              )}
            </div>

            {/* Áreas de Interesse */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Áreas de interesse</p>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((area) => (
                  <Badge
                    key={area}
                    variant={areasSelecionadas.includes(area) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => toggleArea(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <Button onClick={aplicarFiltros} className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Gerar Sugestões Personalizadas
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {filtrosAplicados && !loading && (
          <div className="space-y-6">
            {/* Tendências Futuras - IA, Digital, etc */}
            {temasTendencia.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-purple-600 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tendências Futuras - IA & Digital ({temasTendencia.length})
                </h2>
                <p className="text-xs text-muted-foreground -mt-1">
                  Temas emergentes com alta relevância para os próximos anos
                </p>
                <div className="space-y-3">
                  {temasTendencia.slice(0, 5).map((tema) => (
                    <TCCTemaCard
                      key={tema.id}
                      tema={tema}
                      onBuscarTCCs={handleBuscarTCCs}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Oportunidades */}
            {temasOportunidade.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-green-600 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Alta Oportunidade ({temasOportunidade.length})
                </h2>
                <div className="space-y-3">
                  {temasOportunidade.map((tema) => (
                    <TCCTemaCard
                      key={tema.id}
                      tema={tema}
                      onBuscarTCCs={handleBuscarTCCs}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regulares */}
            {temasRegulares.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Outros Temas Relevantes ({temasRegulares.length})
                </h2>
                <div className="space-y-3">
                  {temasRegulares.map((tema) => (
                    <TCCTemaCard
                      key={tema.id}
                      tema={tema}
                      onBuscarTCCs={handleBuscarTCCs}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Saturados */}
            {temasSaturados.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-yellow-600 flex items-center gap-2">
                  Temas Saturados - Busque Diferenciais ({temasSaturados.length})
                </h2>
                <div className="space-y-3">
                  {temasSaturados.map((tema) => (
                    <TCCTemaCard
                      key={tema.id}
                      tema={tema}
                      onBuscarTCCs={handleBuscarTCCs}
                    />
                  ))}
                </div>
              </div>
            )}

            {temas.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhum tema encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajuste os filtros para ver mais sugestões
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TCCSugestoes;
