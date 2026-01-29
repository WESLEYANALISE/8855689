import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Scale, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SimulacaoTemas = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const [searchParams] = useSearchParams();
  const modo = searchParams.get('modo') || 'advogado';
  const [temas, setTemas] = useState<any[]>([]);
  const [temasFiltrados, setTemasFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");

  // Mapeamento de URL para nome da área na biblioteca
  const areaParaNomeBiblioteca: Record<string, string> = {
    criminal: "Direito Penal",
    civil: "Direito Civil",
    trabalhista: "Direito Do Trabalho",
    consumidor: "Direito do Consumidor"
  };

  // Mapeamento para nome correto da tabela do Vade Mecum
  const areaParaTabelaVadeMecum: Record<string, string> = {
    criminal: "CP - Código Penal",
    civil: "CC - Código Civil",
    trabalhista: "CLT – Consolidação das Leis do Trabalho",
    consumidor: "CDC – Código de Defesa do Consumidor"
  };

  const areaNomeBiblioteca = areaParaNomeBiblioteca[area || ""] || "Direito";
  const areaNomeTabelaVadeMecum = areaParaTabelaVadeMecum[area || ""] || "CP - Código Penal";

  useEffect(() => {
    buscarTemas();
  }, [area]);

  const buscarTemas = async () => {
    try {
      const { data, error } = await supabase
        .from('BIBLIOTECA-ESTUDOS')
        .select('Tema')
        .eq('Área', areaNomeBiblioteca)
        .order('Tema');

      if (error) throw error;

      // Remover duplicatas
      const temasUnicos = Array.from(new Set(data?.map(item => item.Tema)))
        .filter(Boolean)
        .map(tema => ({ tema }));

      setTemas(temasUnicos);
      setTemasFiltrados(temasUnicos);
    } catch (error) {
      console.error('Erro ao buscar temas:', error);
      toast.error('Erro ao carregar temas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pesquisa.trim()) {
      const filtrados = temas.filter(item => 
        item.tema?.toLowerCase().includes(pesquisa.toLowerCase())
      );
      setTemasFiltrados(filtrados);
    } else {
      setTemasFiltrados(temas);
    }
  }, [pesquisa, temas]);

  const selecionarTema = async (tema: string) => {
    setGerando(tema);
    try {
      // Buscar casos existentes para este tema
      const { data: casosExistentes, error: erroConsulta } = await supabase
        .from('SIMULACAO_CASOS')
        .select('*')
        .eq('area', areaNomeTabelaVadeMecum) // Usar nome da tabela do Vade Mecum
        .eq('tema', tema)
        .order('created_at', { ascending: false })
        .limit(3);

      if (erroConsulta) throw erroConsulta;

      const casosDisponiveis = casosExistentes || [];
      const quantidadeNecessaria = 3 - casosDisponiveis.length;

      // Se já temos 3 casos, ir direto para seleção
      if (casosDisponiveis.length >= 3) {
        toast.success('Casos encontrados!');
        navigate(`/simulacao-juridica/escolha-caso?area=${encodeURIComponent(areaNomeTabelaVadeMecum)}&tema=${encodeURIComponent(tema)}&modo=${modo}`);
        return;
      }

      // Gerar casos faltantes
      toast.info(`Gerando ${quantidadeNecessaria} caso(s)...`, { duration: 10000 });
      
      for (let i = 0; i < quantidadeNecessaria; i++) {
        console.log(`📤 Gerando caso ${i + 1}/${quantidadeNecessaria}:`, {
          area: areaNomeTabelaVadeMecum,
          tema
        });

        const { error: erroGerar } = await supabase.functions.invoke('gerar-caso-simulacao', {
          body: {
            area: areaNomeTabelaVadeMecum, // CRÍTICO: usar nome correto da tabela!
            tema: tema,
            nivel_dificuldade: 'Médio',
            modo: modo
          }
        });

        if (erroGerar) {
          console.error(`Erro ao gerar caso ${i + 1}:`, erroGerar);
        }
      }

      toast.success('Casos preparados!');
      navigate(`/simulacao-juridica/escolha-caso?area=${encodeURIComponent(areaNomeTabelaVadeMecum)}&tema=${encodeURIComponent(tema)}&modo=${modo}`);
    } catch (error: any) {
      console.error('Erro ao processar tema:', error);
      toast.error(error.message || 'Erro ao preparar casos');
    } finally {
      setGerando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate(`/simulacao-juridica/escolha-estudo/${area}?modo=${modo}`)}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {areaNomeBiblioteca}
          </h1>
          <p className="text-gray-300">
            Escolha um tema para começar sua simulação
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="mb-6 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Pesquisar tema..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="pl-10 bg-gray-800/50 border-amber-500/30 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        )}

        {/* Lista de temas */}
        {!loading && (
          <div className="space-y-4">
            {temasFiltrados.length === 0 && (
              <Card className="bg-gray-800/50 border-gray-700 animate-fade-in">
                <CardContent className="p-8 text-center">
                  <Scale className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">
                    {pesquisa ? 'Nenhum tema encontrado com este termo' : 'Nenhum tema disponível para esta área'}
                  </p>
                </CardContent>
              </Card>
            )}

            {temasFiltrados.map((item, index) => (
              <Card
                key={index}
                style={{ animationDelay: `${index * 0.1}s` }}
                className="h-full bg-gray-800/50 border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 cursor-pointer group animate-fade-in hover:scale-[1.02]"
                onClick={() => selecionarTema(item.tema)}
              >
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors flex-shrink-0">
                      <Scale className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors break-words">
                        {item.tema}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Clique para ver os casos disponíveis
                      </p>
                    </div>
                  </div>

                  {gerando === item.tema ? (
                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin flex-shrink-0 ml-2" />
                  ) : (
                    <ArrowLeft className="w-5 h-5 text-amber-500 rotate-180 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulacaoTemas;