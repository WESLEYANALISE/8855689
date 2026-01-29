import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useAmbientSound } from "@/contexts/AmbientSoundContext";
import SpotifyLikePlayer from "./SpotifyLikePlayer";

const GlobalAudioPlayer = () => {
  const { currentAudio, closePlayer } = useAudioPlayer();
  const { stopSound } = useAmbientSound();

  const handleClose = () => {
    stopSound();
    closePlayer();
  };

  if (!currentAudio) return null;

  return (
    <SpotifyLikePlayer
      isOpen={!!currentAudio}
      onClose={handleClose}
      audioUrl={currentAudio.url_audio}
      audioUrlResposta={currentAudio.url_audio_resposta}
      audioUrlExemplo={currentAudio.url_audio_exemplo}
      title={currentAudio.titulo}
      area={currentAudio.area}
      tema={currentAudio.tema}
      descricao={currentAudio.descricao}
      imagem_miniatura={currentAudio.imagem_miniatura}
      tipo={currentAudio.tipo}
      texto_exemplo={currentAudio.texto_exemplo}
      url_imagem_exemplo={currentAudio.url_imagem_exemplo}
      pergunta={currentAudio.pergunta}
      resposta={currentAudio.resposta}
    />
  );
};

export default GlobalAudioPlayer;
