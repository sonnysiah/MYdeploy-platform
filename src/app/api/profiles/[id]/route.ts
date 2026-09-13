import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const profile = await prisma.deploymentProfile.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      approvalRequest: { include: { assignedTo: { select: { name: true } } } },
      deploymentJobs: { include: { steps: { orderBy: { order: 'asc' } } }, orderBy: { startedAt: 'desc' } },
    },
  })

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(profile)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action } = await req.json()

  const profile = await prisma.deploymentProfile.findUnique({ where: { id } })
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Submit draft for approval
  if (action === 'submit' && profile.status === 'DRAFT') {
    const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } })

    await prisma.$transaction(async (tx) => {
      await tx.deploymentProfile.update({ where: { id }, data: { status: 'PENDING_APPROVAL' } })

      if (manager) {
        await tx.approvalRequest.upsert({
          where: { profileId: id },
          create: { profileId: id, assignedToId: manager.id },
          update: { status: 'PENDING', decidedAt: null, notes: null },
        })

        await tx.notification.create({
          data: {
            userId: manager.id,
            type: 'APPROVAL_REQUESTED',
            title: 'New deployment request',
            message: `${profile.customerName} — ${profile.appName} deployment requires your approval`,
            profileId: id,
          },
        })
      }
    })

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
