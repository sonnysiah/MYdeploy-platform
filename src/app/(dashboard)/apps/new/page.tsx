'use client'

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AZ_REGIONS } from '@/types'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

export default function NewAppPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    displayName: '',
    description: '',
    githubOrg: '',
    githubRepo: '',
    dockerImage: '',
    defaultRegion: 'southeastasia',
    status: 'DRAFT',
  })

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'displayName' && !prev.name) {
        next.name = slugify(value)
      }
      return next
    })
  }

  function field(name: keyof typeof form) {
    return {
      value: form[name],
      onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        set(name, e.target.value),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to register app'); return }
      router.push(`/apps/${data.id}`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1.5'

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/apps" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Register Application</h2>
          <p className="text-sm text-slate-500">Add an app to the registry for deployment</p>
        </div>
      </div>

      <form id="app-form" onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {/* Identity */}
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">App Identity</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Display Name *</label>
              <input type="text" required placeholder="AiD Document Management" className={inputClass} {...field('displayName')} />
            </div>
            <div>
              <label className={labelClass}>App ID (slug) *</label>
              <input
                type="text"
                required
                placeholder="aid-dms"
                pattern="[a-z0-9-]{1,40}"
                className={inputClass + ' font-mono'}
                {...field('name')}
              />
              <p className="text-xs text-slate-400 mt-1">Lowercase, hyphens only, max 40 chars. Auto-filled.</p>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select className={inputClass} {...field('status')}>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea rows={2} placeholder="What this application does…" className={inputClass + ' resize-none'} {...field('description')} />
            </div>
          </div>
        </section>

        {/* Source */}
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Source Repository</h3>
          <p className="text-xs text-slate-500">Default GitHub org/repo auto-filled into new deployment profiles for this app.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>GitHub Organisation *</label>
              <input type="text" required placeholder="your-org" className={inputClass} {...field('githubOrg')} />
            </div>
            <div>
              <label className={labelClass}>Repository Name *</label>
              <input type="text" required placeholder="aid-dms" className={inputClass} {...field('githubRepo')} />
            </div>
          </div>
        </section>

        {/* Deployment defaults */}
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Deployment Defaults</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Default Azure Region</label>
              <select className={inputClass} {...field('defaultRegion')}>
                {AZ_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Docker Image</label>
              <input type="text" placeholder="myacr.azurecr.io/aid-dms" className={inputClass + ' font-mono text-xs'} {...field('dockerImage')} />
              <p className="text-xs text-slate-400 mt-1">Optional. Used as reference — image tag set per deployment.</p>
            </div>
          </div>
        </section>
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link href="/apps" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">
          Cancel
        </Link>
        <button
          type="submit"
          form="app-form"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Registering…' : 'Register App'}
        </button>
      </div>
    </div>
  )
}
