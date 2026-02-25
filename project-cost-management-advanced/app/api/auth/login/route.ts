import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user || user.password !== password) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        // Return user data (role) for client-side routing
        // In a real app, this would set a session/JWT
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
