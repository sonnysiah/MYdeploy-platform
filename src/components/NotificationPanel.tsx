'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import type { NotificationItem } from '@/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const typeIcon: Record<string, string> = {
  APPROVAL_REQUESTED: '🔔',
  APPROVAL_APPROVED:  '✅',
  APPROVAL_REJECTED:  '❌',
  DEPLOYMENT_STARTED: '🚀',
  DEPLOYMENT_SUCCESS: '✅',
  DEPLOYMENT_FAILED:  '🔴',
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data: NotificationItem[] = await res.json()
      setItems(data)
      setUnread(data.filter((n) => !n.read).length)
    } catch {}
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ markAll: true }), headers: { 'Content-Type': 'application/json' } })
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg ring-1 ring-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {items.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">No notifications yet</div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={clsx(
                    'flex gap-3 px-4 py-3 text-sm',
                    !n.read && 'bg-indigo-50/50',
                  )}
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('font-medium text-slate-800 truncate', !n.read && 'text-slate-900')}>
                      {n.title}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-slate-400 text-xs mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {n.profileId && (
                    <Link
                      href={`/profiles/${n.profileId}`}
                      onClick={() => setOpen(false)}
                      className="flex-shrink-0 self-start mt-0.5 text-indigo-600 hover:text-indigo-800"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
