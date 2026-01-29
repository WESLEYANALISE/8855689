import { useParams, Navigate } from "react-router-dom";
import ForcaGame from "./ForcaGame";
import CruzadasGame from "./CruzadasGame";
import CacaPalavrasGame from "./CacaPalavrasGame";
import StopGame from "./StopGame";

const JogoRouter = () => {
  const { tipo } = useParams<{ tipo: string }>();

  switch (tipo) {
    case 'forca':
      return <ForcaGame />;
    case 'cruzadas':
      return <CruzadasGame />;
    case 'caca_palavras':
      return <CacaPalavrasGame />;
    case 'stop':
      return <StopGame />;
    default:
      return <Navigate to="/jogos-juridicos" replace />;
  }
};

export default JogoRouter;
