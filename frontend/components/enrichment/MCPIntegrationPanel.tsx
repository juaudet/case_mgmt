'use client'

import type { Case } from '@/types'
import { MCPConnectorGrid } from './MCPConnectorGrid'

export function MCPIntegrationPanel({ caseData, caseId }: { caseData: Case; caseId: string }) {

  return (
    <div className="space-y-5">
      <MCPConnectorGrid activeProvider="VirusTotal" />
    </div>
  )
}
