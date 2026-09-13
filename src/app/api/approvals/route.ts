import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const approvals = await prisma.approvalRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      profile: { include: { createdBy: { select: { name: true } } } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(approvals)
}
