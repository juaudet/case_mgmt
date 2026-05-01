import { cn } from '@/lib/utils'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full bg-[#0F1923] border border-[#1E3048] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition appearance-none cursor-pointer',
        className
      )}
      {...props}
    />
  )
}

export function SelectItem({ className, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) {
  return <option className={cn('bg-[#0F1923] text-white', className)} {...props} />
}
