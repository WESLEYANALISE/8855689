import { Skeleton } from "@/components/ui/skeleton";

export const SimulacaoSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-48 mx-auto mb-3" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Hero image placeholder */}
      <div className="relative mb-8">
        <Skeleton className="aspect-[16/9] w-full max-w-lg mx-auto rounded-2xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border">
            <Skeleton className="h-12 w-12 rounded-lg mb-3" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <div className="mt-8 flex justify-center">
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    </div>
  );
};

export default SimulacaoSkeleton;
