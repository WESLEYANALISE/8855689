import { Card } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";

interface TimelineStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

interface InfographicTimelineProps {
  title: string;
  steps: TimelineStep[];
}

export function InfographicTimeline({ title, steps }: InfographicTimelineProps) {
  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📊 {title}
      </h3>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.number}>
            <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {step.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{step.icon}</span>
                    <h4 className="font-semibold text-base">{step.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </Card>
            {index < steps.length - 1 && (
              <div className="flex justify-center py-2">
                <ArrowDown className="w-5 h-5 text-primary/40" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
