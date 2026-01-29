import { Skeleton } from "@/components/ui/skeleton";

export const FlashcardsSkeleton = () => {
  return (
    <div className="min-h-screen bg-background p-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Main flashcard */}
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-md aspect-[3/4] rounded-2xl bg-card border border-border p-6 flex flex-col">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-10 w-full mt-auto rounded-lg" />
        </div>

        {/* Action buttons */}
        <div className="flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default FlashcardsSkeleton;
