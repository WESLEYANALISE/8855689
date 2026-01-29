import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiAcessoInformacaoView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 12527 - ACESSO INFORMACAO", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiAcessoInformacaoView;
