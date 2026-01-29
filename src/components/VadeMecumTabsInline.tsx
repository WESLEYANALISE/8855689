import { Music, Flame } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VadeMecumTabsInlineProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const VadeMecumTabsInline = ({ activeTab, onTabChange }: VadeMecumTabsInlineProps) => {
  return (
    <div className="px-4 py-2 max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-auto bg-muted/20 gap-1 p-1 rounded-xl">
          <TabsTrigger 
            value="playlist" 
            className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg data-[state=active]:bg-[hsl(45,93%,58%)]/20 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-[hsl(45,93%,58%)]/30 transition-colors"
          >
            <Music className="w-3.5 h-3.5" />
            <span>Playlist</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="ranking" 
            className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg data-[state=active]:bg-[hsl(45,93%,58%)]/20 data-[state=active]:text-foreground data-[state=active]:border data-[state=active]:border-[hsl(45,93%,58%)]/30 transition-colors"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Em Alta</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};