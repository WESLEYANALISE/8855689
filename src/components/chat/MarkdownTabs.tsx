import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownTabsProps {
  tabs: Array<{
    title: string;
    content: string;
    icon?: string;
  }>;
}

export const MarkdownTabs = ({ tabs }: MarkdownTabsProps) => {
  return (
    <Tabs defaultValue="0" className="w-full my-6">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab, idx) => (
          <TabsTrigger key={idx} value={String(idx)} className="text-sm">
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab, idx) => (
        <TabsContent key={idx} value={String(idx)} className="prose prose-sm max-w-none dark:prose-invert mt-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{tab.content}</ReactMarkdown>
        </TabsContent>
      ))}
    </Tabs>
  );
};
