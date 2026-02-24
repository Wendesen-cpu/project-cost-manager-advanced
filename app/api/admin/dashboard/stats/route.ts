import { NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { ProjectStatus } from '@lib/generated/prisma/enums'

export async function GET() {
    try {
        const [activeProjectCount, totalEmployeeCount, employees] = await Promise.all([
            prisma.project.count({
                where: { status: ProjectStatus.ACTIVE },
            }),
            prisma.user.count({
                where: { role: 'EMPLOYEE' },
            }),
            prisma.user.findMany({
                where: { role: 'EMPLOYEE', monthlyCost: { not: null } },
                select: { monthlyCost: true },
            }),
        ])

        const estimatedMonthlyRevenue = employees.reduce(
            (sum, e) => sum + (e.monthlyCost ?? 0),
            0
        )

        return NextResponse.json({
            activeProjectCount,
            totalEmployeeCount,
            estimatedMonthlyRevenue,
        })
    } catch {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
