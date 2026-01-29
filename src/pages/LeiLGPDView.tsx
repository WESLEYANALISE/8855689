import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiLGPDView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 13709 - LGPD", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiLGPDView;
