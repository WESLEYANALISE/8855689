import { useNavigate } from "react-router-dom";
import { FileText, Scale, Gavel, BookOpen, FileCheck, FileSignature } from "lucide-react";
import { ProposicaoTipoCard } from "@/components/ProposicaoTipoCard";

const CamaraProposicoes = () => {
  const navigate = useNavigate();

  const tiposProposicao = [
    { 
      sigla: "PL", 
      nome: "Projeto de Lei (PL)", 
      descricao: "Propostas de novas leis ordinárias",
      icon: FileText,
      iconBg: "bg-blue-600",
      glowColor: "rgb(37, 99, 235)"
    },
    { 
      sigla: "PEC", 
      nome: "Emenda à Constituição (PEC)", 
      descricao: "Propostas de mudança na Constituição",
      icon: Scale,
      iconBg: "bg-purple-600",
      glowColor: "rgb(147, 51, 234)"
    },
    { 
      sigla: "MPV", 
      nome: "Medida Provisória (MPV)", 
      descricao: "Atos do Executivo com força de lei",
      icon: Gavel,
      iconBg: "bg-red-600",
      glowColor: "rgb(220, 38, 38)"
    },
    { 
      sigla: "PLP", 
      nome: "Lei Complementar (PLP)", 
      descricao: "Propostas de leis complementares",
      icon: BookOpen,
      iconBg: "bg-green-600",
      glowColor: "rgb(22, 163, 74)"
    },
    { 
      sigla: "PDC", 
      nome: "Decreto Legislativo (PDC)", 
      descricao: "Decretos do Poder Legislativo",
      icon: FileCheck,
      iconBg: "bg-orange-600",
      glowColor: "rgb(234, 88, 12)"
    },
    { 
      sigla: "PRC", 
      nome: "Resolução da Câmara (PRC)", 
      descricao: "Resoluções internas da Câmara",
      icon: FileSignature,
      iconBg: "bg-cyan-600",
      glowColor: "rgb(8, 145, 178)"
    },
  ];


  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Proposições Legislativas</h1>
        <p className="text-sm text-muted-foreground">
          Escolha o tipo de proposição para visualizar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiposProposicao.map((tipo) => (
          <ProposicaoTipoCard
            key={tipo.sigla}
            tipo={tipo}
            onClick={() => navigate(`/camara-deputados/proposicoes/${tipo.sigla}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default CamaraProposicoes;
