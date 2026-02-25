import { NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { ProjectStatus } from '@lib/generated/prisma/enums'

/**
 * Returns how many working days are in a given month (Mon–Fri only).
 */
function workingDaysInMonth(year: number, month: number): number {
    const days = new Date(year, month + 1, 0).getDate()
    let count = 0
    for (let d = 1; d <= days; d++) {
        const dow = new Date(year, month, d).getDay()
        if (dow !== 0 && dow !== 6) count++
    }
    return count
}

/**
 * Returns true if the project overlaps with the given month.
 */
function projectOverlapsMonth(start: Date | null, end: Date | null, year: number, month: number): boolean {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
    const projStart = start ?? new Date(0)
    const projEnd = end ?? new Date(9999, 11, 31)
    return projStart <= monthEnd && projEnd >= monthStart
}

export async function GET() {
    try {
        const [activeProjectCount, totalEmployeeCount, projects] = await Promise.all([
            prisma.project.count({
                where: { status: ProjectStatus.ACTIVE },
            }),
            prisma.user.count({
                where: { role: 'EMPLOYEE' },
            }),
            prisma.project.findMany({
                where: { status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNED] } },
                include: {
                    assignments: true,
                    timeLogs: {
                        where: { type: 'WORK' },
                        select: { date: true, hours: true },
                    },
                },
            }),
        ])

        const now = new Date()
        const year = now.getFullYear()
        const monthIndex = now.getMonth()
        let estimatedMonthlyRevenue = 0

        for (const project of projects) {
            if (!projectOverlapsMonth(project.startDate, project.endDate, year, monthIndex)) continue

            // 1. Compute duration in months for spreading totals
            let durationMonths = 1
            if (project.startDate && project.endDate) {
                const start = new Date(project.startDate)
                const end = new Date(project.endDate)
                durationMonths = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1)
            }

            // --- Revenue ---
            if (project.paymentType === 'FIXED') {
                // Spread totalProjectPrice across the duration
                estimatedMonthlyRevenue += (project.totalProjectPrice ?? 0) / durationMonths
            } else {
                // HOURLY: totalProjectPrice is the hourly rate
                const hourlyRate = project.totalProjectPrice ?? 0
                // Estimate hours for this month
                const logsThisMonth = project.timeLogs.filter(
                    (l) => new Date(l.date).getMonth() === monthIndex && new Date(l.date).getFullYear() === year,
                )
                if (logsThisMonth.length > 0) {
                    estimatedMonthlyRevenue += logsThisMonth.reduce((s, l) => s + l.hours, 0) * hourlyRate
                } else {
                    const wd = workingDaysInMonth(year, monthIndex)
                    const totalDailyHrs = project.assignments.reduce((s, a) => s + (a.dailyHours ?? 8), 0)
                    estimatedMonthlyRevenue += wd * totalDailyHrs * hourlyRate
                }
            }
        }

        return NextResponse.json({
            activeProjectCount,
            totalEmployeeCount,
            estimatedMonthlyRevenue: Math.round(estimatedMonthlyRevenue),
        })
    } catch (err) {
        console.error('[dashboard stats API error]:', err)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
