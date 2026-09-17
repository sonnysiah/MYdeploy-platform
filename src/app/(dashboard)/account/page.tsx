'use client'

import { useState } from 'react'

export default function AccountPage() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle')
  const [msg, setMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setStatus('err'); setMsg('New passwords do not match'); return }
    if (next.length < 8) { setStatus('err'); setMsg('New password must be at least 8 characters'); return }

    setStatus('saving')
    const res = await fetch('/api/users/me/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('ok')
      setMsg('Password changed successfully.')
      setCurrent(''); setNext(''); setConfirm('')
    } else {
      setStatus('err')
      setMsg(data.error ?? 'Something went wrong')
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Change Password</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {msg && (
          <p className={`text-sm ${status === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>{msg}</p>
        )}

        <button
          type="submit"
          disabled={status === 'saving'}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {status === 'saving' ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  )
}
