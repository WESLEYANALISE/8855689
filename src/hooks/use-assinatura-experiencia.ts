import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PlanType } from "@/hooks/use-mercadopago-pix";
import heroImage from "@/assets/assinatura-hero.webp";
import vitalicioImage from "@/assets/assinatura-vitalicio-novo.png";
import mensalImage from "@/assets/assinatura-mensal-horizontal.webp";
import anualImage from "@/assets/assinatura-trimestral-horizontal.webp"; // Reutilizando para anual

interface AssinaturaExperiencia {
  heroImage: string | null;
  planImages: Record<PlanType, string | null>;
  fraseImpacto: string;
  audioBase64: string | null;
  loading: boolean;
  imagesLoading: boolean;
}

const FRASES_IMPACTO = [
  "Seu futuro jurídico começa aqui.",
  "O conhecimento é a sua maior arma.",
  "Transforme seu potencial em resultado.",
  "Junte-se à elite do Direito.",
  "Cada artigo estudado é um passo para a vitória.",
  "O sucesso não espera. E você?",
  "Invista em você. O retorno é garantido.",
  "Sua aprovação está mais perto do que imagina.",
  "Construa hoje o advogado de amanhã.",
  "Excelência não é opção. É obrigação."
];

// URLs estáticas do storage - imagens já geradas e cacheadas
const SUPABASE_URL = "https://izspjvegxdfgkgibpyst.supabase.co";
const BUCKET_NAME = "gerador-imagens";

const IMAGENS_ESTATICAS = {
  vitalicio: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/assinatura-mensal-permanente.png`,
};

export function useAssinaturaExperiencia(): AssinaturaExperiencia {
  // Hero image importada localmente (nova imagem gerada)
  const [heroImg] = useState<string | null>(heroImage);
  
  // Imagens dos planos do storage - agora com 3 planos
  const [planImages] = useState<Record<PlanType, string | null>>({
    mensal: mensalImage,
    anual: anualImage,
    vitalicio: vitalicioImage,
    essencial: mensalImage,
    pro: mensalImage,
  });
  
  // Frase definida imediatamente na inicialização (carregamento instantâneo)
  const [fraseImpacto] = useState<string>(() => 
    FRASES_IMPACTO[Math.floor(Math.random() * FRASES_IMPACTO.length)]
  );
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  // Carregar áudio em background (sem bloquear a UI)
  useEffect(() => {
    const carregarAudio = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("gerar-frase-assinatura", {
          body: { frase: fraseImpacto }
        });
        
        if (!error && data?.audioBase64) {
          setAudioBase64(data.audioBase64);
        }
      } catch (error) {
        console.error("Erro ao carregar áudio:", error);
      }
    };

    carregarAudio();
  }, [fraseImpacto]);

  return {
    heroImage: heroImg,
    planImages,
    fraseImpacto,
    audioBase64,
    loading: false, // Nunca bloqueia - carregamento instantâneo
    imagesLoading: false // Imagens são sempre instantâneas
  };
}
