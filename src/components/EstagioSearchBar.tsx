import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface EstagioSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const EstagioSearchBar = ({ value, onChange, placeholder = "Buscar por título, empresa ou local..." }: EstagioSearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-12"
      />
    </div>
  );
}
