import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import StatusBadge from '@/components/StatusBadge'

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const [total, pending, deploying, deployed, notifications, recentJobs] = await Promise.all([
    prisma.deploymentProfile.count(),
    prisma.deploymentProfile.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.deploymentProfile.count({ where: { status: 'DEPLOYING' } }),
    prisma.deploymentProfile.count({ where: { status: 'DEPLOYED' } }),
    prisma.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.deploymentJob.findMany({
      include: { profile: true },
      orderBy: { startedAt: 'desc' },
      take: 5,
    }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Profiles" value={total} color="text-slate-800" />
        <StatCard label="Pending Approval" value={pending} color="text-amber-600" />
        <StatCard label="Deploying" value={deploying} color="text-indigo-600" />
        <StatCard label="Live" value={deployed} color="text-emerald-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent notifications */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Recent Alerts</p>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="text-xs bg-red-100 text-red-600 font-medium px-2 py-0.5 rounded-full">
                {notifications.filter((n) => !n.read).length} unread
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No notifications yet</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {notifications.map((n) => (
                <li key={n.id} className={`flex gap-3 px-5 py-3 text-sm ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{n.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{n.message}</p>
                  </div>
                  {!n.read && <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500" />}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent deployments */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Recent Deployments</p>
            <Link href="/profiles" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              View all →
            </Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">No deployments yet</div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentJobs.map((job) => (
                <li key={job.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/profiles/${job.profileId}`} className="text-sm font-medium text-slate-800 hover:text-indigo-600 truncate block">
                      {job.profile.customerName}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(job.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {pending} deployment profile{pending > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Review and approve to start deployment</p>
          </div>
          <Link
            href="/approvals"
            className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Review now
          </Link>
        </div>
      )}
    </div>
  )
}
