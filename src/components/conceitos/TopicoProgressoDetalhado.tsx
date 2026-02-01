import { CheckCircle } from "lucide-react";

interface TopicoProgressoDetalhadoProps {
  progressoLeitura: number;
  progressoFlashcards: number;
  progressoQuestoes: number;
}

export const TopicoProgressoDetalhado = ({
  progressoLeitura,
  progressoFlashcards,
  progressoQuestoes
}: TopicoProgressoDetalhadoProps) => {
  const items = [
    {
      label: "leitura",
      value: progressoLeitura,
      colorClass: "text-orange-400"
    },
    {
      label: "flashcards",
      value: progressoFlashcards,
      colorClass: "text-purple-400"
    },
    {
      label: "praticar",
      value: progressoQuestoes,
      colorClass: "text-emerald-400"
    }
  ];

  return (
    <div className="flex items-center gap-3 mt-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span className={`text-[10px] ${item.colorClass}`}>
            {item.label} {Math.round(item.value)}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default TopicoProgressoDetalhado;
