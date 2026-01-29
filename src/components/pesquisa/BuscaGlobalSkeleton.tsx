import { Skeleton } from "@/components/ui/skeleton";

export const BuscaGlobalSkeleton = () => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Category cards skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
          {/* Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          
          {/* Preview items */}
          {[1, 2, 3].map((j) => (
            <div key={j} className="p-3 flex items-start gap-3 border-b border-border/30 last:border-0">
              <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default BuscaGlobalSkeleton;
