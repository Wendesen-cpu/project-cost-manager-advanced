import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { Role } from '@lib/generated/prisma/enums'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const employee = await prisma.user.findUnique({
            where: { id, role: Role.EMPLOYEE },
            select: { id: true, name: true, lastName: true, email: true, role: true, monthlyCost: true, remainingVacationDays: true },
        })
        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
        return NextResponse.json(employee)
    } catch {
        return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const { name, lastName, email, monthlyCost, remainingVacationDays } = await req.json()
        const updated = await prisma.user.update({
            where: { id },
            data: { name, lastName, email, monthlyCost, remainingVacationDays },
        })
        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        await prisma.user.delete({ where: { id } })
        return new NextResponse(null, { status: 204 })
    } catch {
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
    }
}
