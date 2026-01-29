import { useEffect, useState } from "react";

interface ProgressBarProps {
  progress: number;
  message: string;
  subMessage?: string;
}

export const ProgressBar = ({ progress, message, subMessage }: ProgressBarProps) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-8">
      <div className="relative w-32 h-32">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-accent transition-all duration-500 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-accent">{displayProgress}%</span>
        </div>
      </div>

      <div className="text-center space-y-2 max-w-md animate-fade-in">
        <p className="text-lg font-semibold text-foreground">{message}</p>
        {subMessage && (
          <p className="text-sm text-muted-foreground">{subMessage}</p>
        )}
      </div>

      <div className="w-full max-w-md">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
