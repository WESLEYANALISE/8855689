import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SenadorCard } from "@/components/senado";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { 
  ArrowLeft, 
  Users, 
  Building2, 
  Calendar, 
  CheckCircle, 
  XCircle,
  FileText,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Membro {
  codigo: string;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  cargo: string;
  titular: boolean;
}

interface ComissaoDetalhes {
  codigo: string;
  sigla: string;
  nome: string;
  tipo: string;
  casa: string;
  ativa: boolean;
  participantes: number;
  dataCriacao?: string;
  dataExtincao?: string;
  membros: Membro[];
  atribuicoes?: string;
  descricao?: string;
}

const SenadoComissaoDetalhes = () => {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const [comissao, setComissao] = useState<ComissaoDetalhes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (codigo) {
      fetchComissaoDetalhes(codigo);
    }
  }, [codigo]);

  const fetchComissaoDetalhes = async (codigoComissao: string) => {
    setLoading(true);
    try {
      // Primeiro tenta buscar do cache
      const { data: cached, error: cacheError } = await supabase
        .from('senado_comissoes')
        .select('*')
        .eq('codigo', codigoComissao)
        .single();

      if (cached && !cacheError) {
        const dadosCompletos = cached.dados_completos as any;
        
        // Buscar membros da API
        const membrosResponse = await fetch(
          `https://legis.senado.leg.br/dadosabertos/comissao/${codigoComissao}/membros.json`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        let membros: Membro[] = [];
        if (membrosResponse.ok) {
          const membrosData = await membrosResponse.json();
          const participantes = membrosData.MembrosColegiado?.Colegiado?.Participantes?.Participante || [];
          const participantesArray = Array.isArray(participantes) ? participantes : [participantes];
          
          membros = participantesArray.map((p: any) => ({
            codigo: p.IdentificacaoParlamentar?.CodigoParlamentar,
            nome: p.IdentificacaoParlamentar?.NomeParlamentar,
            partido: p.IdentificacaoParlamentar?.SiglaPartidoParlamentar,
            uf: p.IdentificacaoParlamentar?.UfParlamentar,
            foto: p.IdentificacaoParlamentar?.UrlFotoParlamentar,
            cargo: p.DescricaoParticipacao,
            titular: p.Titular === 'Sim'
          })).filter((m: Membro) => m.codigo);
        }

        setComissao({
          codigo: cached.codigo,
          sigla: cached.sigla || '',
          nome: cached.nome || '',
          tipo: cached.tipo || '',
          casa: cached.casa || '',
          ativa: cached.ativa || false,
          participantes: membros.length || cached.participantes || 0,
          dataCriacao: cached.data_criacao,
          dataExtincao: cached.data_extincao,
          membros,
          descricao: dadosCompletos?.DescricaoColegiado || ''
        });
      } else {
        // Buscar da API diretamente
        const response = await fetch(
          `https://legis.senado.leg.br/dadosabertos/comissao/${codigoComissao}.json`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) throw new Error('Erro ao buscar comissão');

        const data = await response.json();
        const colegiado = data.DetalhesColegiado?.Colegiado;

        // Buscar membros
        const membrosResponse = await fetch(
          `https://legis.senado.leg.br/dadosabertos/comissao/${codigoComissao}/membros.json`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        let membros: Membro[] = [];
        if (membrosResponse.ok) {
          const membrosData = await membrosResponse.json();
          const participantes = membrosData.MembrosColegiado?.Colegiado?.Participantes?.Participante || [];
          const participantesArray = Array.isArray(participantes) ? participantes : [participantes];
          
          membros = participantesArray.map((p: any) => ({
            codigo: p.IdentificacaoParlamentar?.CodigoParlamentar,
            nome: p.IdentificacaoParlamentar?.NomeParlamentar,
            partido: p.IdentificacaoParlamentar?.SiglaPartidoParlamentar,
            uf: p.IdentificacaoParlamentar?.UfParlamentar,
            foto: p.IdentificacaoParlamentar?.UrlFotoParlamentar,
            cargo: p.DescricaoParticipacao,
            titular: p.Titular === 'Sim'
          })).filter((m: Membro) => m.codigo);
        }

        if (colegiado) {
          setComissao({
            codigo: colegiado.CodigoColegiado,
            sigla: colegiado.SiglaColegiado || '',
            nome: colegiado.NomeColegiado || '',
            tipo: colegiado.TipoColegiado || '',
            casa: colegiado.SiglaCasa || '',
            ativa: !colegiado.DataExtincao,
            participantes: membros.length,
            dataCriacao: colegiado.DataCriacao,
            dataExtincao: colegiado.DataExtincao,
            membros,
            descricao: colegiado.DescricaoColegiado || ''
          });

          // Salvar no cache
          await supabase.from('senado_comissoes').upsert({
            codigo: colegiado.CodigoColegiado,
            sigla: colegiado.SiglaColegiado,
            nome: colegiado.NomeColegiado,
            tipo: colegiado.TipoColegiado,
            casa: colegiado.SiglaCasa,
            ativa: !colegiado.DataExtincao,
            participantes: membros.length,
            data_criacao: colegiado.DataCriacao,
            data_extincao: colegiado.DataExtincao,
            dados_completos: colegiado
          }, { onConflict: 'codigo' });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes da comissão:', error);
      toast.error('Erro ao carregar detalhes da comissão');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
        <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
          </div>
          <SkeletonList count={5} />
        </div>
      </div>
    );
  }

  if (!comissao) {
    return (
      <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
        <div className="flex-1 px-4 md:px-6 py-6 md:py-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <div className="text-center py-12 text-muted-foreground">
            Comissão não encontrada
          </div>
        </div>
      </div>
    );
  }

  // Separar membros por tipo
  const presidencia = comissao.membros.filter(m => 
    m.cargo?.toLowerCase().includes('presidente') || 
    m.cargo?.toLowerCase().includes('vice')
  );
  const titulares = comissao.membros.filter(m => 
    m.titular && !m.cargo?.toLowerCase().includes('presidente') && !m.cargo?.toLowerCase().includes('vice')
  );
  const suplentes = comissao.membros.filter(m => !m.titular);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20 md:pb-0">
      <div className="flex-1 px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-lg font-bold">
                {comissao.sigla}
              </span>
              {comissao.ativa ? (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Ativa
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                  <XCircle className="w-3 h-3" />
                  Extinta
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {comissao.nome}
            </h1>
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Building2 className="w-6 h-6 text-purple-400 mb-2" />
              <span className="text-xs text-muted-foreground">Casa</span>
              <span className="text-sm font-medium">{comissao.casa || 'SF'}</span>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <FileText className="w-6 h-6 text-blue-400 mb-2" />
              <span className="text-xs text-muted-foreground">Tipo</span>
              <span className="text-sm font-medium">{comissao.tipo || 'Permanente'}</span>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Users className="w-6 h-6 text-amber-400 mb-2" />
              <span className="text-xs text-muted-foreground">Membros</span>
              <span className="text-sm font-medium">{comissao.participantes}</span>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Calendar className="w-6 h-6 text-green-400 mb-2" />
              <span className="text-xs text-muted-foreground">Criação</span>
              <span className="text-sm font-medium">{formatDate(comissao.dataCriacao) || '-'}</span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Descrição */}
        {comissao.descricao && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Sobre a Comissão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {comissao.descricao}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Link externo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(`https://legis.senado.leg.br/comissoes/comissao?codcol=${comissao.codigo}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver no site do Senado
          </Button>
        </motion.div>

        {/* Presidência */}
        {presidencia.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              Presidência
            </h2>
            <div className="space-y-3">
              {presidencia.map((membro, index) => (
                <Card 
                  key={membro.codigo} 
                  className="bg-card border-border hover:border-green-500/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/ferramentas/senado/senador/${membro.codigo}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={membro.foto} 
                        alt={membro.nome}
                        className="w-12 h-12 rounded-full object-cover bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{membro.nome}</span>
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                            {membro.cargo}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {membro.partido}/{membro.uf}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Membros Titulares */}
        {titulares.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              Membros Titulares ({titulares.length})
            </h2>
            <div className="grid gap-3">
              {titulares.map((membro) => (
                <Card 
                  key={membro.codigo} 
                  className="bg-card border-border hover:border-blue-500/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/ferramentas/senado/senador/${membro.codigo}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={membro.foto} 
                        alt={membro.nome}
                        className="w-10 h-10 rounded-full object-cover bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-foreground text-sm">{membro.nome}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{membro.partido}/{membro.uf}</span>
                          {membro.cargo && membro.cargo !== 'Membro' && (
                            <span className="px-1.5 py-0.5 bg-muted rounded">{membro.cargo}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Suplentes */}
        {suplentes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              Suplentes ({suplentes.length})
            </h2>
            <div className="grid gap-2">
              {suplentes.map((membro) => (
                <Card 
                  key={membro.codigo} 
                  className="bg-card border-border hover:border-orange-500/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/ferramentas/senado/senador/${membro.codigo}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={membro.foto} 
                        alt={membro.nome}
                        className="w-8 h-8 rounded-full object-cover bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      <div className="flex-1">
                        <span className="font-medium text-foreground text-sm">{membro.nome}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {membro.partido}/{membro.uf}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sem membros */}
        {comissao.membros.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum membro cadastrado para esta comissão
          </div>
        )}
      </div>
    </div>
  );
};

export default SenadoComissaoDetalhes;
