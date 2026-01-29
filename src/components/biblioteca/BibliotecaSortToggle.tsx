import { GraduationCap, SortAsc, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type BibliotecaSortMode = "recomendada" | "alfabetica" | "sobre";

interface BibliotecaSortToggleProps {
  mode: BibliotecaSortMode;
  setMode: (mode: BibliotecaSortMode) => void;
}

const MODOS = [
  { id: "recomendada" as const, icon: GraduationCap, label: "Recomendada" },
  { id: "alfabetica" as const, icon: SortAsc, label: "Alfabética" },
  { id: "sobre" as const, icon: Info, label: "Sobre" },
];

export function BibliotecaSortToggle({ mode, setMode }: BibliotecaSortToggleProps) {
  return (
    <div className="flex items-center justify-center">
      <div className="inline-flex items-center bg-muted/50 rounded-full p-1 gap-0.5">
        {MODOS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              mode === m.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <m.icon className="w-3.5 h-3.5" />
            <span>{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Ordem de leitura recomendada para Biblioteca Clássicos (do mais acessível ao mais avançado)
export const ORDEM_LEITURA_CLASSICOS: Record<number, number> = {
  // NÍVEL 1 - INICIANTE (Livros curtos, linguagem acessível, introdutórios)
  121: 1,  // O Caso dos Exploradores de Cavernas - Lon L. Fuller (curtíssimo, envolvente)
  127: 2,  // O que é Direito - Roberto Lyra Filho (introdutório, didático)
  122: 3,  // Justiça: O que é fazer a coisa certa - Michael Sandel (acessível, casos práticos)
  134: 4,  // O Último Dia de um Condenado - Victor Hugo (narrativa curta)
  133: 5,  // A Luta pelo Direito - Rudolf von Ihering (clássico curto e motivador)
  
  // NÍVEL 2 - BÁSICO (Livros mais longos mas ainda acessíveis)
  123: 6,  // Dos Delitos e das Penas - Cesare Beccaria
  124: 7,  // O Monge e o Executivo - James Hunter (liderança, leitura leve)
  125: 8,  // A Arte da Guerra - Sun Tzu
  131: 9,  // 1984 - George Orwell (ficção, mas importante para entender liberdades)
  136: 10, // O Processo - Franz Kafka
  132: 11, // O Advogado do Diabo - Morris West
  142: 12, // Eles, os Juízes - Piero Calamandrei
  
  // NÍVEL 3 - INTERMEDIÁRIO (Filosofia política clássica)
  140: 13, // O Príncipe - Maquiavel
  129: 14, // O Contrato Social - Rousseau
  138: 15, // Sobre a Liberdade - John Stuart Mill
  137: 16, // O Mundo Assombrado pelos Demônios - Carl Sagan (pensamento crítico)
  135: 17, // Como as Democracias Morrem
  128: 18, // Acesso à Justiça - Mauro Cappelletti
  148: 19, // A Era dos Direitos - Norberto Bobbio
  
  // NÍVEL 4 - AVANÇADO (Obras densas de filosofia)
  126: 20, // O Leviatã - Thomas Hobbes
  130: 21, // O Espírito das Leis - Montesquieu
  139: 22, // A República - Platão
  141: 23, // Ética a Nicômaco - Aristóteles
  145: 24, // Vigiar e Punir - Michel Foucault
  
  // NÍVEL 5 - ESPECIALIZADO (Teoria do Direito complexa)
  147: 25, // Introdução ao Estudo do Direito - Tercio Sampaio Ferraz Jr
  144: 26, // Teoria Pura do Direito - Hans Kelsen
  
  // Outros
  143: 27, // Virando a Própria Mesa
  146: 28, // A Meta
};
