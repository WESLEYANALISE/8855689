import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownAccordionProps {
  items: Array<{
    title: string;
    content: string;
    icon?: string;
  }>;
}

export const MarkdownAccordion = ({ items }: MarkdownAccordionProps) => {
  return (
    <Accordion type="single" collapsible className="w-full my-6">
      {items.map((item, idx) => (
        <AccordionItem key={idx} value={`item-${idx}`}>
          <AccordionTrigger className="text-left hover:no-underline">
            <span className="flex items-center gap-2">
              {item.icon && <span>{item.icon}</span>}
              <span className="font-semibold">{item.title}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="prose prose-sm max-w-none dark:prose-invert pt-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
