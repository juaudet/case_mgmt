'use client'
import { User } from 'lucide-react'

interface LDAPPanelProps {
  data?: Record<string, unknown>
  onEnrich?: () => void
  loading?: boolean
}

export function LDAPPanel({ data, onEnrich, loading }: LDAPPanelProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="flex justify-center">
          <div className="p-3 bg-[#1E3048] rounded-full">
            <User className="w-5 h-5 text-slate-500" />
          </div>
        </div>
        <p className="text-xs text-slate-500">LDAP context not enriched</p>
        {onEnrich && (
          <button
            onClick={onEnrich}
            disabled={loading}
            className="px-3 py-1.5 bg-[#1A3A5C] hover:bg-[#2A5A8C] text-blue-300 text-xs rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Enriching...' : 'Enrich LDAP'}
          </button>
        )}
      </div>
    )
  }

  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-semibold text-white">LDAP Context</h3>
      </div>
      <table className="w-full text-xs">
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} className="border-b border-[#1E3048]/50">
              <td className="py-1.5 pr-3 text-slate-500 font-medium w-1/3 align-top">
                {key.replace(/_/g, ' ')}
              </td>
              <td className="py-1.5 text-slate-300 font-mono break-all">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
