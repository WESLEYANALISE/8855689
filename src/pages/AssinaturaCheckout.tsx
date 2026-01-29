import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AssinaturaWebView from "@/components/AssinaturaWebView";

export default function AssinaturaCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const checkoutUrl = searchParams.get("url");

  useEffect(() => {
    // Se não houver URL, volta para a página de assinatura
    if (!checkoutUrl) {
      navigate("/assinatura", { replace: true });
    }
  }, [checkoutUrl, navigate]);

  if (!checkoutUrl) {
    return null;
  }

  return (
    <AssinaturaWebView 
      url={checkoutUrl} 
      onClose={() => navigate("/assinatura")} 
    />
  );
}
