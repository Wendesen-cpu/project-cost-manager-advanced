import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'
import { TimeLogType, Role } from '@lib/generated/prisma/enums'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 })

    try {
        const logs = await prisma.timeLog.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            include: { project: { select: { name: true } } },
        })
        // Ensure dates are consistently formatted as ISO strings
        const formattedLogs = logs.map(log => ({
            ...log,
            date: new Date(log.date).toISOString()
        }))
        return NextResponse.json(formattedLogs)
    } catch {
        return NextResponse.json({ error: 'Failed to fetch time logs' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const logs = Array.isArray(body) ? body : [body]
        const results = []
        for (const log of logs) {
            const { userId, projectId, date, hours, type } = log
            if (type === TimeLogType.WORK) {
                if (!projectId) {
                    return NextResponse.json({ error: 'projectId is required for WORK logs' }, { status: 400 })
                }
                const assignment = await prisma.projectAssignment.findUnique({
                    where: { userId_projectId: { userId, projectId } },
                })
                if (!assignment) {
                    const user = await prisma.user.findUnique({ where: { id: userId } })
                    if (!user || user.role !== Role.ADMIN) {
                        return NextResponse.json({ error: 'User is not assigned to this project' }, { status: 403 })
                    }
                }
            } else if (type === TimeLogType.VACATION) {
                const daysToDeduct = hours ? parseFloat(hours) / 8 : 1

                const user = await prisma.user.findUnique({ where: { id: userId } })
                if (!user || user.remainingVacationDays === null || user.remainingVacationDays < daysToDeduct) {
                    return NextResponse.json({ error: 'Not enough vacation days remaining' }, { status: 400 })
                }

                await prisma.user.update({
                    where: { id: userId },
                    data: { remainingVacationDays: user.remainingVacationDays - daysToDeduct }
                })
            }

            // Parse date string "YYYY-MM-DD" into date components
            const [year, month, day] = date.split('-').map(Number)
            // Create date at midnight UTC representing the calendar date
            const dbDate = new Date(Date.UTC(year, month - 1, day))

            const newLog = await prisma.timeLog.create({
                data: {
                    userId,
                    projectId: type === TimeLogType.WORK ? projectId : null,
                    date: dbDate,
                    hours: type === TimeLogType.VACATION ? (hours ? parseFloat(hours) : 8) : parseFloat(hours),
                    type,
                },
                include: { project: { select: { name: true } } }
            })
            results.push(newLog)
        }

        return NextResponse.json(results, { status: 201 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Failed to create time log(s)' }, { status: 500 })
    }
}
