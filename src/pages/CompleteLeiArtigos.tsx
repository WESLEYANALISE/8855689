import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Search, ArrowLeft, FileEdit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const getAreaName = (tableName: string): string => {
  const areaMap: Record<string, string> = {
    "CP - Código Penal": "Código Penal",
    "CC - Código Civil": "Código Civil",
    "CF - Constituição Federal": "Constituição Federal",
    "CPC – Código de Processo Civil": "Código de Processo Civil",
    "CPP – Código de Processo Penal": "Código de Processo Penal",
    "CLT - Consolidação das Leis do Trabalho": "CLT",
    "CDC – Código de Defesa do Consumidor": "Código de Defesa do Consumidor",
    "CTN – Código Tributário Nacional": "Código Tributário Nacional",
    "CE – Código Eleitoral": "Código Eleitoral",
    "CTB Código de Trânsito Brasileiro": "Código de Trânsito Brasileiro",
    "CPM – Código Penal Militar": "Código Penal Militar",
    "CPPM – Código de Processo Penal Militar": "Código de Processo Penal Militar",
  };
  return areaMap[tableName] || tableName;
};

const CompleteLeiArtigos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codigo = searchParams.get("codigo") || "";
  const cor = searchParams.get("cor") || "rgb(59, 130, 246)";
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar artigos do código selecionado
  const { data: artigos, isLoading: isLoadingArtigos } = useQuery({
    queryKey: ["artigos-complete-lei", codigo],
    queryFn: async () => {
      if (!codigo) return [];
      
      const { data, error } = await supabase
        .from(codigo as any)
        .select('"Número do Artigo"')
        .not('"Número do Artigo"', "is", null)
        .order("id", { ascending: true });

      if (error) {
        console.error("Erro ao buscar artigos:", error);
        return [];
      }

      return data?.map((item: any) => ({
        numero: item["Número do Artigo"],
      })) || [];
    },
    enabled: !!codigo,
  });

  // Buscar exercícios já gerados (cache)
  const { data: exerciciosExistentes } = useQuery({
    queryKey: ["exercicios-existentes", codigo],
    queryFn: async () => {
      if (!codigo) return new Set();
      
      const { data, error } = await supabase
        .from("COMPLETE_LEI_CACHE")
        .select("artigo")
        .eq("area", codigo);

      if (error) {
        console.error("Erro ao buscar exercícios existentes:", error);
        return new Set();
      }

      return new Set(data?.map((item: any) => item.artigo) || []);
    },
    enabled: !!codigo,
  });

  const filteredArtigos = artigos?.filter((artigo) =>
    artigo.numero?.toString().includes(searchTerm)
  ) || [];

  const sortedArtigos = [...filteredArtigos].sort((a, b) => {
    const numA = parseInt(a.numero?.replace(/\D/g, "") || "0");
    const numB = parseInt(b.numero?.replace(/\D/g, "") || "0");
    return numA - numB;
  });

  if (!codigo) {
    navigate("/flashcards/complete-lei");
    return null;
  }

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/flashcards/complete-lei")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
            style={{ backgroundColor: cor, boxShadow: `0 0 20px ${cor}50` }}
          >
            <FileEdit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{getAreaName(codigo)}</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um artigo para praticar
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar artigo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Legenda */}
      <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Pronto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>A gerar</span>
        </div>
      </div>

      {/* Grid de Artigos */}
      {isLoadingArtigos ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : sortedArtigos.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {sortedArtigos.map((artigo) => {
            const temExercicio = exerciciosExistentes?.has(artigo.numero);
            const statusColor = temExercicio ? "rgb(59, 130, 246)" : "rgb(245, 158, 11)"; // blue if ready, amber if to generate
            
            return (
              <Card
                key={artigo.numero}
                className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all border border-border/50 bg-card/80 group overflow-hidden relative"
                onClick={() => navigate(`/flashcards/complete-lei/exercicio?codigo=${encodeURIComponent(codigo)}&artigo=${encodeURIComponent(artigo.numero)}&cor=${encodeURIComponent(cor)}`)}
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)`,
                    boxShadow: `0 0 15px ${statusColor}`
                  }}
                />
                
                <CardContent className="p-4 flex items-center gap-3">
                  <Scale className="w-5 h-5 text-muted-foreground" />
                  <span className="font-bold text-sm">Art. {artigo.numero}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum artigo encontrado</p>
        </div>
      )}
    </div>
  );
};

export default CompleteLeiArtigos;
