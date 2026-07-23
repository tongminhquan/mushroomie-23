import { Flower2, Heart, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

const icons = {
  flower: Flower2,
  heart: Heart,
  sparkle: Sparkles,
}

export default function AnimatedDoodle({
  icon,
  className,
}: {
  icon: keyof typeof icons
  className?: string
}) {
  const Icon = icons[icon]
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute text-current motion-safe:animate-[landing-float_5s_ease-in-out_infinite]', className)}
    >
      <Icon className="h-full w-full" strokeWidth={2.2} />
    </span>
  )
}
