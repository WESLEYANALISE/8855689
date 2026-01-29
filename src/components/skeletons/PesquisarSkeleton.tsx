import { Skeleton } from "@/components/ui/skeleton";

export const PesquisarSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Results placeholder */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-32 mb-4" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card p-4 rounded-xl border border-border space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PesquisarSkeleton;
