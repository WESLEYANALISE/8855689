import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MeuBrasilInstituicoes = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const instituicoes = [
    {
      nome: "Supremo Tribunal Federal",
      sigla: "STF",
      descricao: "Guardião da Constituição",
      tipo: "Tribunal Superior",
      cor: "bg-blue-600"
    },
    {
      nome: "Superior Tribunal de Justiça",
      sigla: "STJ",
      descricao: "Uniformiza interpretação da lei federal",
      tipo: "Tribunal Superior",
      cor: "bg-blue-600"
    },
    {
      nome: "Tribunal Superior do Trabalho",
      sigla: "TST",
      descricao: "Matérias trabalhistas e sindicais",
      tipo: "Tribunal Superior",
      cor: "bg-blue-600"
    },
    {
      nome: "Tribunal Superior Eleitoral",
      sigla: "TSE",
      descricao: "Organiza e fiscaliza eleições",
      tipo: "Tribunal Superior",
      cor: "bg-blue-600"
    },
    {
      nome: "Superior Tribunal Militar",
      sigla: "STM",
      descricao: "Julga crimes militares",
      tipo: "Tribunal Superior",
      cor: "bg-blue-600"
    },
    {
      nome: "Conselho Nacional de Justiça",
      sigla: "CNJ",
      descricao: "Controle administrativo do Judiciário",
      tipo: "Órgão de Controle",
      cor: "bg-purple-600"
    },
    {
      nome: "Ministério Público Federal",
      sigla: "MPF",
      descricao: "Defesa da ordem jurídica",
      tipo: "Ministério Público",
      cor: "bg-green-600"
    },
    {
      nome: "Defensoria Pública da União",
      sigla: "DPU",
      descricao: "Assistência jurídica gratuita",
      tipo: "Defensoria",
      cor: "bg-yellow-600"
    },
    {
      nome: "Ordem dos Advogados do Brasil",
      sigla: "OAB",
      descricao: "Representação da advocacia",
      tipo: "Órgão de Classe",
      cor: "bg-red-600"
    },
    {
      nome: "Advocacia-Geral da União",
      sigla: "AGU",
      descricao: "Representa a União judicialmente",
      tipo: "Advocacia Pública",
      cor: "bg-indigo-600"
    },
    {
      nome: "Polícia Federal",
      sigla: "PF",
      descricao: "Investigação de crimes federais",
      tipo: "Polícia",
      cor: "bg-gray-600"
    },
    {
      nome: "Senado Federal",
      sigla: "SF",
      descricao: "Casa Legislativa - representação dos estados",
      tipo: "Legislativo",
      cor: "bg-teal-600"
    },
    {
      nome: "Câmara dos Deputados",
      sigla: "CD",
      descricao: "Casa Legislativa - representação do povo",
      tipo: "Legislativo",
      cor: "bg-teal-600"
    },
    {
      nome: "Tribunal de Contas da União",
      sigla: "TCU",
      descricao: "Fiscalização de contas públicas",
      tipo: "Órgão de Controle",
      cor: "bg-orange-600"
    },
    {
      nome: "Controladoria-Geral da União",
      sigla: "CGU",
      descricao: "Combate à corrupção",
      tipo: "Órgão de Controle",
      cor: "bg-orange-600"
    }
  ];

  const filteredInstituicoes = instituicoes.filter(i =>
    i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/meu-brasil")}
        className="mb-4"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Instituições Jurídicas
        </h1>
        <p className="text-sm text-muted-foreground">
          Órgãos do sistema jurídico brasileiro
        </p>
      </div>

      {/* Busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar instituição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Grid de instituições */}
      <div className="grid grid-cols-2 gap-3">
        {filteredInstituicoes.map((item) => (
          <button
            key={item.sigla}
            onClick={() => navigate(`/meu-brasil/instituicao/${encodeURIComponent(item.nome)}`)}
            className="bg-card border border-border rounded-lg p-4 text-left hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="flex flex-col items-center text-center gap-3">
              {/* Logo/Foto da instituição */}
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                <Building2 className="w-8 h-8 text-muted-foreground" />
              </div>
              
              {/* Informações */}
              <div className="w-full">
                <div className="font-bold text-xs text-primary mb-1">{item.sigla}</div>
                <h3 className="text-sm font-semibold mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {item.nome}
                </h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {item.descricao}
                </p>
                <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                  {item.tipo}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredInstituicoes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhuma instituição encontrada</p>
        </div>
      )}
    </div>
  );
};

export default MeuBrasilInstituicoes;
