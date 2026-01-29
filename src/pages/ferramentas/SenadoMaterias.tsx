import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { MateriaSenadoCard } from "@/components/senado";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { FileText, ArrowLeft, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const TIPOS_MATERIA = [
  { sigla: "PEC", nome: "Proposta de Emenda à Constituição" },
  { sigla: "PLS", nome: "Projeto de Lei do Senado" },
  { sigla: "PLC", nome: "Projeto de Lei da Câmara" },
  { sigla: "PLP", nome: "Projeto de Lei Complementar" },
  { sigla: "MPV", nome: "Medida Provisória" },
  { sigla: "PDL", nome: "Projeto de Decreto Legislativo" },
  { sigla: "PRS", nome: "Projeto de Resolução do Senado" },
];

const SenadoMaterias = () => {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sigla, setSigla] = useState("");
  const [numero, setNumero] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear().toString());

  const fetchMaterias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('buscar-materias-senado', {
        body: { 
          sigla: sigla || undefined,
          numero: numero ? parseInt(numero) : undefined,
          ano: ano ? parseInt(ano) : undefined,
          tramitando: true
        }
      });

      if (error) throw error;
      setMaterias(data?.materias || []);
    } catch (error) {
      console.error('Erro ao buscar matérias:', error);
      toast.error('Erro ao carregar matérias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/ferramentas/senado')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="bg-blue-500/20 rounded-xl p-2">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Matérias Legislativas</h1>
            <p className="text-xs text-muted-foreground">
              PEC, PLS, PLC, PLP e mais
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Select value={sigla} onValueChange={setSigla}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_MATERIA.map(tipo => (
                <SelectItem key={tipo.sigla} value={tipo.sigla}>{tipo.sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Número"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className="w-24"
          />

          <Input
            type="number"
            placeholder="Ano"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="w-20"
          />

          <Button onClick={fetchMaterias} disabled={loading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Lista */}
        {loading ? (
          <SkeletonList count={5} />
        ) : materias.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma matéria encontrada
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Ajuste os filtros e tente novamente
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {materias.map((materia, index) => (
              <MateriaSenadoCard key={materia.codigo || index} materia={materia} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SenadoMaterias;
