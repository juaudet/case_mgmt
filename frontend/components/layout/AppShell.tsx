'use client'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: JSX.Element | JSX.Element[] | null | undefined | string | false
  title?: string
  noPadding?: boolean
}

export function AppShell({ children, title: _title, noPadding }: AppShellProps) {
  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
    >
      <TopBar />
      <main className={noPadding ? 'flex-1 overflow-hidden' : 'flex-1 overflow-auto p-6'}>{children}</main>
    </div>
  )
}
