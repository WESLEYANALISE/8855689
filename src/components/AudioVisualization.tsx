interface AudioVisualizationProps {
  isPlaying: boolean;
}

const AudioVisualization = ({ isPlaying }: AudioVisualizationProps) => {
  const bars = [
    { delay: "0s", height: isPlaying ? "h-6" : "h-2" },
    { delay: "0.1s", height: isPlaying ? "h-8" : "h-2" },
    { delay: "0.2s", height: isPlaying ? "h-5" : "h-2" },
    { delay: "0.15s", height: isPlaying ? "h-7" : "h-2" },
    { delay: "0.05s", height: isPlaying ? "h-4" : "h-2" },
  ];

  return (
    <div className="flex items-center gap-1 h-10">
      {bars.map((bar, index) => (
        <div
          key={index}
          className={`w-1 rounded-full bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-300 ${bar.height} ${
            isPlaying ? 'animate-pulse' : ''
          }`}
          style={{
            animationDelay: bar.delay,
            animationDuration: '0.8s',
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualization;
