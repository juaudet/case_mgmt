'use client'
import { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  active: string
  setActive: (v: string) => void
}

const TabsContext = createContext<TabsContextValue>({ active: '', setActive: () => {} })

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string
  children: React.ReactNode
  className?: string
}) {
  const [active, setActive] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex gap-1 bg-[#0F1923] border border-[#1E3048] rounded-lg p-1',
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const { active, setActive } = useContext(TabsContext)
  return (
    <button
      onClick={() => setActive(value)}
      className={cn(
        'flex-1 px-3 py-1.5 text-xs rounded-md font-medium transition',
        active === value
          ? 'bg-[#1A3A5C] text-white'
          : 'text-slate-400 hover:text-white'
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  )
}
