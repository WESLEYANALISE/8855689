export type PoliticianType = 'deputados' | 'senadores';

interface PoliticianTypeTabsProps {
  selected: PoliticianType;
  onChange: (type: PoliticianType) => void;
}

const tabs = [
  { id: 'deputados' as const, label: 'Deputados', emoji: '🏛️' },
  { id: 'senadores' as const, label: 'Senadores', emoji: '🏦' },
];

export const PoliticianTypeTabs = ({ selected, onChange }: PoliticianTypeTabsProps) => {
  return (
    <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300
            ${selected === tab.id 
              ? 'text-foreground bg-background shadow-sm' 
              : 'text-muted-foreground hover:text-foreground/80'
            }
          `}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
};
