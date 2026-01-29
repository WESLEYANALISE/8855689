import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiProcessoAdministrativoView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 9784 - PROCESSO ADMINISTRATIVO", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiProcessoAdministrativoView;
