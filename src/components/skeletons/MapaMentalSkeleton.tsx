import { Skeleton } from "@/components/ui/skeleton";

export const MapaMentalSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-44 mx-auto mb-3" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>

      {/* Hero image */}
      <Skeleton className="aspect-[4/3] w-full max-w-md mx-auto rounded-2xl mb-8" />

      {/* Areas grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-1" />
            <div className="mt-3 flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapaMentalSkeleton;
