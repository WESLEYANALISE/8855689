import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiJuizadosCiveisView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 9099 - JUIZADOS CIVEIS", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiJuizadosCiveisView;
