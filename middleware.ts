import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // NOTE: In a real application, you would extract the user's role and authentication status 
    // from a session, JWT, or NextAuth token here. 
    // For this initial setup, we are mocking the role using cookies for demonstration purposes.
    // You can set the 'mock-role' cookie to 'ADMIN' or 'EMPLOYEE' to test the protection.

    const mockRole = request.cookies.get('mock-role')?.value
    const isAuthenticated = !!mockRole

    // Protect /admin routes
    if (pathname.startsWith('/admin')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (mockRole !== 'ADMIN') {
            // Redirect to the appropriate portal or show an unauthorized page
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Protect /portal routes
    if (pathname.startsWith('/portal')) {
        if (!isAuthenticated) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
        if (mockRole !== 'EMPLOYEE' && mockRole !== 'ADMIN') { // Assuming admins might also access the portal, adjust if not intended
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/admin/:path*',
        '/portal/:path*'
    ],
}
