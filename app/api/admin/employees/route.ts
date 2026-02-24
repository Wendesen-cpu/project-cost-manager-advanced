import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { Role } from '@lib/generated/prisma/enums'

export async function GET() {
    try {
        const employees = await prisma.user.findMany({
            where: { role: Role.EMPLOYEE },
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
    } catch {
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
    }
}
