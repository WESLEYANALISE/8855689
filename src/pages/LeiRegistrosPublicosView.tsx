import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiRegistrosPublicosView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/LEI 6015 - REGISTROS PUBLICOS", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiRegistrosPublicosView;
