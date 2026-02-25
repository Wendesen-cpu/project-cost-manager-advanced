import { NextResponse } from 'next/server'
import prisma from '@lib/prisma'

interface MonthProjection {
    month: string      // e.g. "Feb 2026"
    year: number
    monthIndex: number // 0-based JS month
    revenue: number
    cost: number
    margin: number
}

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
 * Returns the number of full months a project overlaps with a given month.
 * Returns 1 if it overlaps, 0 if not. (simplified: whole month = 1)
 */
function projectOverlapsMonth(
    start: Date | null,
    end: Date | null,
    year: number,
    month: number,
): boolean {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59)
    const projStart = start ?? new Date(0)
    const projEnd = end ?? new Date(9999, 11, 31)
    return projStart <= monthEnd && projEnd >= monthStart
}

export async function GET() {
    try {
        // Fetch all active & planned projects with assignments and employee costs
        const projects = await prisma.project.findMany({
            where: { status: { in: ['ACTIVE', 'PLANNED'] } },
            include: {
                assignments: {
                    include: {
                        user: { select: { id: true, monthlyCost: true } },
                    },
                },
                timeLogs: {
                    where: { type: 'WORK' },
                    select: { date: true, hours: true, userId: true },
                },
            },
        })

        // Build 12 monthly buckets starting from current month
        const now = new Date()
        const startYear = now.getFullYear()
        const startMonth = now.getMonth() // 0-based

        const months: MonthProjection[] = []

        for (let i = 0; i < 12; i++) {
            const totalMonths = startMonth + i
            const year = startYear + Math.floor(totalMonths / 12)
            const monthIndex = totalMonths % 12

            const label = new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
            })

            let revenue = 0
            let cost = 0

            for (const project of projects) {
                const overlaps = projectOverlapsMonth(project.startDate, project.endDate, year, monthIndex)
                if (!overlaps) continue

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
                    revenue += (project.totalProjectPrice ?? 0) / durationMonths
                } else {
                    // HOURLY: totalProjectPrice is the hourly rate
                    const hourlyRate = project.totalProjectPrice ?? 0
                    // Estimate hours for this month
                    const logsThisMonthIndex = project.timeLogs.filter(
                        (l) => new Date(l.date).getMonth() === monthIndex && new Date(l.date).getFullYear() === year,
                    )
                    if (logsThisMonthIndex.length > 0) {
                        revenue += logsThisMonthIndex.reduce((s, l) => s + l.hours, 0) * hourlyRate
                    } else {
                        const wd = workingDaysInMonth(year, monthIndex)
                        const totalDailyHrs = project.assignments.reduce((s, a) => s + (a.dailyHours ?? 8), 0)
                        revenue += wd * totalDailyHrs * hourlyRate
                    }
                }

                // --- Cost: Labor ---
                const wd = workingDaysInMonth(year, monthIndex)
                const MONTHLY_HOURS = 160
                for (const assignment of project.assignments) {
                    const hourlyRate = (assignment.user.monthlyCost ?? 0) / MONTHLY_HOURS
                    const projectDailyHrs = assignment.dailyHours ?? 8
                    cost += wd * projectDailyHrs * hourlyRate
                }

                // --- Cost: Fixed expenses ---
                if (project.totalFixedCost) {
                    if (project.fixedCostType === 'MONTHLY') {
                        cost += project.totalFixedCost
                    } else {
                        // Spread TOTAL over duration
                        cost += project.totalFixedCost / durationMonths
                    }
                }
            }

            months.push({
                month: label,
                year,
                monthIndex,
                revenue: Math.round(revenue),
                cost: Math.round(cost),
                margin: Math.round(revenue - cost),
            })
        }

        return NextResponse.json(months)
    } catch (err) {
        console.error('[projections]', err)
        return NextResponse.json({ error: 'Failed to compute projections' }, { status: 500 })
    }
}
