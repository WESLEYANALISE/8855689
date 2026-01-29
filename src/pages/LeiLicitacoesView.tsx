import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiLicitacoesView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 14133 - LICITACOES", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiLicitacoesView;
