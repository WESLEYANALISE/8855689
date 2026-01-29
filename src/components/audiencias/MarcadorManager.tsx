import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bookmark, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MarcadorItem } from "./MarcadorItem";

interface MarcadorManagerProps {
  videoId: string;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

interface Marcador {
  id: string;
  video_id: string;
  timestamp_segundos: number;
  titulo: string;
  nota: string | null;
  cor: string;
  created_at: string;
}

const CORES_DISPONIVEIS = [
  { valor: '#6366f1', nome: 'Índigo' },
  { valor: '#22c55e', nome: 'Verde' },
  { valor: '#f59e0b', nome: 'Âmbar' },
  { valor: '#ef4444', nome: 'Vermelho' },
  { valor: '#8b5cf6', nome: 'Violeta' },
  { valor: '#06b6d4', nome: 'Ciano' },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function MarcadorManager({ videoId, currentTime, onSeek }: MarcadorManagerProps) {
  const queryClient = useQueryClient();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [nota, setNota] = useState('');
  const [cor, setCor] = useState(CORES_DISPONIVEIS[0].valor);

  // Buscar marcadores do vídeo
  const { data: marcadores, isLoading } = useQuery({
    queryKey: ['audiencias-marcadores', videoId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('audiencias_marcadores')
        .select('*')
        .eq('video_id', videoId)
        .eq('user_id', user.id)
        .order('timestamp_segundos');

      if (error) throw error;
      return data as Marcador[];
    }
  });

  // Criar marcador
  const criarMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Você precisa estar logado para criar marcadores');

      const { error } = await supabase
        .from('audiencias_marcadores')
        .insert({
          video_id: videoId,
          user_id: user.id,
          timestamp_segundos: Math.floor(currentTime),
          titulo: titulo.trim(),
          nota: nota.trim() || null,
          cor
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiencias-marcadores', videoId] });
      toast.success('Marcador salvo!');
      setDialogAberto(false);
      setTitulo('');
      setNota('');
      setCor(CORES_DISPONIVEIS[0].valor);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Atualizar marcador
  const atualizarMutation = useMutation({
    mutationFn: async ({ id, titulo, nota, cor }: { id: string; titulo: string; nota: string | null; cor: string }) => {
      const { error } = await supabase
        .from('audiencias_marcadores')
        .update({ titulo, nota, cor })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiencias-marcadores', videoId] });
      toast.success('Marcador atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar marcador');
    }
  });

  // Deletar marcador
  const deletarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('audiencias_marcadores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audiencias-marcadores', videoId] });
      toast.success('Marcador excluído!');
    },
    onError: () => {
      toast.error('Erro ao excluir marcador');
    }
  });

  const handleCriar = () => {
    if (!titulo.trim()) {
      toast.error('Digite um título para o marcador');
      return;
    }
    criarMutation.mutate();
  };

  const handleAtualizar = async (id: string, titulo: string, nota: string | null, cor: string) => {
    await atualizarMutation.mutateAsync({ id, titulo, nota, cor });
  };

  const handleDeletar = async (id: string) => {
    await deletarMutation.mutateAsync(id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Meus Marcadores
            {marcadores && marcadores.length > 0 && (
              <span className="text-xs text-muted-foreground">({marcadores.length})</span>
            )}
          </CardTitle>

          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Marcar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5" />
                  Novo Marcador em {formatTime(currentTime)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Voto do Ministro Relator"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Nota (opcional)</label>
                  <Textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Adicione observações sobre este momento..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex gap-2">
                    {CORES_DISPONIVEIS.map((c) => (
                      <button
                        key={c.valor}
                        type="button"
                        className={`w-8 h-8 rounded-full transition-all ${
                          cor === c.valor ? 'ring-2 ring-offset-2 ring-primary' : ''
                        }`}
                        style={{ backgroundColor: c.valor }}
                        onClick={() => setCor(c.valor)}
                        title={c.nome}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAberto(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCriar} disabled={criarMutation.isPending || !titulo.trim()}>
                  {criarMutation.isPending ? 'Salvando...' : 'Salvar Marcador'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !marcadores || marcadores.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum marcador salvo</p>
            <p className="text-xs mt-1">Clique em "Marcar" para salvar momentos importantes</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {marcadores.map((marcador) => (
                <MarcadorItem
                  key={marcador.id}
                  marcador={marcador}
                  onSeek={onSeek}
                  onUpdate={handleAtualizar}
                  onDelete={handleDeletar}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
