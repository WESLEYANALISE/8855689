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
      label: "Lido",
      value: progressoLeitura,
      colorClass: "text-orange-400",
      bgClass: "bg-orange-500"
    },
    {
      label: "Flashcards",
      value: progressoFlashcards,
      colorClass: "text-purple-400",
      bgClass: "bg-purple-500"
    },
    {
      label: "Praticar",
      value: progressoQuestoes,
      colorClass: "text-emerald-400",
      bgClass: "bg-emerald-500"
    }
  ];

  return (
    <div className="flex items-center gap-3 mt-1.5">
      {items.map((item) => {
        const isComplete = item.value >= 100;
        
        return (
          <div key={item.label} className="flex items-center gap-1">
            {isComplete ? (
              <CheckCircle className={`w-3 h-3 ${item.colorClass}`} />
            ) : (
              <div className={`w-1.5 h-1.5 rounded-full ${item.bgClass}`} />
            )}
            <span className={`text-[10px] ${isComplete ? item.colorClass : 'text-gray-500'}`}>
              {isComplete ? item.label : `${Math.round(item.value)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TopicoProgressoDetalhado;
