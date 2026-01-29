import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiImprobidadeView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 8429 - IMPROBIDADE", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiImprobidadeView;
