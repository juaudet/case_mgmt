import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'destructive' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        variant === 'destructive'
          ? 'bg-red-900 text-red-200'
          : variant === 'outline'
          ? 'border border-[#1E3048] text-slate-300'
          : 'bg-[#1A3A5C] text-blue-200',
        className
      )}
      {...props}
    />
  )
}
