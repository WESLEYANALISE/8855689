import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiADIADCView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 9868 - ADI E ADC", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiADIADCView;
