import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bookmark, Play, Pencil, Trash2 } from "lucide-react";

interface Marcador {
  id: string;
  timestamp_segundos: number;
  titulo: string;
  nota: string | null;
  cor: string;
}

interface MarcadorItemProps {
  marcador: Marcador;
  onSeek: (seconds: number) => void;
  onUpdate: (id: string, titulo: string, nota: string | null, cor: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
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

export function MarcadorItem({ marcador, onSeek, onUpdate, onDelete }: MarcadorItemProps) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(marcador.titulo);
  const [nota, setNota] = useState(marcador.nota || '');
  const [cor, setCor] = useState(marcador.cor);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!titulo.trim()) return;
    
    setSalvando(true);
    try {
      await onUpdate(marcador.id, titulo.trim(), nota.trim() || null, cor);
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async () => {
    if (confirm('Tem certeza que deseja excluir este marcador?')) {
      await onDelete(marcador.id);
    }
  };

  return (
    <>
      <div 
        className="group flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => onSeek(marcador.timestamp_segundos)}
      >
        <div 
          className="w-1 h-full min-h-[40px] rounded-full"
          style={{ backgroundColor: marcador.cor }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              {formatTime(marcador.timestamp_segundos)}
            </Badge>
            <span className="font-medium text-sm truncate">{marcador.titulo}</span>
          </div>
          
          {marcador.nota && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {marcador.nota}
            </p>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              setEditando(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDeletar();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="w-5 h-5" />
              Editar Marcador
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Voto do Ministro Relator"
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
            <Button variant="outline" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvando || !titulo.trim()}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
