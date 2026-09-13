import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import StatusBadge from '@/components/StatusBadge'

export const metadata = { title: 'Deployment Profiles' }

export default async function ProfilesPage() {
  const profiles = await prisma.deploymentProfile.findMany({
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Deployment Profiles</h2>
          <p className="text-sm text-slate-500 mt-0.5">{profiles.length} total profile{profiles.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/profiles/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Profile
        </Link>
      </div>

      {profiles.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">No deployment profiles yet</p>
          <p className="text-xs text-slate-400 mt-1">Create a profile to start deploying a solution</p>
          <Link href="/profiles/new" className="inline-flex mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Create first profile
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tenant Code</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">App</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Region</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profiles.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-800">{p.customerName}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px]">{p.adminEmail}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">{p.tenantCode}</code>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{p.appName}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">{p.region}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/profiles/${p.id}`} className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
