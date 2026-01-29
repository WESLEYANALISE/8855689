interface TypingIndicatorProps {
  nome?: string;
  variant?: 'default' | 'chat';
}

export const TypingIndicator = ({ nome = "Juíza", variant = 'default' }: TypingIndicatorProps) => {
  if (variant === 'chat') {
    return (
      <div className="flex items-start gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">P</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-foreground">Professora</span>
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-lg px-3 py-2">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0s" }} />
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: "0.3s" }} />
            </div>
            <span className="text-xs text-muted-foreground italic">digitando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-purple-300 text-sm animate-fade-in">
      <div className="flex gap-1 bg-purple-500/20 border border-purple-500/30 rounded-lg px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0s" }} />
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
      </div>
      <span className="italic text-xs">{nome} está digitando...</span>
    </div>
  );
};
