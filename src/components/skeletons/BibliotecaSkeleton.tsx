import { Skeleton } from "@/components/ui/skeleton";

export const BibliotecaSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Category cards - horizontal scroll */}
      <div className="mb-8">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-40">
              <Skeleton className="aspect-[3/4] w-full rounded-xl mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      {/* Books grid */}
      <div>
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden border border-border">
              <Skeleton className="aspect-[2/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BibliotecaSkeleton;
