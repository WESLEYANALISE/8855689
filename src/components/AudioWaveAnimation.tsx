const AudioWaveAnimation = () => {
  return (
    <div className="flex items-center justify-center gap-[2px] h-3.5 w-4">
      <div className="w-[2px] h-2 bg-current rounded-full animate-wave-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-[2px] h-3 bg-current rounded-full animate-wave-pulse" style={{ animationDelay: '150ms' }} />
      <div className="w-[2px] h-2 bg-current rounded-full animate-wave-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  );
};

export default AudioWaveAnimation;
