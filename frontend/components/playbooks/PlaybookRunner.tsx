'use client'
import type { Case, PlaybookStep, Playbook } from '@/types'
import { CheckCircle, Circle, Cpu, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PlaybookRunner({
  playbook,
  caseData,
  onStepComplete,
}: {
  playbook: Playbook
  caseData: Case
  onStepComplete: (stepId: string, resultData: Record<string, unknown>) => void
}) {
  const state = caseData.playbook_state
  const currentStepId = state?.current_step_id
  const completed = state?.completed_steps ?? []
  const phases = [
    { title: 'Phase 1 — Initial triage & scoping', steps: playbook.steps.slice(0, 4) },
    { title: 'Phase 2 — Containment', steps: playbook.steps.slice(4, 8) },
    { title: 'Phase 3 — Investigation & evidence collection', steps: playbook.steps.slice(8) },
  ]

  return (
    <div className="space-y-4 text-[#F4F1E8]">
      <div className="rounded-2xl border border-[#464641] bg-[#171714] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[#464641] bg-[#242421] p-2">
            <Cpu className="w-4 h-4 text-[#97C459]" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9B9A92]">Playbook runner</p>
            <h3 className="text-xl font-semibold text-white">{playbook.name}</h3>
          </div>
          <span className="ml-auto rounded-full border border-[#464641] bg-[#242421] px-3 py-1 text-[12px] text-[#C9C3B4]">
            {completed.length} / {playbook.steps.length} steps complete
          </span>
        </div>
        {playbook.description && (
          <p className="mt-3 max-w-3xl text-[12px] leading-5 text-[#C9C3B4]">{playbook.description}</p>
        )}
      </div>

      {phases.map((phase) => {
        const phaseComplete = phase.steps.filter((step) => completed.includes(step.step_id)).length
        return (
          <section
            key={phase.title}
            className="rounded-2xl border border-[#464641] bg-[#242421] shadow-lg shadow-black/10"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#3B3B37] px-4 py-3">
              <div>
                <h4 className="text-[14px] font-semibold text-[#F5F2E8]">{phase.title}</h4>
                <p className="mt-0.5 text-[11px] text-[#9B9A92]">Phase progress and required evidence</p>
              </div>
              <span className="rounded-full border border-[#5B5B54] bg-[#2D2D2A] px-3 py-1 text-[12px] font-semibold text-[#D7ECFF]">
                {phaseComplete} / {phase.steps.length}
              </span>
            </div>
            <div className="divide-y divide-[#3B3B37]">
              {phase.steps.length > 0 ? (
                phase.steps.map((step) => {
                  const isDone = completed.includes(step.step_id)
                  const isCurrent = step.step_id === currentStepId
                  return (
                    <StepRow
                      key={step.step_id}
                      step={step}
                      isDone={isDone}
                      isCurrent={isCurrent}
                      onComplete={() => onStepComplete(step.step_id, {})}
                    />
                  )
                })
              ) : (
                <div className="px-4 py-4 text-[12px] text-[#7D7A70]">No steps in this phase.</div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function StepRow({
  step,
  isDone,
  isCurrent,
  onComplete,
}: {
  step: PlaybookStep
  isDone: boolean
  isCurrent: boolean
  onComplete: () => void
}) {
  return (
    <div
      className={cn(
        'grid gap-3 px-4 py-4 transition md:grid-cols-[32px_1fr_180px]',
        isDone
          ? 'bg-[#1C2619]'
          : isCurrent
          ? 'bg-[#1A2A3E]'
          : 'bg-[#242421]'
      )}
    >
      <button
        aria-label={`Mark ${step.title} complete`}
        disabled={isDone}
        onClick={onComplete}
        className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full disabled:cursor-default"
      >
        {isDone ? (
          <CheckCircle className="h-5 w-5 text-[#97C459]" />
        ) : (
          <Circle className={cn('h-5 w-5', isCurrent ? 'text-[#378ADD]' : 'text-[#7D7A70]')} />
        )}
      </button>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h5 className={cn('text-[13px] font-semibold', isDone ? 'text-[#A8C997]' : 'text-white')}>
            {step.title}
          </h5>
          {isCurrent && !isDone && (
            <span className="rounded-full bg-[#1A3A5C] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7AB8F5]">
              Current
            </span>
          )}
        </div>
        <p className="mt-1 text-[12px] leading-5 text-[#C9C3B4]">{step.description}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {step.mitre_technique && (
            <span className="rounded border border-[#5B5B54] bg-[#171714] px-2 py-0.5 font-mono text-[10px] text-[#9B9A92]">
              {step.mitre_technique}
            </span>
          )}
          {step.mcp_tools.map((tool) => (
            <span
              key={tool}
              className="inline-flex items-center gap-1 rounded border border-[#2C4664] bg-[#1A3A5C] px-2 py-0.5 font-mono text-[10px] text-[#D7ECFF]"
            >
              <Wrench className="h-3 w-3" />
              {tool}
            </span>
          ))}
          {step.branches.map((branch) => (
            <span
              key={branch.when}
              className="rounded border border-[#5B5B54] bg-[#2D2D2A] px-2 py-0.5 text-[10px] text-[#C9C3B4]"
            >
              {branch.when} → {branch.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-end">
        <button
          disabled={isDone}
          onClick={onComplete}
          className="rounded-md border border-[#5B5B54] bg-[#2D2D2A] px-3 py-1.5 text-[11px] font-semibold text-[#F5F2E8] transition hover:border-[#378ADD] hover:text-[#D7ECFF] disabled:border-[#3B3B37] disabled:text-[#7D7A70]"
        >
          {isDone ? 'Completed' : 'Mark Complete'}
        </button>
      </div>
    </div>
  )
}
