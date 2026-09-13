import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(
    notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
  )
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { markAll, id } = await req.json()

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: session.sub, read: false },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: session.sub },
      data: { read: true },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Provide markAll or id' }, { status: 400 })
}
