// Pré-carregador do vídeo do onboarding
// Inicia o download durante o cadastro para reprodução instantânea no onboarding

let videoPreloaded = false;
let videoBlob: Blob | null = null;
let videoUrl: string | null = null;

export const preloadOnboardingVideo = async () => {
  if (videoPreloaded) return;
  videoPreloaded = true;
  
  try {
    console.log('[OnboardingVideo] Iniciando pré-carregamento...');
    const response = await fetch('/videos/INTRO-2.mp4');
    videoBlob = await response.blob();
    videoUrl = URL.createObjectURL(videoBlob);
    console.log('[OnboardingVideo] Vídeo pré-carregado com sucesso');
  } catch (err) {
    console.warn('[OnboardingVideo] Falha ao pré-carregar vídeo:', err);
    videoPreloaded = false;
  }
};

export const getPreloadedVideoUrl = (): string => {
  return videoUrl || '/videos/INTRO-2.mp4';
};

export const isVideoPreloaded = () => videoPreloaded && videoUrl !== null;
