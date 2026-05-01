'use client'
import { useCases } from '@/lib/api'
import { CaseCard } from '@/components/cases/CaseCard'
import { AppShell } from '@/components/layout/AppShell'
import { AlertTriangle, FolderOpen, Clock, CheckCircle } from 'lucide-react'

export function DashboardClient() {
  const { data: cases = [] } = useCases()
  const open = cases.filter((c) => c.status === 'open').length
  const critical = cases.filter((c) => c.severity === 'critical').length
  const inProgress = cases.filter((c) => c.status === 'in_progress').length
  const recent = cases.slice(0, 5)

  const stats = [
    { label: 'Total Cases', value: cases.length, icon: FolderOpen, color: 'text-blue-400 bg-blue-900/30' },
    { label: 'Open', value: open, icon: Clock, color: 'text-amber-400 bg-amber-900/30' },
    { label: 'Critical', value: critical, icon: AlertTriangle, color: 'text-red-400 bg-red-900/30' },
    { label: 'In Progress', value: inProgress, icon: CheckCircle, color: 'text-green-400 bg-green-900/30' },
  ]

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#162030] border border-[#1E3048] rounded-xl p-4">
              <div className={`inline-flex p-2 rounded-lg mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Recent Cases</h2>
          <div className="space-y-2">
            {recent.map((c) => (
              <CaseCard key={c.id} case={c} />
            ))}
          </div>
          {recent.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No cases yet</p>
          )}
        </div>
      </div>
    </AppShell>
  )
}
