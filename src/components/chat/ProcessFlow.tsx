import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface ProcessStep {
  title: string;
  description: string;
  icon?: string;
  highlight?: boolean;
}

interface ProcessFlowProps {
  steps: ProcessStep[];
  title?: string;
  direction?: 'horizontal' | 'vertical';
}

export const ProcessFlow = ({ 
  steps, 
  title, 
  direction = 'horizontal' 
}: ProcessFlowProps) => {
  return (
    <div className="my-6">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          🔄 {title}
        </h3>
      )}
      
      <div className={`flex ${
        direction === 'horizontal' 
          ? 'flex-row overflow-x-auto gap-2 pb-2' 
          : 'flex-col gap-3'
      }`}>
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center">
            <div
              className="animate-fade-in"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <Card className={`p-4 min-w-[200px] ${
                step.highlight 
                  ? 'border-primary border-2 shadow-lg' 
                  : 'border-border'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  {step.icon && <span className="text-xl">{step.icon}</span>}
                </div>
                <h4 className="font-semibold text-sm mb-1 text-foreground">
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Card>
            </div>
            
            {idx < steps.length - 1 && (
              <ArrowRight 
                className={`mx-2 flex-shrink-0 ${
                  direction === 'horizontal' ? '' : 'rotate-90'
                } text-primary`} 
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
