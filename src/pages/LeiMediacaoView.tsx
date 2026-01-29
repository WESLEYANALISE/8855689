import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiMediacaoView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 13140 - MEDIACAO", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiMediacaoView;
