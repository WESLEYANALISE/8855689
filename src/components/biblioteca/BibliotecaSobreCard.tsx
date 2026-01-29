import { Info, BookOpen, Target, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BibliotecaSobreCardProps {
  titulo: string;
  descricao: string;
  objetivo?: string;
  beneficios?: string[];
}

export function BibliotecaSobreCard({ 
  titulo, 
  descricao, 
  objetivo,
  beneficios 
}: BibliotecaSobreCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="p-5 space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/20 rounded-lg shrink-0">
            <Info className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">{titulo}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {descricao}
            </p>
          </div>
        </div>

        {/* Objetivo */}
        {objetivo && (
          <div className="flex items-start gap-3 pt-2 border-t border-border/50">
            <div className="p-1.5 bg-amber-500/20 rounded-lg shrink-0">
              <Target className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground">Objetivo</h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {objetivo}
              </p>
            </div>
          </div>
        )}

        {/* Benefícios */}
        {beneficios && beneficios.length > 0 && (
          <div className="flex items-start gap-3 pt-2 border-t border-border/50">
            <div className="p-1.5 bg-green-500/20 rounded-lg shrink-0">
              <Lightbulb className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-2">Por que ler?</h4>
              <ul className="space-y-1.5">
                {beneficios.map((beneficio, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Textos "Sobre" para cada biblioteca
export const BIBLIOTECA_SOBRE_TEXTS = {
  classicos: {
    titulo: "Sobre a Biblioteca Clássicos",
    descricao: "Uma coleção cuidadosamente selecionada das obras mais influentes da história do Direito e da Filosofia Jurídica. A ordem 'Recomendada' organiza os livros do mais acessível ao mais avançado, ideal para quem está começando.",
    objetivo: "Proporcionar uma jornada de leitura progressiva, começando por obras curtas e introdutórias até chegar aos tratados filosóficos mais densos.",
    beneficios: [
      "Comece pelo 'Caso dos Exploradores de Cavernas' - curto e envolvente",
      "Avance gradualmente para filosofia política (Rousseau, Hobbes)",
      "Termine com obras densas como Kelsen e Foucault",
      "Destaque-se em provas e concursos com citações de autoridade"
    ]
  },
  oratoria: {
    titulo: "Sobre a Biblioteca de Oratória",
    descricao: "Aprenda a arte de falar bem com os maiores mestres da retórica e da persuasão. Esta biblioteca reúne obras essenciais para quem deseja dominar a comunicação oral no ambiente jurídico.",
    objetivo: "Desenvolver habilidades de comunicação, argumentação e persuasão fundamentais para a prática jurídica.",
    beneficios: [
      "Melhore suas sustentações orais em tribunais",
      "Domine técnicas de persuasão para negociações",
      "Aprenda a estruturar argumentos de forma convincente",
      "Desenvolva presença e segurança ao falar em público"
    ]
  },
  lideranca: {
    titulo: "Sobre a Biblioteca de Liderança",
    descricao: "Obras fundamentais sobre liderança, gestão e desenvolvimento pessoal. Aprenda com os maiores pensadores sobre como liderar equipes e gerenciar sua carreira jurídica.",
    objetivo: "Capacitar profissionais do Direito para posições de liderança em escritórios, departamentos jurídicos e instituições.",
    beneficios: [
      "Desenvolva habilidades de gestão de equipes",
      "Aprenda a tomar decisões estratégicas",
      "Melhore sua capacidade de influência e negociação",
      "Construa uma carreira de sucesso no Direito"
    ]
  },
  "fora-da-toga": {
    titulo: "Sobre a Biblioteca Fora da Toga",
    descricao: "Literatura, filosofia, história e cultura geral para ampliar horizontes além do Direito. Um jurista completo precisa de uma formação humanística sólida.",
    objetivo: "Enriquecer a formação cultural do profissional do Direito, proporcionando uma visão mais ampla do mundo e da sociedade.",
    beneficios: [
      "Amplie seu repertório cultural e intelectual",
      "Desenvolva pensamento crítico e criativo",
      "Melhore sua capacidade de análise e interpretação",
      "Torne-se um profissional mais completo e diferenciado"
    ]
  },
  portugues: {
    titulo: "Sobre a Biblioteca de Português",
    descricao: "Gramática, redação jurídica e técnicas de escrita para aperfeiçoar sua comunicação escrita. Escrever bem é fundamental para a prática jurídica.",
    objetivo: "Aprimorar as habilidades de escrita e domínio da língua portuguesa no contexto jurídico.",
    beneficios: [
      "Melhore a qualidade de suas petições e pareceres",
      "Evite erros gramaticais que comprometem a credibilidade",
      "Desenvolva um estilo de escrita claro e objetivo",
      "Destaque-se em concursos e provas discursivas"
    ]
  },
  pesquisa: {
    titulo: "Sobre a Biblioteca de Pesquisa Científica",
    descricao: "Metodologia científica, técnicas de pesquisa e redação acadêmica para quem deseja se aprofundar na produção de conhecimento jurídico.",
    objetivo: "Capacitar estudantes e profissionais para a produção de trabalhos acadêmicos de qualidade.",
    beneficios: [
      "Aprenda a estruturar trabalhos acadêmicos",
      "Domine técnicas de pesquisa jurídica",
      "Desenvolva habilidades de análise crítica",
      "Prepare-se para mestrado e doutorado"
    ]
  }
};
