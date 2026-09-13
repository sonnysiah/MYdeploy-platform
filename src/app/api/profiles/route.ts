import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEPLOYMENT_STEPS } from '@/types'

export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profiles = await prisma.deploymentProfile.findMany({
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(profiles)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    customerName, tenantCode, tenantName, appName, appId, appDomain,
    region, adminEmail, githubOrg, githubRepo, notes, action,
  } = body

  // Basic validation
  const required = { customerName, tenantCode, tenantName, appDomain, adminEmail, githubOrg, githubRepo }
  for (const [key, val] of Object.entries(required)) {
    if (!val?.toString().trim()) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 })
    }
  }

  if (!/^[a-z0-9]{1,12}$/.test(tenantCode)) {
    return NextResponse.json({ error: 'Tenant code must be 1-12 lowercase alphanumeric characters' }, { status: 400 })
  }

  const normalizedDomain = appDomain.replace(/^https?:\/\//, '')

  // Check for duplicate tenant code
  const existing = await prisma.deploymentProfile.findUnique({ where: { tenantCode } })
  if (existing) {
    return NextResponse.json({ error: `Tenant code "${tenantCode}" is already in use` }, { status: 409 })
  }

  // Find manager to assign approval to
  const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } })

  const isSubmit = action === 'submit'

  const profile = await prisma.$transaction(async (tx) => {
    const p = await tx.deploymentProfile.create({
      data: {
        customerName: customerName.trim(),
        tenantCode: tenantCode.trim(),
        tenantName: tenantName.trim(),
        appName: appName || 'custom',
        ...(appId && { appId }),
        appDomain: normalizedDomain.trim(),
        region,
        adminEmail: adminEmail.trim().toLowerCase(),
        githubOrg: githubOrg.trim(),
        githubRepo: githubRepo.trim(),
        notes: notes?.trim() || null,
        status: isSubmit ? 'PENDING_APPROVAL' : 'DRAFT',
        createdById: session.sub,
      },
    })

    if (isSubmit && manager) {
      await tx.approvalRequest.create({
        data: { profileId: p.id, assignedToId: manager.id },
      })

      // Notify the manager
      await tx.notification.create({
        data: {
          userId: manager.id,
          type: 'APPROVAL_REQUESTED',
          title: 'New deployment request',
          message: `${customerName} — ${appName} deployment requires your approval`,
          profileId: p.id,
        },
      })
    }

    return p
  })

  return NextResponse.json(profile, { status: 201 })
}
