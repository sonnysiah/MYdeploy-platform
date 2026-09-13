import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const token = request.cookies.get('mydeploy_token')?.value

  // Verify token
  let valid = false
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '')
      await jwtVerify(token, secret)
      valid = true
    } catch {
      valid = false
    }
  }

  // Redirect logged-in users away from login
  if (isPublic && valid) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Protect non-public routes
  if (!isPublic && !valid) {
    // API routes return 401 instead of redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
