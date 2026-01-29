import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scale, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const SimulacaoCaso = () => {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const [searchParams] = useSearchParams();
  const avatar = searchParams.get('avatar');
  const [caso, setCaso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    buscarCaso();
  }, [id]);
  const buscarCaso = async () => {
    try {
      if (!id) {
        setLoading(false);
        return;
      }
      const {
        data,
        error
      } = await supabase.from('SIMULACAO_CASOS').select('*').eq('id', parseInt(id)).single();
      if (error) throw error;
      setCaso(data);
    } catch (error: any) {
      console.error('Erro ao buscar caso:', error);
      toast.error('Erro ao carregar caso');
    } finally {
      setLoading(false);
    }
  };
  const iniciarAudiencia = async () => {
    if (!id) return;

    // Criar partida
    const {
      data: partida,
      error
    } = await supabase.from('SIMULACAO_PARTIDAS').insert({
      caso_id: parseInt(id),
      avatar_escolhido: avatar || 'homem_branco',
      pontuacao_final: 0
    }).select().single();
    if (error) {
      toast.error('Erro ao iniciar audiência');
      return;
    }
    navigate(`/simulacao-juridica/audiencia/${partida.id}`);
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>;
  }
  if (!caso) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <Card className="bg-gray-800/50 border-gray-700 max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-300">Caso não encontrado</p>
            <Button onClick={() => navigate('/simulacao-juridica')} className="mt-4">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          
        </div>

        {/* Card principal do caso */}
        <Card className="bg-gray-800/90 border-amber-500/30 mb-8 overflow-hidden">
          {/* Cabeçalho decorativo */}
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-700/20 p-6 border-b border-amber-500/30">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Scale className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-amber-500 font-semibold uppercase tracking-wider">
                  {caso.area} • {caso.nivel_dificuldade}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {caso.titulo_caso}
                </h1>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            {/* Informações do cliente */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500"></div>
                Seu Cliente
              </h2>
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <p className="text-lg font-semibold text-amber-500 mb-2">
                  {caso.nome_cliente}
                </p>
                <p className="text-gray-300">
                  {caso.perfil_cliente}
                </p>
              </div>
            </div>

            {/* Contexto do caso */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-amber-500"></div>
                Contexto do Caso
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {caso.contexto_inicial}
                </p>
              </div>
            </div>

            {/* Parte contrária */}
            {caso.nome_reu && <div className="mb-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-amber-500"></div>
                  Parte Contrária
                </h2>
                <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                  <p className="text-lg font-semibold text-red-400 mb-2">
                    {caso.nome_reu}
                  </p>
                  <p className="text-gray-300">
                    {caso.perfil_reu}
                  </p>
                </div>
              </div>}

            {/* Alerta */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6 mb-8">
              <p className="text-amber-400 font-semibold mb-2">
                ⚖️ Atenção, Advogado(a)!
              </p>
              <p className="text-gray-300 text-sm">
                Você está prestes a entrar em audiência. Analise cuidadosamente todas as informações 
                apresentadas e prepare sua estratégia de defesa. Suas decisões impactarão diretamente 
                no resultado do caso.
              </p>
            </div>

            {/* Botão de iniciar */}
            <div className="text-center">
              <Button size="lg" onClick={iniciarAudiencia} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-12 py-6 text-lg font-bold shadow-2xl shadow-amber-500/50">
                Começar Audiência
                <Scale className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default SimulacaoCaso;