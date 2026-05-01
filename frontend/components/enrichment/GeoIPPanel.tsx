'use client'
import { Globe } from 'lucide-react'

interface GeoIPData {
  country?: string
  country_code?: string
  city?: string
  region?: string
  asn?: string
  org?: string
  latitude?: number
  longitude?: number
}

interface GeoIPPanelProps {
  data?: GeoIPData
  ip?: string
  onEnrich?: () => void
  loading?: boolean
}

export function GeoIPPanel({ data, ip, onEnrich, loading }: GeoIPPanelProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="flex justify-center">
          <div className="p-3 bg-[#1E3048] rounded-full">
            <Globe className="w-5 h-5 text-slate-500" />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          {ip ? `GeoIP not resolved for ${ip}` : 'No IP to geolocate'}
        </p>
        {onEnrich && ip && (
          <button
            onClick={onEnrich}
            disabled={loading}
            className="px-3 py-1.5 bg-[#1A3A5C] hover:bg-[#2A5A8C] text-blue-300 text-xs rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'Lookup GeoIP'}
          </button>
        )}
      </div>
    )
  }

  const fields: Array<{ label: string; value?: string | number }> = [
    { label: 'Country', value: data.country_code ? `${data.country} (${data.country_code})` : data.country },
    { label: 'City', value: data.city },
    { label: 'Region', value: data.region },
    { label: 'ASN', value: data.asn },
    { label: 'Organization', value: data.org },
    { label: 'Coordinates', value: data.latitude != null ? `${data.latitude}, ${data.longitude}` : undefined },
  ].filter((f) => f.value != null)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-semibold text-white">GeoIP Info</h3>
        {ip && <span className="text-xs font-mono text-slate-500">{ip}</span>}
      </div>
      <table className="w-full text-xs">
        <tbody>
          {fields.map(({ label, value }) => (
            <tr key={label} className="border-b border-[#1E3048]/50">
              <td className="py-1.5 pr-3 text-slate-500 font-medium w-1/3">{label}</td>
              <td className="py-1.5 text-slate-300">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
