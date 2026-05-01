'use client'
import type { IOCRef } from '@/types'
import { Globe, Hash, AtSign, Link as LinkIcon } from 'lucide-react'

const typeIcon: Record<string, React.ReactNode> = {
  ipv4: <Globe className="w-3.5 h-3.5" />,
  sha256: <Hash className="w-3.5 h-3.5" />,
  domain: <Globe className="w-3.5 h-3.5" />,
  url: <LinkIcon className="w-3.5 h-3.5" />,
  email: <AtSign className="w-3.5 h-3.5" />,
}

function scoreColor(score?: number) {
  if (!score) return 'text-slate-500'
  if (score >= 80) return 'text-red-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-green-400'
}

export function IOCTable({
  iocs,
  onEnrich,
}: {
  iocs: IOCRef[]
  onEnrich?: (ioc: IOCRef) => void
}) {
  if (!iocs.length)
    return <p className="text-sm text-slate-500 py-4">No IOCs recorded</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#1E3048]">
            <th className="text-left py-2 px-3 text-slate-500 font-medium">Type</th>
            <th className="text-left py-2 px-3 text-slate-500 font-medium">Value</th>
            <th className="text-left py-2 px-3 text-slate-500 font-medium">Score</th>
            <th className="text-left py-2 px-3 text-slate-500 font-medium">Label</th>
            {onEnrich && (
              <th className="text-left py-2 px-3 text-slate-500 font-medium">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {iocs.map((ioc, i) => (
            <tr key={i} className="border-b border-[#1E3048]/50 hover:bg-[#1E3048]/30">
              <td className="py-2 px-3">
                <div className="flex items-center gap-1.5 text-slate-400">
                  {typeIcon[ioc.type]}
                  <span className="uppercase text-slate-500">{ioc.type}</span>
                </div>
              </td>
              <td className="py-2 px-3 font-mono text-slate-200">{ioc.value}</td>
              <td className={`py-2 px-3 font-semibold ${scoreColor(ioc.score)}`}>
                {ioc.score ?? '—'}
              </td>
              <td className="py-2 px-3 text-slate-400">{ioc.label ?? '—'}</td>
              {onEnrich && (
                <td className="py-2 px-3">
                  <button
                    onClick={() => onEnrich(ioc)}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    Enrich
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
