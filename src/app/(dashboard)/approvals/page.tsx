'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'

type Approval = {
  id: string
  status: string
  createdAt: string
  profile: {
    id: string
    customerName: string
    tenantCode: string
    appName: string
    appDomain: string
    region: string
    adminEmail: string
    githubOrg: string
    githubRepo: string
    notes: string | null
    createdBy: { name: string }
  }
  assignedTo: { name: string }
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [acting, setActing] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, { ok: boolean; msg: string }>>({})

  useEffect(() => {
    fetch('/api/approvals')
      .then((r) => r.json())
      .then(setApprovals)
      .finally(() => setLoading(false))
  }, [])

  async function decide(approvalId: string, action: 'approve' | 'reject') {
    setActing(approvalId)
    try {
      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notes[approvalId] ?? '' }),
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback((f) => ({ ...f, [approvalId]: { ok: true, msg: action === 'approve' ? 'Approved — deployment started' : 'Rejected' } }))
        setApprovals((prev) => prev.filter((a) => a.id !== approvalId))
      } else {
        setFeedback((f) => ({ ...f, [approvalId]: { ok: false, msg: data.error ?? 'Failed' } }))
      }
    } finally {
      setActing(null)
    }
  }

  const pending = approvals.filter((a) => a.status === 'PENDING')

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Approvals</h2>
        <p className="text-sm text-slate-500 mt-0.5">Review and approve deployment requests</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-sm text-slate-400">Loading…</div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">All clear — no pending approvals</p>
          <p className="text-xs text-slate-400 mt-1">New requests will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((approval) => {
            const p = approval.profile
            return (
              <div key={approval.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Card header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">{p.customerName}</p>
                      <StatusBadge status="PENDING_APPROVAL" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested by {p.createdBy.name} · {new Date(approval.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/profiles/${p.id}`} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    View profile →
                  </Link>
                </div>

                {/* Details grid */}
                <div className="px-5 py-4 grid sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                  {[
                    { label: 'Tenant Code', value: <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">{p.tenantCode}</code> },
                    { label: 'Application', value: p.appName },
                    { label: 'Domain', value: p.appDomain },
                    { label: 'Region', value: p.region },
                    { label: 'Admin Email', value: p.adminEmail },
                    { label: 'GitHub', value: `${p.githubOrg}/${p.githubRepo}` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="text-slate-700">{value}</p>
                    </div>
                  ))}
                  {p.notes && (
                    <div className="sm:col-span-3">
                      <p className="text-xs text-slate-400 mb-0.5">Notes</p>
                      <p className="text-slate-600 text-xs bg-slate-50 rounded-lg px-3 py-2">{p.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action area */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                      Notes <span className="text-slate-400 font-normal">(optional — required for rejection)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add notes for this decision…"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white resize-none"
                      value={notes[approval.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [approval.id]: e.target.value }))}
                    />
                  </div>

                  {feedback[approval.id] && (
                    <p className={`text-sm font-medium ${feedback[approval.id].ok ? 'text-emerald-600' : 'text-red-600'}`}>
                      {feedback[approval.id].msg}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decide(approval.id, 'approve')}
                      disabled={acting === approval.id}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Approve & Deploy
                    </button>
                    <button
                      onClick={() => decide(approval.id, 'reject')}
                      disabled={acting === approval.id}
                      className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 disabled:opacity-60 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
