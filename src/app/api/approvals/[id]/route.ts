import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { dispatchDeployment } from '@/lib/github'
import { DEPLOYMENT_STEPS } from '@/types'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { action, notes } = await req.json()

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  if (action === 'reject' && !notes?.trim()) {
    return NextResponse.json({ error: 'Notes are required when rejecting' }, { status: 400 })
  }

  const approval = await prisma.approvalRequest.findUnique({
    where: { id },
    include: { profile: true },
  })

  if (!approval) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (approval.status !== 'PENDING') {
    return NextResponse.json({ error: 'This approval has already been decided' }, { status: 409 })
  }

  const now = new Date()

  if (action === 'reject') {
    await prisma.$transaction([
      prisma.approvalRequest.update({
        where: { id },
        data: { status: 'REJECTED', notes: notes.trim(), decidedAt: now },
      }),
      prisma.deploymentProfile.update({
        where: { id: approval.profileId },
        data: { status: 'REJECTED' },
      }),
      prisma.notification.create({
        data: {
          userId: approval.profile.createdById,
          type: 'APPROVAL_REJECTED',
          title: 'Deployment request rejected',
          message: `${approval.profile.customerName} — ${notes.trim()}`,
          profileId: approval.profileId,
        },
      }),
    ])

    return NextResponse.json({ ok: true })
  }

  // Approve — create deployment job + steps, trigger GitHub Actions
  const result = await prisma.$transaction(async (tx) => {
    await tx.approvalRequest.update({
      where: { id },
      data: { status: 'APPROVED', notes: notes?.trim() || null, decidedAt: now },
    })

    await tx.deploymentProfile.update({
      where: { id: approval.profileId },
      data: { status: 'DEPLOYING' },
    })

    const job = await tx.deploymentJob.create({
      data: {
        profileId: approval.profileId,
        status: 'QUEUED',
        steps: {
          create: DEPLOYMENT_STEPS.map((name, i) => ({
            name,
            order: i,
            status: 'PENDING',
          })),
        },
      },
    })

    await tx.notification.create({
      data: {
        userId: approval.profile.createdById,
        type: 'DEPLOYMENT_STARTED',
        title: 'Deployment approved and started',
        message: `${approval.profile.customerName} — ${approval.profile.appName} deployment has been triggered`,
        profileId: approval.profileId,
      },
    })

    return job
  })

  // Trigger GitHub Actions (outside transaction — non-fatal if it fails)
  const dispatch = await dispatchDeployment(approval.profile)

  await prisma.deploymentJob.update({
    where: { id: result.id },
    data: {
      status: dispatch.success ? 'RUNNING' : 'QUEUED',
      githubRunId: dispatch.runId,
      logsUrl: dispatch.runId
        ? `https://github.com/${approval.profile.githubOrg}/${approval.profile.githubRepo}/actions/runs/${dispatch.runId}`
        : null,
    },
  })

  if (dispatch.success) {
    await prisma.deploymentStep.updateMany({
      where: { jobId: result.id, order: 0 },
      data: { status: 'RUNNING', startedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true, jobId: result.id, dispatch })
}
