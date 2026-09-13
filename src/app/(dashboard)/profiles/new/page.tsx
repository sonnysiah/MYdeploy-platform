'use client'

import { useState, ChangeEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AZ_REGIONS } from '@/types'

type RegistryApp = {
  id: string
  name: string
  displayName: string
  githubOrg: string
  githubRepo: string
  defaultRegion: string
  status: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12)
}

export default function NewProfilePage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [registryApps, setRegistryApps] = useState<RegistryApp[]>([])

  useEffect(() => {
    fetch('/api/apps?status=ACTIVE').then(r => r.json()).then(setRegistryApps).catch(() => {})
  }, [])

  const [form, setForm] = useState({
    customerName: '',
    tenantCode: '',
    tenantName: '',
    appName: '',
    appId: '',
    appDomain: '',
    region: 'southeastasia',
    adminEmail: '',
    githubOrg: '',
    githubRepo: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'customerName' && !prev.tenantCode) {
        next.tenantCode = slugify(value)
      }
      // Auto-fill GitHub + region when an app is selected from registry
      if (field === 'appId') {
        const picked = registryApps.find((a) => a.id === value)
        if (picked) {
          next.appName     = picked.name
          next.githubOrg   = picked.githubOrg
          next.githubRepo  = picked.githubRepo
          next.region      = picked.defaultRegion
        }
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

  async function submit(action: 'draft' | 'submit') {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, appId: form.appId || undefined, action }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create profile'); return }
      router.push(`/profiles/${data.id}`)
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white'
  const labelClass = 'block text-xs font-medium text-slate-600 mb-1.5'

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/profiles" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">New Deployment Profile</h2>
          <p className="text-sm text-slate-500">Configure a deployment for a customer</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {/* Customer details */}
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Customer Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Customer Name *</label>
              <input type="text" required placeholder="Acme Sdn Bhd" className={inputClass} {...field('customerName')} />
            </div>
            <div>
              <label className={labelClass}>Tenant Code *</label>
              <input type="text" required placeholder="acme" maxLength={12} pattern="[a-z0-9]+" className={inputClass} {...field('tenantCode')} />
              <p className="text-xs text-slate-400 mt-1">Lowercase alphanumeric, max 12 chars. Auto-filled.</p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Legal Company Name *</label>
              <input type="text" required placeholder="Acme Industries Sdn Bhd" className={inputClass} {...field('tenantName')} />
            </div>
            <div>
              <label className={labelClass}>Admin Email *</label>
              <input type="email" required placeholder="admin@acme.com" className={inputClass} {...field('adminEmail')} />
            </div>
          </div>
        </section>

        {/* Application */}
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Application</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Solution to Deploy *</label>
              {registryApps.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm border border-amber-200 bg-amber-50 rounded-lg text-amber-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No active apps in the registry.{' '}
                  <Link href="/apps/new" className="underline font-medium">Register one first.</Link>
                </div>
              ) : (
                <select className={inputClass} value={form.appId} onChange={(e) => set('appId', e.target.value)} required>
                  <option value="">— Select an app —</option>
                  {registryApps.map((a) => (
                    <option key={a.id} value={a.id}>{a.displayName}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className={labelClass}>Production Domain *</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition">
                <span className="px-3 py-2 bg-slate-50 text-xs text-slate-500 border-r border-slate-200 select-none flex-shrink-0">https://</span>
                <input
                  type="text"
                  required
                  placeholder="aid.acme.com"
                  className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
                  value={form.appDomain.replace(/^https?:\/\//, '')}
                  onChange={(e) => set('appDomain', e.target.value.replace(/^https?:\/\//, ''))}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Azure Region *</label>
              <select className={inputClass} {...field('region')}>
                {AZ_REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* GitHub */}
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">GitHub Repository</h3>
          <p className="text-xs text-slate-500">The repository containing the application to deploy. A GitHub Actions workflow will be dispatched on approval.</p>
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

        {/* Notes */}
        <section className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
          <textarea
            rows={3}
            placeholder="Any special requirements or context for this deployment…"
            className={inputClass + ' resize-none'}
            {...field('notes')}
          />
        </section>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link href="/profiles" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">
          Cancel
        </Link>
        <button
          onClick={() => submit('draft')}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60 transition-colors"
        >
          Save as Draft
        </button>
        <button
          onClick={() => submit('submit')}
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit for Approval'}
        </button>
      </div>
    </div>
  )
}
