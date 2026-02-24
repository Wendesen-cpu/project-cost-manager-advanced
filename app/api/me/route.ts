import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { Role } from '@lib/generated/prisma/enums'

/**
 * GET /api/me
 * MOCK ENDPOINT: Since we are using a simple cookie-based mock auth,
 * this endpoint returns the first EMPLOYEE user in the database to act
 * as the "currently logged in" user for frontend queries.
 */
export async function GET(req: NextRequest) {
    try {
        const user = await prisma.user.findFirst({
            where: { role: Role.EMPLOYEE },
            select: { id: true, name: true, lastName: true, email: true, remainingVacationDays: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'No employee users found.' }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (err) {
        console.error('Failed to fetch mock user:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
