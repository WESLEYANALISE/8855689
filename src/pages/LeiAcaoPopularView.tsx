import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiAcaoPopularView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 4717 - ACAO POPULAR", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiAcaoPopularView;
