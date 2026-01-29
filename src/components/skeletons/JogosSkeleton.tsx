import { Skeleton } from "@/components/ui/skeleton";

export const JogosSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-48 mx-auto mb-3" />
        <Skeleton className="h-4 w-72 mx-auto" />
      </div>

      {/* Stats bar */}
      <div className="flex justify-center gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <Skeleton className="h-8 w-8 rounded-full mx-auto mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Games grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-4 border border-border">
            <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
            </div>
            <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3 mx-auto mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default JogosSkeleton;
