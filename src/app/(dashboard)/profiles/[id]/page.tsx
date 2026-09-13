import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StatusBadge from '@/components/StatusBadge'
import { DEPLOYMENT_STEPS } from '@/types'

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession()
  if (!session) redirect('/login')

  const profile = await prisma.deploymentProfile.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      approvalRequest: { include: { assignedTo: { select: { name: true } } } },
      deploymentJobs: { include: { steps: { orderBy: { order: 'asc' } } }, orderBy: { startedAt: 'desc' } },
    },
  })

  if (!profile) notFound()

  const latestJob = profile.deploymentJobs[0]

  const infoRows = [
    { label: 'Customer Name', value: profile.customerName },
    { label: 'Tenant Code', value: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{profile.tenantCode}</code> },
    { label: 'Legal Name', value: profile.tenantName },
    { label: 'Application', value: profile.appName },
    { label: 'Domain', value: profile.appDomain },
    { label: 'Azure Region', value: profile.region },
    { label: 'Admin Email', value: profile.adminEmail },
    { label: 'GitHub Repo', value: `${profile.githubOrg}/${profile.githubRepo}` },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/profiles" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-slate-800">{profile.customerName}</h2>
              <StatusBadge status={profile.status} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Created by {profile.createdBy.name} · {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {profile.status === 'DEPLOYED' && (
          <a
            href={`https://${profile.appDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Open Live Site ↗
          </a>
        )}
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-700">Profile Details</p>
        </div>
        <dl className="divide-y divide-slate-50">
          {infoRows.map(({ label, value }) => (
            <div key={label} className="flex px-5 py-3 text-sm">
              <dt className="w-36 flex-shrink-0 text-slate-500">{label}</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
          {profile.notes && (
            <div className="flex px-5 py-3 text-sm">
              <dt className="w-36 flex-shrink-0 text-slate-500">Notes</dt>
              <dd className="text-slate-600 whitespace-pre-wrap">{profile.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Approval status */}
      {profile.approvalRequest && (
        <div className={`rounded-xl border overflow-hidden ${
          profile.approvalRequest.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200' :
          profile.approvalRequest.status === 'REJECTED' ? 'bg-red-50 border-red-200' :
          'bg-amber-50 border-amber-200'
        }`}>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Approval</p>
              <StatusBadge status={profile.approvalRequest.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assigned to {profile.approvalRequest.assignedTo.name}
              {profile.approvalRequest.decidedAt && (
                <> · Decided {new Date(profile.approvalRequest.decidedAt).toLocaleString()}</>
              )}
            </p>
            {profile.approvalRequest.notes && (
              <p className="mt-2 text-sm text-slate-700 bg-white/60 rounded-lg px-3 py-2">
                "{profile.approvalRequest.notes}"
              </p>
            )}
            {profile.approvalRequest.status === 'PENDING' && (
              <Link
                href="/approvals"
                className="mt-3 inline-flex text-xs font-medium text-amber-700 hover:text-amber-900"
              >
                Go to Approvals →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Deployment status */}
      {latestJob && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">Deployment Job</p>
              <p className="text-xs text-slate-400 mt-0.5">Started {new Date(latestJob.startedAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={latestJob.status} />
              {latestJob.logsUrl && (
                <a href={latestJob.logsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  View logs ↗
                </a>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="p-5">
            {latestJob.steps.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Steps will appear once deployment starts</p>
            ) : (
              <ol className="space-y-2">
                {latestJob.steps.map((step) => (
                  <li key={step.id} className="flex items-center gap-3 text-sm">
                    <span className={`w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold
                      ${step.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                        step.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                        step.status === 'RUNNING' ? 'bg-indigo-100 text-indigo-600 animate-pulse' :
                        step.status === 'SKIPPED' ? 'bg-slate-100 text-slate-400' :
                        'bg-slate-100 text-slate-400'}
                    `}>
                      {step.status === 'SUCCESS' ? '✓' : step.status === 'FAILED' ? '✗' : step.order + 1}
                    </span>
                    <span className={`flex-1 ${step.status === 'PENDING' ? 'text-slate-400' : 'text-slate-700'}`}>
                      {step.name}
                    </span>
                    <StatusBadge status={step.status} />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
