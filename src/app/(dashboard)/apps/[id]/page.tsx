'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { AZ_REGIONS } from '@/types'

const statusStyle: Record<string, string> = {
  ACTIVE:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  DRAFT:      'bg-amber-50  text-amber-700  ring-1 ring-amber-200',
  DEPRECATED: 'bg-slate-100 text-slate-500  ring-1 ring-slate-200',
}

type App = {
  id: string
  name: string
  displayName: string
  description: string | null
  githubOrg: string
  githubRepo: string
  dockerImage: string | null
  defaultRegion: string
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED'
  _count: { profiles: number }
  createdAt: string
  updatedAt: string
}

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [app, setApp] = useState<App | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<Partial<App>>({})

  useEffect(() => {
    fetch(`/api/apps/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data)
        setForm({
          displayName: data.displayName,
          description: data.description ?? '',
          githubOrg: data.githubOrg,
          githubRepo: data.githubRepo,
          dockerImage: data.dockerImage ?? '',
          defaultRegion: data.defaultRegion,
          status: data.status,
        })
      })
  }, [id])

  function fieldProps(name: keyof typeof form) {
    return {
      value: (form[name] as string) ?? '',
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [name]: e.target.value })),
    }
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setApp(data)
      setEditing(false)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${app?.displayName}"? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/apps/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setDeleting(false); return }
    router.push('/apps')
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1.5'

  if (!app) {
    return <div className="text-sm text-slate-400 text-center py-20">Loading…</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/apps" className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-semibold text-slate-800">{app.displayName}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[app.status]}`}>{app.status}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{app.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <>
              <button onClick={handleDelete} disabled={deleting} className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setEditing(true)} className="px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Deployment Profiles</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1">{app._count.profiles}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Last Updated</p>
          <p className="text-sm font-medium text-slate-800 mt-1">{new Date(app.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">App Identity</h3>
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Display Name</label>
                <input type="text" className={inputClass} {...fieldProps('displayName')} />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} {...fieldProps('status')}>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DEPRECATED">Deprecated</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea rows={2} className={inputClass + ' resize-none'} {...fieldProps('description')} />
              </div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              {app.description && (
                <div className="flex gap-4">
                  <dt className="w-28 flex-shrink-0 text-slate-500">Description</dt>
                  <dd className="text-slate-700">{app.description}</dd>
                </div>
              )}
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-slate-500">Registered</dt>
                <dd className="text-slate-700">{new Date(app.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Source Repository</h3>
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>GitHub Organisation</label>
                <input type="text" className={inputClass} {...fieldProps('githubOrg')} />
              </div>
              <div>
                <label className={labelClass}>Repository Name</label>
                <input type="text" className={inputClass} {...fieldProps('githubRepo')} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-700 font-mono">{app.githubOrg}/{app.githubRepo}</p>
          )}
        </section>

        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Deployment Defaults</h3>
          {editing ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Default Azure Region</label>
                <select className={inputClass} {...fieldProps('defaultRegion')}>
                  {AZ_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Docker Image</label>
                <input type="text" className={inputClass + ' font-mono text-xs'} placeholder="myacr.azurecr.io/aid-dms" {...fieldProps('dockerImage')} />
              </div>
            </div>
          ) : (
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4">
                <dt className="w-28 flex-shrink-0 text-slate-500">Default Region</dt>
                <dd className="text-slate-700">{app.defaultRegion}</dd>
              </div>
              {app.dockerImage && (
                <div className="flex gap-4">
                  <dt className="w-28 flex-shrink-0 text-slate-500">Docker Image</dt>
                  <dd className="text-slate-700 font-mono text-xs">{app.dockerImage}</dd>
                </div>
              )}
            </dl>
          )}
        </section>
      </div>

      {app._count.profiles > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          This app has {app._count.profiles} deployment profile{app._count.profiles !== 1 ? 's' : ''} and cannot be deleted.
        </div>
      )}
    </div>
  )
}
