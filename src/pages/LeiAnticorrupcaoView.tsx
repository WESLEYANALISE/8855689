import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiAnticorrupcaoView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 12846 - ANTICORRUPCAO", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiAnticorrupcaoView;
