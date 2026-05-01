import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  asChild?: boolean
}

const variants = {
  default: 'bg-[#1A3A5C] hover:bg-[#2A5A8C] text-white',
  destructive: 'bg-red-800 hover:bg-red-700 text-white',
  ghost: 'hover:bg-[#1E3048] text-slate-300',
  outline: 'border border-[#1E3048] hover:bg-[#1E3048] text-slate-300',
}

const sizes = {
  default: 'px-4 py-2 text-sm',
  sm: 'px-3 py-1.5 text-xs',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
