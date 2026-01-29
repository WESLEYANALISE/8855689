import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, BookOpen, GraduationCap, Building, Calendar, Filter, Loader2, ExternalLink, Star, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TCCResult {
  id?: string;
  titulo: string;
  autor: string;
  ano: number | null;
  instituicao: string;
  tipo: 'tcc' | 'dissertacao' | 'tese';
  area_direito: string | null;
  link_acesso: string;
  resumo_original: string | null;
  fonte: string;
  relevancia: 'alta' | 'media' | 'baixa';
}

const AREAS_DIREITO = [
  { value: 'all', label: 'Todas as áreas' },
  { value: 'constitucional', label: 'Constitucional' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'civil', label: 'Civil' },
  { value: 'penal', label: 'Penal' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributário', label: 'Tributário' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'processual civil', label: 'Processual Civil' },
  { value: 'processual penal', label: 'Processual Penal' },
  { value: 'internacional', label: 'Internacional' },
  { value: 'digital', label: 'Digital/Tecnologia' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'família', label: 'Família e Sucessões' },
  { value: 'previdenciário', label: 'Previdenciário' },
];

const TIPOS_TRABALHO = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'tcc', label: 'TCC' },
  { value: 'dissertacao', label: 'Dissertação' },
  { value: 'tese', label: 'Tese' },
];

const anoAtual = new Date().getFullYear();
const ANOS = [
  { value: 'all', label: 'Todos os anos' },
  ...Array.from({ length: 15 }, (_, i) => ({
    value: String(anoAtual - i),
    label: String(anoAtual - i),
  })),
];

const TCC = () => {
  const navigate = useNavigate();
  const [palavraChave, setPalavraChave] = useState("");
  const [areaDireito, setAreaDireito] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [ano, setAno] = useState("all");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<TCCResult[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [fontes, setFontes] = useState({ bdtd: 0, oasisbr: 0 });
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const buscarTCCs = async (paginaAtual = 1) => {
    if (!palavraChave.trim() || palavraChave.length < 3) {
      toast.error("Digite pelo menos 3 caracteres para buscar");
      return;
    }

    setLoading(true);
    setBuscaRealizada(true);

    try {
      const { data, error } = await supabase.functions.invoke("buscar-tcc", {
        body: {
          palavraChave: palavraChave.trim(),
          tipo: tipo === 'all' ? null : tipo,
          areaDireito: areaDireito === 'all' ? null : areaDireito,
          ano: ano !== 'all' ? parseInt(ano) : null,
          pagina: paginaAtual,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResultados(data.resultados || []);
        setTotal(data.total || 0);
        setPagina(data.pagina || 1);
        setTotalPaginas(data.totalPaginas || 0);
        setFontes(data.fontes || { bdtd: 0, oasisbr: 0 });

        if (data.resultados.length === 0) {
          toast.info("Nenhum TCC encontrado com esses critérios");
        } else {
          toast.success(`${data.total} trabalhos encontrados`);
        }
      } else {
        throw new Error(data.error || "Erro na busca");
      }
    } catch (error) {
      console.error("Erro ao buscar TCCs:", error);
      toast.error("Erro ao buscar trabalhos acadêmicos");
    } finally {
      setLoading(false);
    }
  };

  const salvarEAnalisar = async (tcc: TCCResult) => {
    try {
      // Primeiro salvar no banco
      const { data: insertedData, error: insertError } = await supabase
        .from("tcc_pesquisas")
        .insert({
          titulo: tcc.titulo,
          autor: tcc.autor,
          ano: tcc.ano,
          instituicao: tcc.instituicao,
          tipo: tcc.tipo,
          area_direito: tcc.area_direito,
          link_acesso: tcc.link_acesso,
          resumo_original: tcc.resumo_original,
          fonte: tcc.fonte,
          relevancia: tcc.relevancia,
        })
        .select()
        .single();

      if (insertError) {
        // Se já existe, buscar o existente
        const { data: existingData } = await supabase
          .from("tcc_pesquisas")
          .select("id")
          .eq("titulo", tcc.titulo)
          .single();

        if (existingData) {
          navigate(`/ferramentas/tcc/${existingData.id}`);
          return;
        }
        throw insertError;
      }

      toast.success("TCC salvo! Redirecionando para análise...");
      navigate(`/ferramentas/tcc/${insertedData.id}`);
    } catch (error) {
      console.error("Erro ao salvar TCC:", error);
      toast.error("Erro ao salvar trabalho");
    }
  };

  const getRelevanciaColor = (relevancia: string) => {
    switch (relevancia) {
      case 'alta': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'media': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'tcc': return 'TCC';
      case 'dissertacao': return 'Dissertação';
      case 'tese': return 'Tese';
      default: return tipo;
    }
  };

  const getFonteLabel = (fonte: string) => {
    switch (fonte) {
      case 'bdtd': return 'BDTD';
      case 'oasisbr': return 'OASIS BR';
      default: return fonte;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-6">
      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/ferramentas")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Pesquisa de TCCs Jurídicos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Busque TCCs, dissertações e teses em repositórios acadêmicos
            </p>
          </div>
        </div>

        {/* Formulário de Busca */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Palavra-chave */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Palavra-chave *
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ex: LGPD, direitos fundamentais, contratos digitais..."
                  value={palavraChave}
                  onChange={(e) => setPalavraChave(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && buscarTCCs()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Área do Direito
                </label>
                <Select value={areaDireito} onValueChange={setAreaDireito}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS_DIREITO.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Tipo de Trabalho
                </label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_TRABALHO.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ano
                </label>
                <Select value={ano} onValueChange={setAno}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANOS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => buscarTCCs(1)}
              disabled={loading || palavraChave.length < 3}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando em BDTD e OASIS BR...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Trabalhos Acadêmicos
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {buscaRealizada && (
          <div className="space-y-4">
            {/* Estatísticas */}
            {total > 0 && (
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {total} trabalhos encontrados
                </span>
                <Badge variant="outline">BDTD: {fontes.bdtd}</Badge>
                <Badge variant="outline">OASIS BR: {fontes.oasisbr}</Badge>
              </div>
            )}

            {/* Lista de Resultados */}
            <div className="space-y-3">
              {resultados.map((tcc, index) => (
                <Card
                  key={index}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => salvarEAnalisar(tcc)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={getRelevanciaColor(tcc.relevancia)}>
                            <Star className="h-3 w-3 mr-1" />
                            {tcc.relevancia === 'alta' ? 'Alta Relevância' : tcc.relevancia === 'media' ? 'Média Relevância' : 'Baixa Relevância'}
                          </Badge>
                          <Badge variant="secondary">
                            {getTipoLabel(tcc.tipo)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getFonteLabel(tcc.fonte)}
                          </Badge>
                        </div>

                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
                          {tcc.titulo}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {tcc.autor}
                          </span>
                          {tcc.instituicao && (
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {tcc.instituicao}
                            </span>
                          )}
                          {tcc.ano && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {tcc.ano}
                            </span>
                          )}
                          {tcc.area_direito && (
                            <Badge variant="outline" className="text-xs">
                              {tcc.area_direito}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {tcc.link_acesso && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(tcc.link_acesso, "_blank");
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina === 1}
                  onClick={() => buscarTCCs(pagina - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {pagina} de {totalPaginas}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina === totalPaginas}
                  onClick={() => buscarTCCs(pagina + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}

            {/* Sem resultados */}
            {!loading && resultados.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhum trabalho encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tente usar outros termos de busca ou ajustar os filtros
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Estado Inicial */}
        {!buscaRealizada && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Pesquise trabalhos acadêmicos
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Busque TCCs, dissertações e teses em repositórios como BDTD e OASIS BR.
                A IA analisará o trabalho e sugerirá abordagens para seu TCC.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TCC;
