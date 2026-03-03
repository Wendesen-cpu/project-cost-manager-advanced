import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { createSession } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
    try {
        const { email, password, type } = await req.json()

        const user = await prisma.user.findUnique({
            where: { email }
        })

        // For type='ADMIN', accept both ADMIN and SYSTEM_ADMIN roles
        const roleAllowed = type === 'ADMIN'
            ? (user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN')
            : user?.role === type;

        if (!user || user.password !== password || !roleAllowed) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        await createSession({
            userId: user.id,
            role: user.role,
            name: user.name,
            lastName: user.lastName
        });

        return NextResponse.json({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            lastName: user.lastName
        })
    } catch (error) {
        console.error('[Login API Error]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
