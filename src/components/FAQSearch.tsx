import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FAQSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const FAQSearch = ({ value, onChange }: FAQSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Buscar nas perguntas frequentes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-12 text-base"
      />
    </div>
  );
};
