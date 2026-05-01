import { create } from 'zustand'
import type { Case } from '@/types'

interface SIEMStore {
  activeCase: Case | null
  setActiveCase: (c: Case | null) => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  consoleOpen: boolean
  toggleConsole: () => void
  selectedCaseIds: Set<string>
  toggleCaseSelection: (id: string) => void
  clearSelection: () => void
}

export const useSIEMStore = create<SIEMStore>((set) => ({
  activeCase: null,
  setActiveCase: (c) => set({ activeCase: c }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  consoleOpen: false,
  toggleConsole: () => set((s) => ({ consoleOpen: !s.consoleOpen })),
  selectedCaseIds: new Set(),
  toggleCaseSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedCaseIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { selectedCaseIds: next }
    }),
  clearSelection: () => set({ selectedCaseIds: new Set() }),
}))
