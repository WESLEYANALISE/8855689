import { ArrowLeft } from "lucide-react";
import { useHierarchicalNavigation } from "@/hooks/useHierarchicalNavigation";
import ExplicacoesList from "@/components/lei-seca/ExplicacoesList";

const LeisExplicacoes = () => {
  const { goBack } = useHierarchicalNavigation();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 hover:bg-accent/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Entendendo a Legislação</h1>
        </div>
      </div>
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <ExplicacoesList />
      </div>
    </div>
  );
};

export default LeisExplicacoes;
