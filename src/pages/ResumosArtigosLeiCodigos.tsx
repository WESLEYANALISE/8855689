import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Gavel, BookOpen, Briefcase, ShoppingCart, Landmark, Car, Vote, Shield, Droplet, Plane, Radio, Store, Mountain } from "lucide-react";

const codigos = [
  { id: "cp", title: "Código Penal", sigla: "CP", cor: "rgb(239, 68, 68)", lei: "Decreto-Lei nº 2.848/1940", icon: Gavel },
  { id: "cc", title: "Código Civil", sigla: "CC", cor: "rgb(34, 197, 94)", lei: "Lei nº 10.406/2002", icon: BookOpen },
  { id: "cpc", title: "Código de Processo Civil", sigla: "CPC", cor: "rgb(59, 130, 246)", lei: "Lei nº 13.105/2015", icon: Scale },
  { id: "cpp", title: "Código de Processo Penal", sigla: "CPP", cor: "rgb(168, 85, 247)", lei: "Decreto-Lei nº 3.689/1941", icon: Gavel },
  { id: "clt", title: "Consolidação das Leis do Trabalho", sigla: "CLT", cor: "rgb(245, 158, 11)", lei: "Decreto-Lei nº 5.452/1943", icon: Briefcase },
  { id: "cdc", title: "Código de Defesa do Consumidor", sigla: "CDC", cor: "rgb(236, 72, 153)", lei: "Lei nº 8.078/1990", icon: ShoppingCart },
  { id: "ctn", title: "Código Tributário Nacional", sigla: "CTN", cor: "rgb(20, 184, 166)", lei: "Lei nº 5.172/1966", icon: Landmark },
  { id: "ctb", title: "Código de Trânsito Brasileiro", sigla: "CTB", cor: "rgb(99, 102, 241)", lei: "Lei nº 9.503/1997", icon: Car },
  { id: "ce", title: "Código Eleitoral", sigla: "CE", cor: "rgb(244, 63, 94)", lei: "Lei nº 4.737/1965", icon: Vote },
  { id: "cpm", title: "Código Penal Militar", sigla: "CPM", cor: "rgb(34, 197, 94)", lei: "Decreto-Lei nº 1.001/1969", icon: Shield },
  { id: "cppm", title: "Código de Processo Penal Militar", sigla: "CPPM", cor: "rgb(16, 185, 129)", lei: "Decreto-Lei nº 1.002/1969", icon: Shield },
  { id: "ca", title: "Código de Águas", sigla: "CA", cor: "rgb(6, 182, 212)", lei: "Decreto nº 24.643/1934", icon: Droplet },
  { id: "cba", title: "Código Brasileiro de Aeronáutica", sigla: "CBA", cor: "rgb(139, 92, 246)", lei: "Lei nº 7.565/1986", icon: Plane },
  { id: "cbt", title: "Código de Telecomunicações", sigla: "CBT", cor: "rgb(249, 115, 22)", lei: "Lei nº 4.117/1962", icon: Radio },
  { id: "ccom", title: "Código Comercial", sigla: "CCOM", cor: "rgb(234, 179, 8)", lei: "Lei nº 556/1850", icon: Store },
  { id: "cdm", title: "Código de Minas", sigla: "CDM", cor: "rgb(107, 114, 128)", lei: "Decreto-Lei nº 227/1967", icon: Mountain },
];

const ResumosArtigosLeiCodigos = () => {
  const navigate = useNavigate();

  return (
    <div className="px-3 py-4 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/50">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Códigos e Leis</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um código para ver resumos dos artigos
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Códigos */}
      <div className="flex flex-col gap-2">
        {codigos.map((codigo, index) => {
          const IconComponent = codigo.icon;
          return (
            <Card
              key={codigo.id}
              className="cursor-pointer transition-colors hover:bg-muted/50 border-l-4 overflow-hidden"
              style={{ borderLeftColor: codigo.cor }}
              onClick={() => navigate(`/resumos-juridicos/artigos-lei/temas?codigo=${codigo.id}&cor=${encodeURIComponent(codigo.cor)}`)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* Ícone à esquerda */}
                <div className="flex-shrink-0">
                  <IconComponent className="w-5 h-5" style={{ color: codigo.cor }} />
                </div>
                
                {/* Título e descrição */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{codigo.title}</h3>
                  <p className="text-xs text-muted-foreground">{codigo.lei}</p>
                </div>
                
                {/* Sigla à direita */}
                <span className="text-sm font-bold text-muted-foreground shrink-0">
                  {codigo.sigla}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ResumosArtigosLeiCodigos;
