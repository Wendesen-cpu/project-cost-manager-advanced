import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { Role } from '@lib/generated/prisma/enums'

export async function GET() {
    try {
        const employees = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                role: true,
                monthlyCost: true,
                remainingVacationDays: true,
            },
        })
        return NextResponse.json(employees)
    } catch {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { name, lastName, email, password, monthlyCost, remainingVacationDays, role } = await req.json()

        // RBAC Check
        const requesterRole = req.cookies.get('mock-role')?.value

        if (requesterRole === 'ADMIN' && role === 'ADMIN') {
            return NextResponse.json({ error: 'Admins cannot create other Admins' }, { status: 403 })
        }

        if (requesterRole !== 'SYSTEM_ADMIN' && requesterRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const newEmployee = await prisma.user.create({
            data: {
                name,
                lastName,
                email,
                password,
                role: role || Role.EMPLOYEE,
                monthlyCost: monthlyCost ? parseFloat(monthlyCost) : null,
                remainingVacationDays: remainingVacationDays ? parseInt(remainingVacationDays, 10) : 0
            },
        })
        return NextResponse.json(newEmployee, { status: 201 })
    } catch (error) {
        console.error('[Create Employee Error]:', error)
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
    }
}
