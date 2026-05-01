import type { MCPCallRecord } from '@/types'

export function MCPToolCallCard({ call }: { call: MCPCallRecord }) {
  return (
    <div className="border-l-2 border-[#378ADD] bg-[#242421] p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-[#E6F1FB] px-2 py-0.5 font-mono text-[10px] font-medium text-[#185FA5]">
          MCP
        </span>
        <span className="font-mono text-[11px] font-semibold text-[#F5F2E8]">
          {call.tool_name}
        </span>
        <span className="ml-auto font-mono text-[10px] text-[#9B9A92]">{call.status}</span>
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-[10px] leading-5 text-[#C7C2B5]">
        {JSON.stringify(call.params, null, 2)}
      </pre>
    </div>
  )
}
