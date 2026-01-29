import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Mail, Send, RefreshCw, Loader2, CheckCircle2, XCircle, Calendar, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Inscrito {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean;
  confirmado: boolean;
  frequencia: string;
  areas_interesse: string[];
  ultimo_envio: string | null;
  created_at: string;
}

export default function AdminPushLegislacao() {
  const navigate = useNavigate();
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0 });

  useEffect(() => {
    carregarInscritos();
  }, []);

  const carregarInscritos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('push_legislacao_inscritos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const lista = (data || []) as unknown as Inscrito[];
      setInscritos(lista);
      setStats({
        total: lista.length,
        ativos: lista.filter(i => i.ativo).length,
        inativos: lista.filter(i => !i.ativo).length
      });
    } catch (error) {
      console.error('Erro ao carregar inscritos:', error);
      toast.error('Erro ao carregar inscritos');
    } finally {
      setLoading(false);
    }
  };

  const enviarPushAgora = async () => {
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('enviar-push-legislacao', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Push enviado! ${data.enviados} e-mails enviados para ${data.total_leis} lei(s)`);
        carregarInscritos();
      } else {
        throw new Error(data.error || 'Erro ao enviar');
      }
    } catch (error) {
      console.error('Erro ao enviar push:', error);
      toast.error('Erro ao enviar push');
    } finally {
      setEnviando(false);
    }
  };

  const verificarNovasLeis = async () => {
    setVerificando(true);
    try {
      const { data, error } = await supabase.functions.invoke('verificar-novas-leis', {
        body: {}
      });

      if (error) throw error;

      toast.success(data.message || 'Verificação concluída');
      console.log('Resultado:', data);
    } catch (error) {
      console.error('Erro ao verificar:', error);
      toast.error('Erro ao verificar leis');
    } finally {
      setVerificando(false);
    }
  };

  const toggleAtivo = async (inscrito: Inscrito) => {
    try {
      const { error } = await supabase
        .from('push_legislacao_inscritos')
        .update({ ativo: !inscrito.ativo } as any)
        .eq('id', inscrito.id);

      if (error) throw error;

      toast.success(inscrito.ativo ? 'Inscrito desativado' : 'Inscrito ativado');
      carregarInscritos();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast.error('Erro ao atualizar inscrito');
    }
  };

  const deletarInscrito = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este inscrito?')) return;

    try {
      const { error } = await supabase
        .from('push_legislacao_inscritos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Inscrito excluído');
      carregarInscritos();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir inscrito');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Admin - Push de Legislação
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerenciar inscritos e envios
                </p>
              </div>
            </div>
            <Button variant="outline" size="icon" onClick={carregarInscritos}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats.ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{stats.inativos}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button 
              onClick={enviarPushAgora} 
              disabled={enviando}
              className="gap-2"
            >
              {enviando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Push Agora
            </Button>
            <Button 
              variant="outline"
              onClick={verificarNovasLeis} 
              disabled={verificando}
              className="gap-2"
            >
              {verificando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Verificar Novas Leis
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Inscritos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inscritos ({inscritos.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : inscritos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum inscrito ainda
              </div>
            ) : (
              <div className="divide-y divide-border">
                {inscritos.map((inscrito) => (
                  <div key={inscrito.id} className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${inscrito.ativo ? 'bg-green-500' : 'bg-red-500'}`} />
                        <p className="font-medium truncate">{inscrito.email}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {inscrito.nome && <span>{inscrito.nome}</span>}
                        <span>•</span>
                        <span>{inscrito.frequencia}</span>
                        {inscrito.ultimo_envio && (
                          <>
                            <span>•</span>
                            <Calendar className="w-3 h-3" />
                            <span>
                              Último: {formatDistanceToNow(new Date(inscrito.ultimo_envio), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </>
                        )}
                      </div>
                      {inscrito.areas_interesse?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {inscrito.areas_interesse.map((area) => (
                            <span 
                              key={area} 
                              className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAtivo(inscrito)}
                      >
                        {inscrito.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletarInscrito(inscrito.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
