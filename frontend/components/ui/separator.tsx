import { cn } from '@/lib/utils'

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) {
  return (
    <hr
      className={cn(
        'border-[#1E3048]',
        orientation === 'vertical' ? 'border-l h-full border-t-0' : 'border-t w-full',
        className
      )}
      {...props}
    />
  )
}
