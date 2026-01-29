import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight } from "lucide-react";

interface ArtigoListaSelectorProps {
  onArtigoSelecionado: (codigo: string, numero: string, conteudo: string) => void;
}

const TABELAS_CODIGO = [
  { nome: 'CP - Código Penal', tabela: 'CP - Código Penal' },
  { nome: 'CPC - Código de Processo Civil', tabela: 'CPC – Código de Processo Civil' },
  { nome: 'CPP - Código de Processo Penal', tabela: 'CPP – Código de Processo Penal' },
  { nome: 'CDC - Código de Defesa do Consumidor', tabela: 'CDC – Código de Defesa do Consumidor' },
  { nome: 'CTN - Código Tributário Nacional', tabela: 'CTN – Código Tributário Nacional' },
  { nome: 'ECA - Estatuto da Criança e do Adolescente', tabela: 'ESTATUTO - ECA' },
  { nome: 'CLT - Consolidação das Leis do Trabalho', tabela: 'CLT – Consolidação das Leis do Trabalho' },
  { nome: 'Lei de Improbidade Administrativa', tabela: 'LEI 8429 - IMPROBIDADE' },
];

export const ArtigoListaSelector = ({ onArtigoSelecionado }: ArtigoListaSelectorProps) => {
  const [codigoSelecionado, setCodigoSelecionado] = useState<string>('');
  const [artigos, setArtigos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (codigoSelecionado) {
      carregarArtigos();
    }
  }, [codigoSelecionado]);

  const carregarArtigos = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from(codigoSelecionado)
        .select('Artigo, "Número do Artigo"')
        .order('"Número do Artigo"', { ascending: true })
        .limit(500);

      if (error) throw error;
      setArtigos(data || []);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!codigoSelecionado) {
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold mb-3">Selecione o Código</h3>
        {TABELAS_CODIGO.map((codigo) => (
          <Card
            key={codigo.tabela}
            className="cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => setCodigoSelecionado(codigo.tabela)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{codigo.nome}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCodigoSelecionado('');
            setArtigos([]);
          }}
        >
          ← Voltar
        </Button>
        <h3 className="text-lg font-semibold">
          {TABELAS_CODIGO.find(c => c.tabela === codigoSelecionado)?.nome}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {artigos.map((artigo, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => 
                  onArtigoSelecionado(
                    TABELAS_CODIGO.find(c => c.tabela === codigoSelecionado)?.nome || '',
                    artigo['Número do Artigo'],
                    artigo.Artigo
                  )
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {artigo['Número do Artigo']}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {artigo.Artigo}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
