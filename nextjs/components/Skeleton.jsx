export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-cream-sub ${className}`} />;
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`py-4 flex items-center gap-4 ${className}`}>
      <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-border p-5 ${className}`}>
      <Skeleton className="h-44 w-full mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-9 w-full rounded-full" />
    </div>
  );
}

export function SkeletonStat({ className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-border p-6 ${className}`}>
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-3 w-24 mt-5 mb-2" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-1/3 mt-1" />
    </div>
  );
}
