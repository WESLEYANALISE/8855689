import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiAcaoCivilPublicaView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 7347 - ACAO CIVIL PUBLICA", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiAcaoCivilPublicaView;
