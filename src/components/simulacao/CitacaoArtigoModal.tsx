import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Scale, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CitacaoArtigoModalProps {
  open: boolean;
  onClose: () => void;
  onCitar: (artigo: any, pontos: number) => void;
  area: string;
}

export const CitacaoArtigoModal = ({ open, onClose, onCitar, area }: CitacaoArtigoModalProps) => {
  const [busca, setBusca] = useState("");
  const [artigos, setArtigos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabelaMap: Record<string, string> = {
    "Direito Penal": "CP - Código Penal",
    "Direito Civil": "CC - Código Civil",
    "Direito Do Trabalho": "CLT – Consolidação das Leis do Trabalho",
    "Direito do Consumidor": "CDC – Código de Defesa do Consumidor",
    "Direito Administrativo": "CF - Constituição Federal",
    "Direito Previndenciario": "CF - Constituição Federal"
  };

  const tabela = tabelaMap[area] || "CP - Código Penal";

  const buscarArtigos = async () => {
    if (!busca.trim()) {
      toast.error("Digite o número do artigo para buscar");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from(tabela)
        .select('*')
        .ilike('"Número do Artigo"', `%${busca}%`)
        .limit(10);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("Nenhum artigo encontrado");
        setArtigos([]);
      } else {
        setArtigos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
      toast.error('Erro ao buscar artigos');
    } finally {
      setLoading(false);
    }
  };

  const handleCitar = (artigo: any) => {
    const pontos = 20;
    onCitar(artigo, pontos);
    onClose();
    setBusca("");
    setArtigos([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-purple-500/30 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-purple-500" />
            Citar Artigo do Vade Mecum
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o número do artigo (ex: 121, Art. 5º)"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && buscarArtigos()}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Button
              onClick={buscarArtigos}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {artigos.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                {artigos.length} artigo(s) encontrado(s) em {tabela}
              </p>
              {artigos.map((artigo) => (
                <div
                  key={artigo.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer group"
                  onClick={() => handleCitar(artigo)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-purple-400 mb-2">
                        {artigo['Número do Artigo']}
                      </h4>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                        {artigo.Artigo}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-purple-500 hover:bg-purple-600 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCitar(artigo);
                      }}
                    >
                      Citar (+20 pts)
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && artigos.length === 0 && busca && (
            <p className="text-center text-gray-400 py-8">
              Nenhum artigo encontrado. Tente outra busca.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};