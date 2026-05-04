'use client'
import { signOut, useSession } from 'next-auth/react'

export function TopBar({ criticalCount = 3 }: { criticalCount?: number }) {
  const { data: session } = useSession()

  return (
    <header className="flex-shrink-0 h-10 flex items-center justify-between px-4 bg-base border-b border-subtle">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-accent-blue font-semibold tracking-wide">⬡ CASEMGMT</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-muted">{session?.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="font-mono text-[10px] text-accent-blue hover:text-primary transition-colors"
        >
          logout
        </button>
      </div>
    </header>
  )
}
