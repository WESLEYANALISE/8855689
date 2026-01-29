import { useState, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface SeletorArtigoProps {
  onSelect: (artigo: { numero: string; texto: string; tabela: string; nomeLei: string }) => void;
}

const LEIS_DISPONIVEIS = [
  { tabela: "CF - Constituição Federal", nome: "Constituição Federal", sigla: "CF" },
  { tabela: "CP - Código Penal", nome: "Código Penal", sigla: "CP" },
  { tabela: "CC - Código Civil", nome: "Código Civil", sigla: "CC" },
  { tabela: "CPC – Código de Processo Civil", nome: "Código de Processo Civil", sigla: "CPC" },
  { tabela: "CPP – Código de Processo Penal", nome: "Código de Processo Penal", sigla: "CPP" },
  { tabela: "CLT – Consolidação das Leis do Trabalho", nome: "CLT", sigla: "CLT" },
  { tabela: "CDC – Código de Defesa do Consumidor", nome: "Código do Consumidor", sigla: "CDC" },
  { tabela: "CTN – Código Tributário Nacional", nome: "Código Tributário", sigla: "CTN" },
  { tabela: "ECA – Estatuto da Criança e do Adolescente", nome: "ECA", sigla: "ECA" },
  { tabela: "LINDB - Lei Introdução Normas Direito Brasileiro", nome: "LINDB", sigla: "LINDB" },
];

export const SeletorArtigo = ({ onSelect }: SeletorArtigoProps) => {
  const [leiSelecionada, setLeiSelecionada] = useState<typeof LEIS_DISPONIVEIS[0] | null>(null);
  const [artigos, setArtigos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLeis, setShowLeis] = useState(true);

  useEffect(() => {
    if (leiSelecionada) {
      carregarArtigos();
    }
  }, [leiSelecionada]);

  const carregarArtigos = async () => {
    if (!leiSelecionada) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(leiSelecionada.tabela as any)
        .select('id, "Número do Artigo", Artigo')
        .order('ordem_artigo', { ascending: true })
        .limit(500);

      if (error) throw error;
      setArtigos(data || []);
    } catch (err) {
      console.error("Erro ao carregar artigos:", err);
      setArtigos([]);
    } finally {
      setLoading(false);
    }
  };

  const artigosFiltrados = artigos.filter(art => {
    const numero = art["Número do Artigo"]?.toLowerCase() || "";
    const texto = art.Artigo?.toLowerCase() || "";
    const termo = busca.toLowerCase();
    return numero.includes(termo) || texto.includes(termo);
  });

  const handleSelectArtigo = (artigo: any) => {
    if (!leiSelecionada) return;
    onSelect({
      numero: artigo["Número do Artigo"],
      texto: artigo.Artigo,
      tabela: leiSelecionada.tabela,
      nomeLei: leiSelecionada.nome
    });
  };

  if (showLeis && !leiSelecionada) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Selecione uma Lei</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LEIS_DISPONIVEIS.map((lei) => (
            <button
              key={lei.tabela}
              onClick={() => {
                setLeiSelecionada(lei);
                setShowLeis(false);
              }}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
            >
              <span className="text-primary font-bold text-lg">{lei.sigla}</span>
              <p className="text-sm text-muted-foreground mt-1">{lei.nome}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setLeiSelecionada(null);
            setShowLeis(true);
            setArtigos([]);
            setBusca("");
          }}
        >
          <ChevronDown className="w-4 h-4 rotate-90 mr-1" />
          Trocar Lei
        </Button>
        {leiSelecionada && (
          <span className="text-primary font-semibold">{leiSelecionada.nome}</span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número ou texto do artigo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {artigosFiltrados.map((artigo) => (
              <button
                key={artigo.id}
                onClick={() => handleSelectArtigo(artigo)}
                className="w-full p-3 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
              >
                <span className="text-primary font-semibold">
                  {artigo["Número do Artigo"]}
                </span>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {artigo.Artigo?.substring(0, 150)}...
                </p>
              </button>
            ))}
            {artigosFiltrados.length === 0 && !loading && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum artigo encontrado
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SeletorArtigo;
