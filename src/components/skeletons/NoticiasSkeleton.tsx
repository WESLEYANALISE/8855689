import { Skeleton } from "@/components/ui/skeleton";

export const NoticiasSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Featured news */}
      <div className="mb-6">
        <Skeleton className="aspect-[16/9] w-full rounded-xl mb-3" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6 mt-1" />
      </div>

      {/* Categories tabs */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-lg flex-shrink-0" />
        ))}
      </div>

      {/* News list */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 bg-card p-3 rounded-xl border border-border">
            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoticiasSkeleton;
