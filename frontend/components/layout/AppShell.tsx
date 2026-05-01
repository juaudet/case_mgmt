'use client'
import { Suspense } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: JSX.Element | JSX.Element[] | null | undefined | string | false
  title?: string
  noPadding?: boolean
}

export function AppShell({ children, title: _title, noPadding }: AppShellProps) {
  return (
    <div
      className="grid h-screen overflow-hidden"
      style={{ gridTemplateColumns: '220px 1fr', gridTemplateRows: '48px 1fr' }}
    >
      <TopBar />
      <Suspense
        fallback={
          <aside
            style={{
              background: '#0B1520',
              borderRight: '1px solid #1E3048',
              gridRow: '2',
            }}
          />
        }
      >
        <Sidebar />
      </Suspense>
      <main className={noPadding ? 'overflow-hidden' : 'overflow-auto p-6'}>{children}</main>
    </div>
  )
}
