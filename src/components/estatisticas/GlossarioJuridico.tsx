import { motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const GLOSSARIO = {
  "Taxa de Congestionamento": {
    definicao: "Percentual de processos que permaneceram sem solução definitiva ao final do ano, em relação ao total tramitado (pendentes + baixados). Quanto maior a taxa, maior o acúmulo de processos.",
    formula: "Taxa = (Pendentes / (Pendentes + Baixados)) × 100",
    exemplo: "Uma taxa de 70% significa que a cada 100 processos tramitados, 70 continuam pendentes."
  },
  "IAD - Índice de Atendimento à Demanda": {
    definicao: "Indica se o tribunal está conseguindo baixar mais processos do que recebe de novos. Valores acima de 100% indicam redução do acervo.",
    formula: "IAD = (Processos Baixados / Processos Novos) × 100",
    exemplo: "IAD de 103% significa que para cada 100 novos processos, 103 foram finalizados."
  },
  "Processos Pendentes": {
    definicao: "Casos que aguardam alguma movimentação, decisão ou julgamento. Inclui processos em todas as fases, desde a inicial até aguardando recurso.",
    formula: "Pendentes = Acervo inicial + Novos - Baixados",
    exemplo: "São os processos que 'dormem' nos tribunais aguardando andamento."
  },
  "Processos Novos": {
    definicao: "Quantidade de casos que ingressaram no Judiciário durante o período analisado. Representa a demanda da sociedade por justiça.",
    formula: "Contagem de processos distribuídos no período",
    exemplo: "Em 2024, foram 35,1 milhões de novos processos em todo o país."
  },
  "Processos Baixados": {
    definicao: "Processos que tiveram baixa definitiva, ou seja, foram arquivados, transitaram em julgado ou tiveram alguma forma de encerramento.",
    formula: "Contagem de processos encerrados no período",
    exemplo: "Incluem sentenças, acordos, arquivamentos e outras formas de finalização."
  },
  "Custo por Processo": {
    definicao: "Valor médio gasto pelo Judiciário para processar cada caso, incluindo pessoal, infraestrutura, tecnologia e demais despesas.",
    formula: "Custo = Despesa Total / Total de Processos Tramitados",
    exemplo: "Em 2024, o custo médio foi de R$ 1.239 por processo."
  },
  "Tempo Médio de Tramitação": {
    definicao: "Duração média entre a distribuição de um processo e sua baixa definitiva. Varia muito conforme o tipo de ação e o tribunal.",
    formula: "Média do tempo de todos os processos baixados",
    exemplo: "Processos de execução fiscal podem levar mais de 8 anos em média."
  },
  "Justiça Estadual": {
    definicao: "Ramo do Judiciário que julga a maioria dos casos comuns: família, consumidor, criminal comum, cível em geral. Representa cerca de 80% dos processos do país.",
    formula: null,
    exemplo: "TJs de cada estado, como TJSP, TJRJ, TJMG."
  },
  "Justiça Federal": {
    definicao: "Julga causas em que a União, autarquias federais ou empresas públicas federais são partes. Inclui crimes federais, previdenciário e tributário federal.",
    formula: null,
    exemplo: "TRFs e Varas Federais em todo o país."
  },
  "Justiça do Trabalho": {
    definicao: "Especializada em conflitos entre empregados e empregadores, incluindo acidentes de trabalho, verbas rescisórias e relações sindicais.",
    formula: null,
    exemplo: "TRTs e Varas do Trabalho."
  },
  "Execução Fiscal": {
    definicao: "Processo de cobrança de dívidas tributárias (impostos, taxas, contribuições) e não tributárias com a Fazenda Pública.",
    formula: null,
    exemplo: "Cobranças de IPTU atrasado, dívidas com o INSS, multas federais."
  },
  "Medida Protetiva": {
    definicao: "Decisão judicial urgente para proteger vítimas de violência doméstica, determinando afastamento do agressor, proibição de contato, etc.",
    formula: null,
    exemplo: "Prevista na Lei Maria da Penha (Lei 11.340/2006)."
  },
  "Tribunal do Júri": {
    definicao: "Julgamento popular para crimes dolosos contra a vida (homicídio, feminicídio, infanticídio, latrocínio quando há morte).",
    formula: null,
    exemplo: "Júri composto por 7 cidadãos sorteados."
  },
  "Grandes Litigantes": {
    definicao: "Pessoas físicas ou jurídicas que aparecem como partes em grande volume de processos. Geralmente são órgãos públicos, bancos e empresas de telecomunicações.",
    formula: null,
    exemplo: "INSS, Caixa Econômica, União, bancos privados."
  },
};

export function GlossarioJuridico() {
  const [busca, setBusca] = useState("");
  
  const termosFiltrados = Object.entries(GLOSSARIO).filter(([termo]) =>
    termo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Glossário Jurídico</h3>
          <p className="text-xs text-muted-foreground">Definições de termos estatísticos</p>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar termo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de termos */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {termosFiltrados.map(([termo, info], index) => (
          <motion.div
            key={termo}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border rounded-lg p-3"
          >
            <h4 className="font-semibold text-foreground text-sm mb-1">{termo}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {info.definicao}
            </p>
            {info.formula && (
              <p className="text-xs text-primary/80 font-mono bg-primary/10 rounded px-2 py-1 mb-2">
                {info.formula}
              </p>
            )}
            {info.exemplo && (
              <p className="text-xs text-muted-foreground italic">
                💡 {info.exemplo}
              </p>
            )}
          </motion.div>
        ))}

        {termosFiltrados.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">
            Nenhum termo encontrado para "{busca}"
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-2">
        Fonte: CNJ - Justiça em Números 2025
      </p>
    </motion.div>
  );
}
