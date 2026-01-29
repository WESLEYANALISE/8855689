import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const codigos = [
  { id: "CP - Código Penal", nome: "Código Penal (CP)" },
  { id: "CPC – Código de Processo Civil", nome: "Código de Processo Civil (CPC)" },
  { id: "CPP – Código de Processo Penal", nome: "Código de Processo Penal (CPP)" },
  { id: "CDC – Código de Defesa do Consumidor", nome: "Código de Defesa do Consumidor (CDC)" },
  { id: "CLT – Consolidação das Leis do Trabalho", nome: "CLT" },
  { id: "CTN – Código Tributário Nacional", nome: "Código Tributário Nacional (CTN)" },
  { id: "CF - Constituição Federal", nome: "Constituição Federal" },
];

interface Props {
  onArtigoSelecionado: (codigo: string, numeroArtigo: string, conteudo: string) => void;
}

export const SelecionarArtigoVadeMecum = ({ onArtigoSelecionado }: Props) => {
  const [codigoSelecionado, setCodigoSelecionado] = useState("");
  const [numeroArtigo, setNumeroArtigo] = useState("");
  const [artigoEncontrado, setArtigoEncontrado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);

  const buscarArtigo = async () => {
    if (!codigoSelecionado || !numeroArtigo) {
      toast.error("Selecione um código e digite o número do artigo");
      return;
    }

    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from(codigoSelecionado as any)
        .select('*')
        .ilike('Número do Artigo', `%${numeroArtigo}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setArtigoEncontrado(data);
        toast.success("Artigo encontrado!");
      } else {
        toast.error("Artigo não encontrado");
        setArtigoEncontrado(null);
      }
    } catch (error) {
      console.error("Erro ao buscar artigo:", error);
      toast.error("Erro ao buscar artigo");
    } finally {
      setBuscando(false);
    }
  };

  const confirmarSelecao = () => {
    if (!artigoEncontrado) return;

    const conteudoArtigo = `
Artigo ${artigoEncontrado['Número do Artigo']}
${artigoEncontrado.Artigo || ''}
${artigoEncontrado.Comentario || ''}
    `.trim();

    onArtigoSelecionado(
      codigoSelecionado,
      artigoEncontrado['Número do Artigo'],
      conteudoArtigo
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>Código</Label>
            <Select value={codigoSelecionado} onValueChange={setCodigoSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o código" />
              </SelectTrigger>
              <SelectContent>
                {codigos.map((codigo) => (
                  <SelectItem key={codigo.id} value={codigo.id}>
                    {codigo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Número do Artigo</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 121, 157, etc."
                value={numeroArtigo}
                onChange={(e) => setNumeroArtigo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarArtigo()}
              />
              <Button onClick={buscarArtigo} disabled={buscando}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {buscando && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      )}

      {artigoEncontrado && !buscando && (
        <Card className="border-2 border-primary">
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg mb-2">
                Artigo {artigoEncontrado['Número do Artigo']}
              </h3>
              <p className="text-sm mb-3">{artigoEncontrado.Artigo}</p>
              {artigoEncontrado.Comentario && (
                <p className="text-xs text-muted-foreground">
                  💡 {artigoEncontrado.Comentario}
                </p>
              )}
            </div>
            <Button onClick={confirmarSelecao} className="w-full">
              Usar Este Artigo
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
