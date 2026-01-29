import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { FileEdit, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const codigosVadeMecum = [
  { id: "CP - Código Penal", nome: "Código Penal", sigla: "CP", emoji: "⚖️" },
  { id: "CC - Código Civil", nome: "Código Civil", sigla: "CC", emoji: "📜" },
  { id: "CF - Constituição Federal", nome: "Constituição Federal", sigla: "CF", emoji: "🏛️" },
  { id: "CPC – Código de Processo Civil", nome: "Código de Processo Civil", sigla: "CPC", emoji: "📋" },
  { id: "CPP – Código de Processo Penal", nome: "Código de Processo Penal", sigla: "CPP", emoji: "🔍" },
  { id: "CLT - Consolidação das Leis do Trabalho", nome: "Consolidação das Leis do Trabalho", sigla: "CLT", emoji: "👷" },
  { id: "CDC – Código de Defesa do Consumidor", nome: "Código de Defesa do Consumidor", sigla: "CDC", emoji: "🛒" },
  { id: "CTN – Código Tributário Nacional", nome: "Código Tributário Nacional", sigla: "CTN", emoji: "💰" },
  { id: "CE – Código Eleitoral", nome: "Código Eleitoral", sigla: "CE", emoji: "🗳️" },
  { id: "CTB Código de Trânsito Brasileiro", nome: "Código de Trânsito Brasileiro", sigla: "CTB", emoji: "🚗" },
  { id: "CPM – Código Penal Militar", nome: "Código Penal Militar", sigla: "CPM", emoji: "🎖️" },
  { id: "CPPM – Código de Processo Penal Militar", nome: "Código de Processo Penal Militar", sigla: "CPPM", emoji: "⚔️" },
];

const codigoCores: Record<string, string> = {
  "CP - Código Penal": "rgb(16, 185, 129)",
  "CC - Código Civil": "rgb(245, 158, 11)",
  "CF - Constituição Federal": "rgb(59, 130, 246)",
  "CPC – Código de Processo Civil": "rgb(139, 92, 246)",
  "CPP – Código de Processo Penal": "rgb(239, 68, 68)",
  "CLT - Consolidação das Leis do Trabalho": "rgb(236, 72, 153)",
  "CDC – Código de Defesa do Consumidor": "rgb(14, 165, 233)",
  "CTN – Código Tributário Nacional": "rgb(234, 179, 8)",
  "CE – Código Eleitoral": "rgb(168, 85, 247)",
  "CTB Código de Trânsito Brasileiro": "rgb(249, 115, 22)",
  "CPM – Código Penal Militar": "rgb(34, 197, 94)",
  "CPPM – Código de Processo Penal Militar": "rgb(99, 102, 241)",
};

const CompleteLeiCodigos = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCodigos = codigosVadeMecum.filter(
    (codigo) =>
      codigo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codigo.sigla.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/flashcards")}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
            style={{ backgroundColor: "rgb(59, 130, 246)", boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }}
          >
            <FileEdit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Complete a Lei</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um código para praticar
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Buscar código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grid de Códigos */}
      <div className="grid grid-cols-2 gap-3">
        {filteredCodigos.map((codigo) => {
          const cor = codigoCores[codigo.id] || "rgb(139, 92, 246)";
          
          return (
            <Card
              key={codigo.id}
              className="cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all border-2 border-transparent hover:border-primary/50 bg-gradient-to-br from-card to-card/80 group overflow-hidden relative"
              onClick={() => navigate(`/flashcards/complete-lei/artigos?codigo=${encodeURIComponent(codigo.id)}&cor=${encodeURIComponent(cor)}`)}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1.5 opacity-80"
                style={{
                  background: `linear-gradient(90deg, transparent, ${cor}, transparent)`,
                  boxShadow: `0 0 20px ${cor}`
                }}
              />
              
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl"
                  style={{ backgroundColor: `${cor}20` }}
                >
                  {codigo.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-0.5">{codigo.sigla}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {codigo.nome}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCodigos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum código encontrado</p>
        </div>
      )}
    </div>
  );
};

export default CompleteLeiCodigos;
