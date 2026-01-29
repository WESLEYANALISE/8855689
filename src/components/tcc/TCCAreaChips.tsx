import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Scale, 
  Shield, 
  Users, 
  Briefcase, 
  Landmark, 
  Globe,
  Leaf,
  Building,
  Gavel,
  Smartphone
} from "lucide-react";

interface AreaChip {
  value: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const AREAS: AreaChip[] = [
  { value: "constitucional", label: "Constitucional", icon: Scale, color: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20" },
  { value: "Penal", label: "Penal", icon: Gavel, color: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20" },
  { value: "Civil", label: "Civil", icon: Users, color: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" },
  { value: "Trabalhista", label: "Trabalhista", icon: Briefcase, color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20" },
  { value: "Tributário", label: "Tributário", icon: Landmark, color: "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20" },
  { value: "Digital", label: "Digital", icon: Smartphone, color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20" },
  { value: "Ambiental", label: "Ambiental", icon: Leaf, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" },
  { value: "Empresarial", label: "Empresarial", icon: Building, color: "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20" },
  { value: "administrativo", label: "Administrativo", icon: Shield, color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20" },
  { value: "Internacional", label: "Internacional", icon: Globe, color: "bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20" },
];

interface TCCAreaChipsProps {
  onAreaClick?: (area: string) => void;
}

const TCCAreaChips = ({ onAreaClick }: TCCAreaChipsProps) => {
  const navigate = useNavigate();

  const handleClick = (area: string) => {
    if (onAreaClick) {
      onAreaClick(area);
    } else {
      navigate(`/ferramentas/tcc/sugestoes?area=${area}`);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Áreas do Direito</h3>
      <div className="flex flex-wrap gap-2">
        {AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <Badge
              key={area.value}
              variant="outline"
              className={`cursor-pointer transition-colors px-3 py-1.5 text-xs font-medium ${area.color}`}
              onClick={() => handleClick(area.value)}
            >
              <Icon className="h-3.5 w-3.5 mr-1.5" />
              {area.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default TCCAreaChips;
