'use client'
import React from 'react'
import { TopBar } from './TopBar'

interface AppShellProps {
  children: React.ReactNode
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
