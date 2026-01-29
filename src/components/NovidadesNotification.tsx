import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Novidade {
  "Atualização": string;
  "Área": string;
  "Dia": string;
}

const areaBadgeColors: Record<string, string> = {
  "VadeMecum": "bg-destructive/20 text-destructive border-destructive",
  "Cursos": "bg-blue-500/20 text-blue-400 border-blue-500",
  "Sistema": "bg-accent/20 text-accent-foreground border-accent",
};

export const NovidadesNotification = () => {
  const [novidades, setNovidades] = useState<Novidade[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    checkNovidadesDodia();
    limparCacheAntigo();
  }, []);

  const limparCacheAntigo = () => {
    const keys = Object.keys(localStorage);
    const dataAtual = new Date();
    
    keys.forEach(key => {
      if (key.startsWith("novidades-vistas-")) {
        const data = key.replace("novidades-vistas-", "");
        try {
          const dataNovidade = new Date(data);
          const diffDias = (dataAtual.getTime() - dataNovidade.getTime()) / (1000 * 60 * 60 * 24);
          
          if (diffDias > 7) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Remove chaves inválidas
          localStorage.removeItem(key);
        }
      }
    });
  };

  const checkNovidadesDodia = async () => {
    try {
      const dataKey = format(new Date(), "yyyy-MM-dd");
      
      // Verifica se já viu hoje
      const jaViu = localStorage.getItem(`novidades-vistas-${dataKey}`);
      if (jaViu === "true") {
        return;
      }

      // Busca as últimas 3 novidades (ordenadas por data mais recente)
      const { data, error } = await supabase
        .from("NOVIDADES")
        .select("*")
        .order("Dia", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Erro ao buscar novidades:", error);
        return;
      }

      if (data && data.length > 0) {
        setNovidades(data);
        setShowNotification(true);
      }
    } catch (error) {
      console.error("Erro ao verificar novidades:", error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowNotification(false);
      setIsClosing(false);
      
      // Salva que já viu as novidades de hoje
      const dataKey = format(new Date(), "yyyy-MM-dd");
      localStorage.setItem(`novidades-vistas-${dataKey}`, "true");
    }, 300);
  };

  if (!showNotification || novidades.length === 0) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 ${
        isClosing ? "animate-fade-out" : "animate-fade-in"
      }`}
      onClick={handleClose}
    >
      <Card 
        className={`max-w-md w-full shadow-2xl relative pt-12 ${
          isClosing ? "animate-scale-out" : "animate-scale-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone animado no topo */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-destructive flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>

        <CardHeader className="text-center pb-3">
          <CardTitle className="text-2xl">
            ✨ Últimas Atualizações!
          </CardTitle>
          <Badge variant="outline" className="mx-auto mt-2">
            {novidades.length} {novidades.length === 1 ? 'atualização recente' : 'atualizações recentes'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-3">
          {novidades.map((nov, index) => (
            <div key={index} className="p-3 rounded-lg bg-secondary/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge 
                  variant="outline" 
                  className={areaBadgeColors[nov["Área"]] || "bg-primary/20 text-primary border-primary"}
                >
                  {nov["Área"]}
                </Badge>
                <span className="text-xs text-muted-foreground">{nov["Dia"]}</span>
              </div>
              <p className="text-sm leading-relaxed">
                {nov["Atualização"]}
              </p>
            </div>
          ))}

          <Button 
            onClick={handleClose} 
            className="w-full mt-4"
            size="lg"
          >
            Entendi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
