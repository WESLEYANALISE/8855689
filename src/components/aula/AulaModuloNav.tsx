import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Modulo {
  id: number;
  nome: string;
}

interface AulaModuloNavProps {
  modulos: Modulo[];
  moduloAtual: number;
  progresso: number;
  onSair: () => void;
  onMudarModulo: (id: number) => void;
}

export const AulaModuloNav = ({
  modulos,
  moduloAtual,
  progresso,
  onSair,
  onMudarModulo
}: AulaModuloNavProps) => {
  const moduloAtualObj = modulos.find(m => m.id === moduloAtual);

  return (
    <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border z-50">
      <div className="w-full px-3 py-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSair}
            className="gap-1.5 h-8 px-2"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="text-xs">Sair</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 px-3 max-w-[200px] md:max-w-none">
                <span className="font-semibold text-xs">
                  {moduloAtual}/{modulos.length}
                </span>
                {moduloAtualObj && (
                  <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[150px]">
                    {moduloAtualObj.nome}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              {modulos.map((modulo) => (
                <DropdownMenuItem
                  key={modulo.id}
                  onClick={() => onMudarModulo(modulo.id)}
                  className={moduloAtual === modulo.id ? "bg-primary/10" : ""}
                >
                  <span className="font-medium mr-2 text-sm">M{modulo.id}:</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {modulo.nome}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-xs font-medium text-muted-foreground hidden sm:block">
            {Math.round(progresso)}%
          </div>
        </div>

        <Progress value={progresso} className="h-1" />
      </div>
    </div>
  );
};
