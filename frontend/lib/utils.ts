import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Severity, CaseStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function severityColor(severity: Severity): string {
  return {
    critical: 'bg-red-900 text-red-200 border-red-700',
    high: 'bg-orange-900 text-orange-200 border-orange-700',
    medium: 'bg-yellow-900 text-yellow-200 border-yellow-700',
    low: 'bg-blue-900 text-blue-200 border-blue-700',
  }[severity]
}

export function statusColor(status: CaseStatus): string {
  return {
    open: 'bg-blue-900 text-blue-200',
    in_progress: 'bg-amber-900 text-amber-200',
    closed: 'bg-green-900 text-green-200',
    false_positive: 'bg-gray-700 text-gray-300',
  }[status]
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
