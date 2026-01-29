import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
const MeuBrasilHistoria = () => {
  const navigate = useNavigate();
  const periodos = [{
    periodo: "Brasil Colonial",
    anos: "1500-1822",
    descricao: "Período sob domínio português",
    eventos: ["Ordenações Filipinas (1603)", "Criação das Capitanias Hereditárias", "Estabelecimento do Tribunal da Relação"],
    cor: "bg-amber-600"
  }, {
    periodo: "Império",
    anos: "1822-1889",
    descricao: "Brasil como império independente",
    eventos: ["Constituição de 1824", "Código Criminal do Império (1830)", "Lei Áurea (1888)"],
    cor: "bg-yellow-600"
  }, {
    periodo: "República Velha",
    anos: "1889-1930",
    descricao: "Primeiros anos da república",
    eventos: ["Constituição de 1891", "Código Civil de 1916", "Criação do STF"],
    cor: "bg-green-600"
  }, {
    periodo: "Era Vargas",
    anos: "1930-1945",
    descricao: "Governo de Getúlio Vargas",
    eventos: ["Constituição de 1934", "CLT - Consolidação das Leis do Trabalho (1943)", "Constituição de 1937 (Estado Novo)"],
    cor: "bg-blue-600"
  }, {
    periodo: "Redemocratização",
    anos: "1945-1964",
    descricao: "Retorno à democracia",
    eventos: ["Constituição de 1946", "Criação da Justiça do Trabalho", "Direitos trabalhistas expandidos"],
    cor: "bg-purple-600"
  }, {
    periodo: "Ditadura Militar",
    anos: "1964-1985",
    descricao: "Regime militar no Brasil",
    eventos: ["Constituição de 1967", "AI-5 - Ato Institucional nº 5", "Lei da Anistia (1979)"],
    cor: "bg-gray-600"
  }, {
    periodo: "Nova República",
    anos: "1985-1988",
    descricao: "Transição democrática",
    eventos: ["Eleições diretas", "Assembleia Constituinte", "Movimento Diretas Já"],
    cor: "bg-indigo-600"
  }, {
    periodo: "Constituição de 1988",
    anos: "1988-Presente",
    descricao: "Era da Constituição Cidadã",
    eventos: ["Constituição Federal de 1988", "Código Civil de 2002", "Marco Civil da Internet (2014)", "LGPD (2018)"],
    cor: "bg-red-600"
  }];
  return <div className="px-3 py-4 max-w-4xl mx-auto pb-20">
      

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold mb-1 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          História Jurídica do Brasil
        </h1>
        <p className="text-sm text-muted-foreground">
          Linha do tempo do direito brasileiro
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {periodos.map((item, index) => <div key={index} className="relative pl-8 pb-8 border-l-2 border-border last:border-0">
            {/* Marcador na linha */}
            <div className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${item.cor}`} />

            {/* Card */}
            <button onClick={() => navigate(`/meu-brasil/historia/${encodeURIComponent(item.periodo)}`)} className="w-full bg-card border border-border rounded-lg p-4 text-left hover:border-accent transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg">{item.periodo}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${item.cor} text-white`}>
                  {item.anos}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                {item.descricao}
              </p>

              <div className="space-y-1">
                {item.eventos.map((evento, i) => <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-accent">•</span>
                    <span>{evento}</span>
                  </div>)}
              </div>
            </button>
          </div>)}
      </div>
    </div>;
};
export default MeuBrasilHistoria;