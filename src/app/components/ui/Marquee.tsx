import { cn } from './utils'

interface MarqueeProps {
  children: React.ReactNode
  reverse?: boolean
  pauseOnHover?: boolean
  duration?: string
  className?: string
}

export function Marquee({
  children,
  reverse = false,
  pauseOnHover = false,
  duration = '40s',
  className,
}: MarqueeProps) {
  return (
    <div
      className={cn('flex overflow-hidden', className)}
      style={
        {
          '--marquee-duration': duration,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          'flex shrink-0 gap-4 animate-marquee',
          reverse && 'animate-marquee-reverse',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={cn(
          'flex shrink-0 gap-4 animate-marquee',
          reverse && 'animate-marquee-reverse',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
      >
        {children}
      </div>
    </div>
  )
}
