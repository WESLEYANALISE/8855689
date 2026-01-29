import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Tribunal {
  sigla: string;
  nome: string;
  tipo: "Superior" | "Federal" | "Estadual" | "Trabalhista" | "Militar" | "Eleitoral";
}

interface TribunalSelectorProps {
  value?: string;
  onChange: (tribunal: string) => void;
  placeholder?: string;
}

const TRIBUNAIS: Tribunal[] = [
  // Superiores
  { sigla: "STF", nome: "Supremo Tribunal Federal", tipo: "Superior" },
  { sigla: "STJ", nome: "Superior Tribunal de Justiça", tipo: "Superior" },
  { sigla: "TST", nome: "Tribunal Superior do Trabalho", tipo: "Superior" },
  { sigla: "TSE", nome: "Tribunal Superior Eleitoral", tipo: "Superior" },
  { sigla: "STM", nome: "Superior Tribunal Militar", tipo: "Superior" },
  // Federais
  { sigla: "TRF1", nome: "TRF da 1ª Região", tipo: "Federal" },
  { sigla: "TRF2", nome: "TRF da 2ª Região", tipo: "Federal" },
  { sigla: "TRF3", nome: "TRF da 3ª Região", tipo: "Federal" },
  { sigla: "TRF4", nome: "TRF da 4ª Região", tipo: "Federal" },
  { sigla: "TRF5", nome: "TRF da 5ª Região", tipo: "Federal" },
  { sigla: "TRF6", nome: "TRF da 6ª Região", tipo: "Federal" },
  // Estaduais
  { sigla: "TJSP", nome: "TJ de São Paulo", tipo: "Estadual" },
  { sigla: "TJRJ", nome: "TJ do Rio de Janeiro", tipo: "Estadual" },
  { sigla: "TJMG", nome: "TJ de Minas Gerais", tipo: "Estadual" },
  { sigla: "TJRS", nome: "TJ do Rio Grande do Sul", tipo: "Estadual" },
  { sigla: "TJPR", nome: "TJ do Paraná", tipo: "Estadual" },
  { sigla: "TJSC", nome: "TJ de Santa Catarina", tipo: "Estadual" },
  { sigla: "TJBA", nome: "TJ da Bahia", tipo: "Estadual" },
  { sigla: "TJPE", nome: "TJ de Pernambuco", tipo: "Estadual" },
  { sigla: "TJCE", nome: "TJ do Ceará", tipo: "Estadual" },
  { sigla: "TJGO", nome: "TJ de Goiás", tipo: "Estadual" },
  { sigla: "TJDF", nome: "TJ do Distrito Federal", tipo: "Estadual" },
  { sigla: "TJES", nome: "TJ do Espírito Santo", tipo: "Estadual" },
  { sigla: "TJMT", nome: "TJ do Mato Grosso", tipo: "Estadual" },
  { sigla: "TJMS", nome: "TJ do Mato Grosso do Sul", tipo: "Estadual" },
  { sigla: "TJPA", nome: "TJ do Pará", tipo: "Estadual" },
  { sigla: "TJAM", nome: "TJ do Amazonas", tipo: "Estadual" },
  { sigla: "TJMA", nome: "TJ do Maranhão", tipo: "Estadual" },
];

const TIPOS_COR: Record<string, string> = {
  Superior: "bg-primary/20 text-primary border-primary/30",
  Federal: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Estadual: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Trabalhista: "bg-green-500/20 text-green-400 border-green-500/30",
  Militar: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Eleitoral: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

export function TribunalSelector({
  value,
  onChange,
  placeholder = "Selecionar tribunal...",
}: TribunalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const tribunalSelecionado = TRIBUNAIS.find((t) => t.sigla === value);

  const tribunaisFiltrados = TRIBUNAIS.filter(
    (t) =>
      t.sigla.toLowerCase().includes(search.toLowerCase()) ||
      t.nome.toLowerCase().includes(search.toLowerCase())
  );

  const tribunaisAgrupados = tribunaisFiltrados.reduce((acc, tribunal) => {
    if (!acc[tribunal.tipo]) {
      acc[tribunal.tipo] = [];
    }
    acc[tribunal.tipo].push(tribunal);
    return acc;
  }, {} as Record<string, Tribunal[]>);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl",
          "bg-card border border-border text-foreground",
          "hover:bg-muted/50 transition-colors",
          isOpen && "ring-2 ring-primary/50"
        )}
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          {tribunalSelecionado ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-xs font-medium border",
                  TIPOS_COR[tribunalSelecionado.tipo]
                )}
              >
                {tribunalSelecionado.sigla}
              </span>
              <span className="text-sm">{tribunalSelecionado.nome}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {/* Search */}
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar tribunal..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {/* Options */}
              <div className="max-h-[300px] overflow-y-auto p-2">
                {/* Opção "Todos" */}
                <button
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left",
                    "hover:bg-muted/50 transition-colors",
                    !value && "bg-primary/10"
                  )}
                >
                  <span className="text-sm font-medium">Todos os Tribunais</span>
                </button>

                {/* Tribunais agrupados */}
                {Object.entries(tribunaisAgrupados).map(([tipo, tribunais]) => (
                  <div key={tipo} className="mt-3">
                    <p className="text-xs font-semibold text-muted-foreground px-3 mb-1">
                      {tipo}s
                    </p>
                    {tribunais.map((tribunal) => (
                      <button
                        key={tribunal.sigla}
                        onClick={() => {
                          onChange(tribunal.sigla);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left",
                          "hover:bg-muted/50 transition-colors",
                          value === tribunal.sigla && "bg-primary/10"
                        )}
                      >
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-xs font-medium border",
                            TIPOS_COR[tribunal.tipo]
                          )}
                        >
                          {tribunal.sigla}
                        </span>
                        <span className="text-sm truncate">{tribunal.nome}</span>
                      </button>
                    ))}
                  </div>
                ))}

                {Object.keys(tribunaisAgrupados).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum tribunal encontrado
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
