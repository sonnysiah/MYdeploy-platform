import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const apps = await prisma.app.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: [{ status: 'asc' }, { displayName: 'asc' }],
    include: { _count: { select: { profiles: true } } },
  })

  return NextResponse.json(apps)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, displayName, description, githubOrg, githubRepo, dockerImage, defaultRegion, status } = body

  if (!name || !displayName || !githubOrg || !githubRepo) {
    return NextResponse.json({ error: 'name, displayName, githubOrg and githubRepo are required' }, { status: 400 })
  }

  if (!/^[a-z0-9-]{1,40}$/.test(name)) {
    return NextResponse.json({ error: 'name must be lowercase alphanumeric with hyphens, max 40 chars' }, { status: 400 })
  }

  const existing = await prisma.app.findUnique({ where: { name } })
  if (existing) return NextResponse.json({ error: 'An app with this name already exists' }, { status: 409 })

  const app = await prisma.app.create({
    data: { name, displayName, description, githubOrg, githubRepo, dockerImage, defaultRegion: defaultRegion ?? 'southeastasia', status: status ?? 'DRAFT' },
  })

  return NextResponse.json(app, { status: 201 })
}
