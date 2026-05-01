'use client'
import { signOut } from 'next-auth/react'
import { Bell, LogOut } from 'lucide-react'

export function TopBar({ title }: { title: string }) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[#1E3048] bg-[#0F1923]">
      <h1 className="text-sm font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="text-slate-400 hover:text-white transition" aria-label="Notifications">
          <Bell className="w-4 h-4" />
        </button>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </header>
  )
}
