import clsx from 'clsx'
import type { ProfileStatus, DeploymentStatus, StepStatus, ApprovalStatus } from '@/types'

type Status = ProfileStatus | DeploymentStatus | StepStatus | ApprovalStatus

const config: Record<string, { label: string; classes: string }> = {
  DRAFT:            { label: 'Draft',            classes: 'bg-slate-100 text-slate-600 ring-slate-200' },
  PENDING_APPROVAL: { label: 'Pending Approval',  classes: 'bg-amber-50 text-amber-700 ring-amber-200' },
  APPROVED:         { label: 'Approved',          classes: 'bg-blue-50 text-blue-700 ring-blue-200' },
  REJECTED:         { label: 'Rejected',          classes: 'bg-red-50 text-red-700 ring-red-200' },
  DEPLOYING:        { label: 'Deploying',         classes: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  DEPLOYED:         { label: 'Deployed',          classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  FAILED:           { label: 'Failed',            classes: 'bg-red-50 text-red-700 ring-red-200' },
  QUEUED:           { label: 'Queued',            classes: 'bg-slate-100 text-slate-600 ring-slate-200' },
  RUNNING:          { label: 'Running',           classes: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  SUCCESS:          { label: 'Success',           classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CANCELLED:        { label: 'Cancelled',         classes: 'bg-slate-100 text-slate-500 ring-slate-200' },
  PENDING:          { label: 'Pending',           classes: 'bg-amber-50 text-amber-700 ring-amber-200' },
  SKIPPED:          { label: 'Skipped',           classes: 'bg-slate-100 text-slate-400 ring-slate-200' },
}

export default function StatusBadge({ status }: { status: Status }) {
  const c = config[status] ?? { label: status, classes: 'bg-slate-100 text-slate-600 ring-slate-200' }
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        c.classes,
      )}
    >
      {status === 'DEPLOYING' || status === 'RUNNING' ? (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      ) : null}
      {c.label}
    </span>
  )
}
