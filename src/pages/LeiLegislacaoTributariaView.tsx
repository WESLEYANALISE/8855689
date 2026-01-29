import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiLegislacaoTributariaView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 9430 - LEGISLACAO TRIBUTARIA", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiLegislacaoTributariaView;
