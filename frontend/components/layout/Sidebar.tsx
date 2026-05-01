'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LayoutDashboard, FolderOpen, BookOpen, Shield, User, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cases', label: 'Cases', icon: FolderOpen },
  { href: '/playbooks', label: 'Playbooks', icon: BookOpen },
]

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside
      className={cn(
        'flex flex-col bg-[#0B1520] border-r border-[#1E3048] transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#1E3048]">
        <Shield className="w-6 h-6 text-blue-400 shrink-0" />
        {!collapsed && <span className="font-bold text-white text-sm">SIEM Manager</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition',
                active
                  ? 'bg-[#1A3A5C] text-white'
                  : 'text-slate-400 hover:bg-[#162030] hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {session?.user && (
        <div
          className={cn(
            'px-3 py-4 border-t border-[#1E3048] flex items-center gap-2',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-7 h-7 rounded-full bg-[#1A3A5C] flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-blue-300" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {(session.user as { role?: string }).role}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="mx-auto mb-3 p-1 text-slate-500 hover:text-white transition"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft
          className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
        />
      </button>
    </aside>
  )
}
