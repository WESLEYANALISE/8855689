import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useState, useEffect } from 'react';

interface JurisprudenciaLoadingAnimationProps {
  etapas: string[];
}

const TITULOS_ROTATIVOS = [
  'Buscando jurisprudência nos tribunais...',
  'Conectando à API dos Tribunais...',
  'Consultando base de dados jurídicos...',
  'Analisando precedentes vinculantes...',
];

const MENSAGENS_CURIOSIDADE = [
  '"A jurisprudência é a bússola do advogado no mar do direito."',
  '"STF e STJ: guardiões da uniformização jurisprudencial."',
  '"Súmulas vinculantes garantem segurança jurídica."',
  '"O Corpus 927 reúne os precedentes mais relevantes."',
  '"A tese jurídica é o coração da decisão."',
  '"Precedentes obrigatórios orientam decisões futuras."',
  '"A uniformização jurisprudencial evita decisões conflitantes."',
  '"Repercussão geral: quando a questão transcende o interesse das partes."',
];

export const JurisprudenciaLoadingAnimation = ({ etapas }: JurisprudenciaLoadingAnimationProps) => {
  const [tituloIndex, setTituloIndex] = useState(0);
  const [mensagemIndex, setMensagemIndex] = useState(0);

  useEffect(() => {
    const intervalTitulo = setInterval(() => {
      setTituloIndex(prev => (prev + 1) % TITULOS_ROTATIVOS.length);
    }, 3000);

    const intervalMensagem = setInterval(() => {
      setMensagemIndex(prev => (prev + 1) % MENSAGENS_CURIOSIDADE.length);
    }, 4000);

    return () => {
      clearInterval(intervalTitulo);
      clearInterval(intervalMensagem);
    };
  }, []);

  const tituloAtual = TITULOS_ROTATIVOS[tituloIndex];
  const mensagemAtual = MENSAGENS_CURIOSIDADE[mensagemIndex];
  const progressoPercentual = Math.min(etapas.length * 15, 95);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {/* Animação Lottie */}
      <div className="w-48 h-48 -my-4">
        <DotLottieReact
          src="https://lottie.host/d67166d6-1f9b-420f-82db-9d91c085006d/iG6u0nCNLc.lottie"
          loop
          autoplay
        />
      </div>

      {/* Título rotativo */}
      <h3 className="text-base font-semibold text-foreground text-center animate-fade-in" key={tituloIndex}>
        {tituloAtual}
      </h3>

      {/* Mensagem curiosidade estilo citação */}
      <p 
        className="text-sm text-muted-foreground text-center italic max-w-xs animate-fade-in" 
        key={`msg-${mensagemIndex}`}
      >
        {mensagemAtual}
      </p>

      {/* Barra de progresso com efeito pulsante */}
      <div className="w-full max-w-xs mt-2">
        <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
          {/* Barra de fundo com gradiente animado */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-orange-500/30 to-amber-600/20 animate-pulse"
          />
          
          {/* Barra de progresso principal */}
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressoPercentual}%` }}
          />
          
          {/* Efeito de brilho que passa pela barra */}
          <div 
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
            style={{
              animation: 'shimmer 1.5s ease-in-out infinite',
              left: '-20%',
            }}
          />
        </div>
      </div>

      {/* Última etapa real do processo */}
      {etapas.length > 0 && (
        <p className="text-[10px] text-muted-foreground/70 text-center max-w-xs">
          {etapas[etapas.length - 1]}
        </p>
      )}

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(500%); }
        }
      `}</style>
    </div>
  );
};

export default JurisprudenciaLoadingAnimation;
