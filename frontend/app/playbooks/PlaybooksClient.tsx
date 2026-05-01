'use client'
import { usePlaybooks } from '@/lib/api'
import { AppShell } from '@/components/layout/AppShell'
import { BookOpen, ChevronRight, Cpu } from 'lucide-react'

export function PlaybooksClient() {
  const { data: playbooks = [], isLoading } = usePlaybooks()

  return (
    <AppShell title="Playbooks">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">{playbooks.length} playbooks available</p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-[#162030] border border-[#1E3048] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playbooks.map((pb) => (
            <div
              key={pb.id}
              className="bg-[#162030] border border-[#1E3048] rounded-xl p-5 hover:border-blue-700 hover:bg-[#1A2A3E] transition group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#1A3A5C] rounded-lg">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{pb.name}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition shrink-0" />
              </div>

              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{pb.description}</p>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  <span>{pb.steps.length} steps</span>
                </div>
              </div>

              {pb.mitre_tactics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {pb.mitre_tactics.map((tactic) => (
                    <span
                      key={tactic}
                      className="px-2 py-0.5 bg-[#0F1923] text-blue-400 text-xs rounded font-mono border border-[#1E3048]"
                    >
                      {tactic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isLoading && playbooks.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">No playbooks found</div>
        )}
      </div>
    </AppShell>
  )
}
