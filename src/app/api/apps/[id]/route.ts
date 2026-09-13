import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const app = await prisma.app.findUnique({
    where: { id },
    include: { _count: { select: { profiles: true } } },
  })

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(app)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const app = await prisma.app.findUnique({ where: { id } })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { displayName, description, githubOrg, githubRepo, dockerImage, defaultRegion, status } = body

  const updated = await prisma.app.update({
    where: { id },
    data: {
      ...(displayName    !== undefined && { displayName }),
      ...(description    !== undefined && { description }),
      ...(githubOrg      !== undefined && { githubOrg }),
      ...(githubRepo     !== undefined && { githubRepo }),
      ...(dockerImage    !== undefined && { dockerImage }),
      ...(defaultRegion  !== undefined && { defaultRegion }),
      ...(status         !== undefined && { status }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const app = await prisma.app.findUnique({
    where: { id },
    include: { _count: { select: { profiles: true } } },
  })

  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app._count.profiles > 0) {
    return NextResponse.json({ error: `Cannot delete — ${app._count.profiles} deployment profile(s) reference this app` }, { status: 409 })
  }

  await prisma.app.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
