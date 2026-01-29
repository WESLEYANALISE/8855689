import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LeiLRFView = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/codigo/lei-lrf", { replace: true });
  }, [navigate]);
  
  return null;
};

export default LeiLRFView;
