import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Scale, Loader2, Book, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SimulacaoArtigos = () => {
  const navigate = useNavigate();
  const { area } = useParams();
  const [artigos, setArtigos] = useState<any[]>([]);
  const [artigosFiltrados, setArtigosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState<string | null>(null);
  const [pesquisa, setPesquisa] = useState("");

  const areaMap: Record<string, string> = {
    criminal: "CP - Código Penal",
    civil: "CC - Código Civil",
    trabalhista: "CLT – Consolidação das Leis do Trabalho",
    consumidor: "CDC – Código de Defesa do Consumidor",
    administrativo: "CF - Constituição Federal",
    previdenciario: "CF - Constituição Federal"
  };

  const tabelaVadeMecum = areaMap[area || ""] || "CP - Código Penal";

  useEffect(() => {
    buscarArtigos();
  }, [area]);

  const buscarArtigos = async () => {
    try {
      // Busca com limit de 1000 artigos (suficiente para simulações)
      const { data, error } = await (supabase as any)
        .from(tabelaVadeMecum)
        .select('id, "Número do Artigo", Artigo')
        .order('id')
        .limit(1000);

      if (error) throw error;
      setArtigos(data || []);
      setArtigosFiltrados(data || []);
    } catch (error) {
      console.error('Erro ao buscar artigos:', error);
      toast.error('Erro ao carregar artigos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pesquisa.trim()) {
      const filtrados = artigos.filter(artigo => 
        artigo['Número do Artigo']?.toLowerCase().includes(pesquisa.toLowerCase()) ||
        artigo.Artigo?.toLowerCase().includes(pesquisa.toLowerCase())
      );
      setArtigosFiltrados(filtrados);
    } else {
      setArtigosFiltrados(artigos);
    }
  }, [pesquisa, artigos]);

  const selecionarArtigo = async (artigo: any) => {
    setGerando(artigo.id);
    try {
      toast.info('Gerando casos baseados neste artigo...', { duration: 5000 });

      console.log('📤 Enviando para edge function:', {
        area: tabelaVadeMecum,
        tema: `Artigo ${artigo['Número do Artigo']}`,
        artigo_numero: artigo['Número do Artigo'],
        artigo_conteudo: artigo.Artigo?.substring(0, 100) + '...'
      });

      const { data, error } = await supabase.functions.invoke('gerar-caso-simulacao', {
        body: {
          area: tabelaVadeMecum, // Nome correto da tabela ex: "CP - Código Penal"
          tema: `Artigo ${artigo['Número do Artigo']}`,
          artigo_base: artigo.Artigo,
          nivel_dificuldade: 'Médio',
          modo: 'advogado',
          genero_jogador: 'masculino'
        }
      });

      if (error) {
        console.error('❌ Erro detalhado da edge function:', error);
        throw error;
      }

      console.log('✅ Caso gerado com sucesso:', data);
      toast.success('Caso gerado!');
      navigate(`/simulacao-juridica/escolha-caso?area=${encodeURIComponent(tabelaVadeMecum)}&tema=${encodeURIComponent(`Artigo ${artigo['Número do Artigo']}`)}&modo=advogado`);
    } catch (error: any) {
      console.error('❌ Erro ao gerar casos:', error);
      toast.error(error.message || 'Erro ao gerar casos');
    } finally {
      setGerando(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Estudo por Artigos
          </h1>
          <p className="text-gray-300">
            Escolha um artigo do {tabelaVadeMecum} para estudar
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="mb-6 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Pesquisar artigo por número ou conteúdo..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="pl-10 bg-gray-800/50 border-purple-500/30 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="space-y-3">
            {artigosFiltrados.length === 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">
                    {pesquisa ? 'Nenhum artigo encontrado com este termo' : 'Nenhum artigo disponível para esta área'}
                  </p>
                </CardContent>
              </Card>
            )}

            {artigosFiltrados.map((artigo, index) => (
              <Card
                key={artigo.id}
                style={{ animationDelay: `${index * 0.05}s` }}
                className="bg-gray-800/50 border-purple-500/30 hover:border-purple-500/60 transition-all duration-300 cursor-pointer group animate-fade-in hover:scale-[1.01]"
                onClick={() => selecionarArtigo(artigo)}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors flex-shrink-0">
                      <Scale className="w-6 h-6 text-purple-500" />
                    </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                      {artigo['Número do Artigo']}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {artigo.Artigo}
                    </p>
                  </div>
                  </div>

                  {gerando === artigo.id && (
                    <Loader2 className="w-5 h-5 text-purple-500 animate-spin flex-shrink-0" />
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

export default SimulacaoArtigos;