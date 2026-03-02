import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { createSession, getSession } from '@/app/lib/auth'

export async function POST(req: NextRequest) {

    try {
        const { email, password, type } = await req.json()

        const user = await prisma.user.findUnique({
            where: { email }
        })

        console.log(user, type, password)

        if (!user || user.password !== password || user.role !== type) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        //create session
        await createSession({
            userId: user.id,
            role: user.role,
            name: user.name,
            lastName: user.lastName
        });

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
