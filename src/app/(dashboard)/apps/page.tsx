import Link from 'next/link'
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const statusStyle: Record<string, string> = {
  ACTIVE:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  DRAFT:      'bg-amber-50  text-amber-700  ring-1 ring-amber-200',
  DEPRECATED: 'bg-slate-100 text-slate-500  ring-1 ring-slate-200',
}

export default async function AppRegistryPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const apps = await prisma.app.findMany({
    orderBy: [{ status: 'asc' }, { displayName: 'asc' }],
    include: { _count: { select: { profiles: true } } },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">App Registry</h2>
          <p className="text-sm text-slate-500 mt-0.5">Pre-configured applications available for deployment</p>
        </div>
        <Link
          href="/apps/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Register App
        </Link>
      </div>

      {apps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No apps registered yet</p>
          <p className="text-xs text-slate-400 mb-4">Register your first app to make it available for deployment profiles.</p>
          <Link href="/apps/new" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
            Register first app
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <Link
              key={app.id}
              href={`/apps/${app.id}`}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[app.status]}`}>
                  {app.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">{app.displayName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{app.name}</p>
                {app.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{app.description}</p>
                )}
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{app.githubOrg}/{app.githubRepo}</span>
                <span>{app._count.profiles} profile{app._count.profiles !== 1 ? 's' : ''}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
