import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Find the log to get its details (for vacation day refund)
        const log = await prisma.timeLog.findUnique({
            where: { id },
            include: { user: true }
        })

        if (!log) {
            return NextResponse.json({ error: 'Time log not found' }, { status: 404 })
        }

        // If it's a vacation, refund the vacation days
        if (log.type === 'VACATION' && log.user) {
            const daysToRefund = log.hours / 8
            await prisma.user.update({
                where: { id: log.userId },
                data: { remainingVacationDays: { increment: daysToRefund } }
            })
        }

        // Delete the time log
        await prisma.timeLog.delete({
            where: { id }
        })

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: 'Failed to delete time log' }, { status: 500 })
    }
}
