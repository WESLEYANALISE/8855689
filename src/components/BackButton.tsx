import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to?: string;
  className?: string;
}

const BackButton = ({ to, className = "" }: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`bg-gray-600/80 hover:bg-gray-500/80 text-white gap-2 ${className}`}
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar
    </Button>
  );
};

export default BackButton;
