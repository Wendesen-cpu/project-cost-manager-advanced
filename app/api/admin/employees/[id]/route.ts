import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { Role } from '@lib/generated/prisma/enums'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const employee = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, lastName: true, email: true, role: true, monthlyCost: true, remainingVacationDays: true },
        })
        if (!employee) return NextResponse.json({ error: 'User not found' }, { status: 404 })
        return NextResponse.json(employee)
    } catch {
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const { name, lastName, email, monthlyCost, remainingVacationDays, role } = await req.json()
        const requesterRole = req.cookies.get('mock-role')?.value

        const targetUser = await prisma.user.findUnique({ where: { id } })
        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // RBAC Check
        if (requesterRole === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SYSTEM_ADMIN')) {
            return NextResponse.json({ error: 'Access denied: Admins cannot modify other admins or super admins' }, { status: 403 })
        }
        if (requesterRole === 'ADMIN' && role === 'ADMIN') {
            return NextResponse.json({ error: 'Admins cannot promote users to Admin' }, { status: 403 })
        }
        if (requesterRole !== 'SYSTEM_ADMIN' && requesterRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const updated = await prisma.user.update({
            where: { id },
            data: {
                name,
                lastName,
                email,
                monthlyCost: monthlyCost ? parseFloat(monthlyCost) : null,
                remainingVacationDays: remainingVacationDays ? parseInt(remainingVacationDays, 10) : 0,
                role: (requesterRole === 'SYSTEM_ADMIN') ? role : targetUser.role
            },
        })
        return NextResponse.json(updated)
    } catch (error) {
        console.error('[Update User Error]:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const requesterRole = req.cookies.get('mock-role')?.value
        const targetUser = await prisma.user.findUnique({ where: { id } })

        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        // RBAC Check
        if (requesterRole === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SYSTEM_ADMIN')) {
            return NextResponse.json({ error: 'Access denied: Admins cannot delete other admins or super admins' }, { status: 403 })
        }
        if (requesterRole !== 'SYSTEM_ADMIN' && requesterRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        await prisma.user.delete({ where: { id } })
        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[Delete User Error]:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
