import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface TCCMenuCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color: string;
  iconColor: string;
}

const TCCMenuCard = ({ icon: Icon, title, description, href, color, iconColor }: TCCMenuCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-border/50 ${color} backdrop-blur-sm group`}
      onClick={() => navigate(href)}
    >
      <CardContent className="p-4 space-y-2">
        <div className={`w-10 h-10 rounded-xl ${iconColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TCCMenuCard;
