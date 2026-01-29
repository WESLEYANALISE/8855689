import { Skeleton } from "@/components/ui/skeleton";

export const FerramentasSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-40 mx-auto mb-3" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Search */}
      <Skeleton className="h-12 w-full max-w-md mx-auto rounded-xl mb-8" />

      {/* Tools grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border text-center">
            <Skeleton className="h-12 w-12 rounded-xl mx-auto mb-3" />
            <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FerramentasSkeleton;
