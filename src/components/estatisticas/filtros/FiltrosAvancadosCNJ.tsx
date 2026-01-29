import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  X, 
  RotateCcw,
  Building2,
  MapPin,
  Gavel,
  FileText,
  Users,
  Scale,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface FiltrosCNJ {
  tipoProcesso: string;
  ramoJustica: string;
  tribunal: string;
  grau: string;
  orgaoJulgador: string;
  tipoUnidade: string;
  formato: string;
  originario: string;
  natureza: string;
  uf: string;
  municipio: string;
  classificacao: string;
  competenciaExclusiva: string;
  periodo: string;
}

const FILTROS_INICIAIS: FiltrosCNJ = {
  tipoProcesso: "",
  ramoJustica: "",
  tribunal: "",
  grau: "",
  orgaoJulgador: "",
  tipoUnidade: "",
  formato: "",
  originario: "",
  natureza: "",
  uf: "",
  municipio: "",
  classificacao: "",
  competenciaExclusiva: "",
  periodo: "ano",
};

const OPCOES_TIPO_PROCESSO = [
  { value: "novos", label: "Processos Novos" },
  { value: "baixados", label: "Processos Baixados" },
  { value: "pendentes", label: "Processos Pendentes" },
  { value: "julgados", label: "Processos Julgados" },
];

const OPCOES_RAMO = [
  { value: "estadual", label: "Justiça Estadual" },
  { value: "federal", label: "Justiça Federal" },
  { value: "trabalhista", label: "Justiça do Trabalho" },
  { value: "eleitoral", label: "Justiça Eleitoral" },
  { value: "militar", label: "Justiça Militar" },
  { value: "superiores", label: "Tribunais Superiores" },
];

const OPCOES_GRAU = [
  { value: "1grau", label: "1º Grau" },
  { value: "2grau", label: "2º Grau" },
  { value: "juizado", label: "Juizado Especial" },
  { value: "turma_recursal", label: "Turma Recursal" },
  { value: "superior", label: "Tribunal Superior" },
];

const OPCOES_FORMATO = [
  { value: "eletronico", label: "Eletrônico" },
  { value: "fisico", label: "Físico" },
];

const OPCOES_NATUREZA = [
  { value: "civel", label: "Cível" },
  { value: "criminal", label: "Criminal" },
  { value: "misto", label: "Misto" },
];

const OPCOES_UF = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
].map(uf => ({ value: uf, label: uf }));

const OPCOES_PERIODO = [
  { value: "mes", label: "Último Mês" },
  { value: "trimestre", label: "Último Trimestre" },
  { value: "semestre", label: "Último Semestre" },
  { value: "ano", label: "Último Ano" },
];

interface FiltrosAvancadosCNJProps {
  filtros: FiltrosCNJ;
  onChangeFiltros: (filtros: FiltrosCNJ) => void;
  onLimpar: () => void;
}

export function FiltrosAvancadosCNJ({ filtros, onChangeFiltros, onLimpar }: FiltrosAvancadosCNJProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleChange = (campo: keyof FiltrosCNJ, valor: string) => {
    onChangeFiltros({ ...filtros, [campo]: valor });
  };

  const handleLimpar = () => {
    onChangeFiltros(FILTROS_INICIAIS);
    onLimpar();
  };

  const filtrosAtivos = Object.entries(filtros).filter(
    ([key, value]) => value && value !== "" && key !== "periodo"
  ).length;

  const FiltroSelect = ({ 
    label, 
    campo, 
    opcoes, 
    icon: Icon,
    className 
  }: { 
    label: string; 
    campo: keyof FiltrosCNJ; 
    opcoes: { value: string; label: string }[];
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
  }) => (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </Label>
      <Select value={filtros[campo]} onValueChange={(v) => handleChange(campo, v)}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Selecionar" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todos</SelectItem>
          {opcoes.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  // Filtros rápidos (sempre visíveis)
  const FiltrosRapidosInline = () => (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Período */}
      <div className="flex-1 min-w-[120px] max-w-[150px]">
        <Select value={filtros.periodo} onValueChange={(v) => handleChange("periodo", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {OPCOES_PERIODO.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ramo */}
      <div className="flex-1 min-w-[130px] max-w-[160px]">
        <Select value={filtros.ramoJustica} onValueChange={(v) => handleChange("ramoJustica", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Ramo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os Ramos</SelectItem>
            {OPCOES_RAMO.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* UF */}
      <div className="flex-1 min-w-[80px] max-w-[100px]">
        <Select value={filtros.uf} onValueChange={(v) => handleChange("uf", v)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="UF" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {OPCOES_UF.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão expandir filtros avançados - Desktop */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-8 gap-1 text-xs hidden md:flex"
      >
        <Filter className="w-3 h-3" />
        Mais Filtros
        {filtrosAtivos > 0 && (
          <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
            {filtrosAtivos}
          </Badge>
        )}
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {/* Botão drawer - Mobile */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs md:hidden"
          >
            <Filter className="w-3 h-3" />
            {filtrosAtivos > 0 && (
              <Badge variant="secondary" className="h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {filtrosAtivos}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtros Avançados
            </SheetTitle>
            <SheetDescription>
              Configure os parâmetros da consulta
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <FiltroSelect label="Tipo de Processo" campo="tipoProcesso" opcoes={OPCOES_TIPO_PROCESSO} icon={FileText} />
            <FiltroSelect label="Ramo de Justiça" campo="ramoJustica" opcoes={OPCOES_RAMO} icon={Building2} />
            <FiltroSelect label="Grau" campo="grau" opcoes={OPCOES_GRAU} icon={Gavel} />
            <FiltroSelect label="Formato" campo="formato" opcoes={OPCOES_FORMATO} icon={FileText} />
            <FiltroSelect label="Natureza" campo="natureza" opcoes={OPCOES_NATUREZA} icon={Scale} />
            <FiltroSelect label="UF" campo="uf" opcoes={OPCOES_UF} icon={MapPin} />
            <FiltroSelect label="Período" campo="periodo" opcoes={OPCOES_PERIODO} icon={Globe} />
            <FiltroSelect 
              label="Originário" 
              campo="originario" 
              opcoes={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} 
            />
          </div>
          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="flex-1" onClick={handleLimpar}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button className="flex-1" onClick={() => setIsSheetOpen(false)}>
              Aplicar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Limpar */}
      {filtrosAtivos > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLimpar}
          className="h-8 gap-1 text-xs text-muted-foreground"
        >
          <X className="w-3 h-3" />
          Limpar
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Filtros rápidos inline */}
      <FiltrosRapidosInline />

      {/* Painel expandido - Desktop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden hidden md:block"
          >
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <FiltroSelect label="Tipo de Processo" campo="tipoProcesso" opcoes={OPCOES_TIPO_PROCESSO} icon={FileText} />
                <FiltroSelect label="Grau de Jurisdição" campo="grau" opcoes={OPCOES_GRAU} icon={Gavel} />
                <FiltroSelect label="Formato" campo="formato" opcoes={OPCOES_FORMATO} icon={FileText} />
                <FiltroSelect label="Natureza" campo="natureza" opcoes={OPCOES_NATUREZA} icon={Scale} />
                <FiltroSelect 
                  label="Originário" 
                  campo="originario" 
                  opcoes={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} 
                />
                <FiltroSelect 
                  label="Competência Exclusiva" 
                  campo="competenciaExclusiva" 
                  opcoes={[{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }]} 
                />
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={handleLimpar} className="gap-2">
                  <RotateCcw className="w-3 h-3" />
                  Limpar Todos
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chips de filtros ativos */}
      {filtrosAtivos > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(filtros).map(([key, value]) => {
            if (!value || value === "" || key === "periodo") return null;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-destructive/20"
                onClick={() => handleChange(key as keyof FiltrosCNJ, "")}
              >
                {key}: {value}
                <X className="w-3 h-3" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { FILTROS_INICIAIS };
