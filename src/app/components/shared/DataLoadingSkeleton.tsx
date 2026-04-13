import { Skeleton } from '../ui/skeleton'

interface DataLoadingSkeletonProps {
  lines?: number
  className?: string
}

export function DataLoadingSkeleton({ lines = 3, className }: DataLoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className || ''}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full bg-slate-800" />
      ))}
    </div>
  )
}

export function ChartLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Skeleton className="h-64 w-full bg-slate-800 rounded-xl" />
      <Skeleton className="h-4 w-32 mt-4 bg-slate-800" />
    </div>
  )
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-6 flex-1 bg-slate-800" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1 bg-slate-800" />
          ))}
        </div>
      ))}
    </div>
  )
}
