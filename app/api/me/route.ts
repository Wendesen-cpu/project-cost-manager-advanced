import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

/**
 * GET /api/me
 * Returns the currently signed-in user by reading the `user-id` cookie
 * that is set on successful login.
 */
export async function GET(req: NextRequest) {
    try {
        const userId = req.cookies.get('user-id')?.value

        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, lastName: true, email: true, role: true, remainingVacationDays: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (err) {
        console.error('Failed to fetch current user:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
