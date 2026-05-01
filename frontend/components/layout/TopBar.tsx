'use client'
import { signOut, useSession } from 'next-auth/react'

function initials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TopBar({ criticalCount = 3 }: { criticalCount?: number }) {
  const { data: session } = useSession()
  const user = session?.user

  return (
    <header
      className="col-span-2 flex items-center gap-3 px-4 border-b"
      style={{ background: '#0F1923', borderColor: '#1E3048', height: 48 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 text-[13px] font-medium text-white">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#E24B4A' }} />
        SIEM Case Manager
      </div>

      <div className="flex-1" />

      {/* Critical badge */}
      {criticalCount > 0 && (
        <span
          className="text-[11px] font-medium px-2 py-0.5 rounded"
          style={{ background: 'rgba(226,75,74,0.15)', color: '#E24B4A' }}
        >
          {criticalCount} Critical Open
        </span>
      )}

      {/* User */}
      {user && (
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          title="Sign out"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0"
            style={{ background: '#1A3A5C', color: '#7AB8F5' }}
          >
            {initials(user.name)}
          </div>
          <span className="text-[12px]" style={{ color: '#7A9BB5' }}>
            {user.email}
          </span>
        </button>
      )}
    </header>
  )
}
