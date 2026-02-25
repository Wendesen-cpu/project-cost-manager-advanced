import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

// POST /api/admin/projects/[id]/members  { userId, dailyHours, startDate, endDate }
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: projectId } = await params
    try {
        const body = await req.json()
        const { userId, dailyHours, startDate, endDate } = body
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

        const hours = typeof dailyHours === 'number' && dailyHours > 0 ? dailyHours : 8

        // Create the assignment (without dates — Prisma client caching issue)
        const assignment = await prisma.projectAssignment.create({
            data: { userId, projectId, dailyHours: hours },
            include: {
                user: { select: { id: true, name: true, lastName: true, role: true, monthlyCost: true } },
            },
        })

        // Set dates via raw SQL if provided
        if (startDate || endDate) {
            const sd = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null
            const ed = endDate ? new Date(`${endDate}T00:00:00.000Z`) : null
            await prisma.$executeRawUnsafe(
                `UPDATE "ProjectAssignment" SET "startDate" = $1, "endDate" = $2 WHERE "id" = $3`,
                sd,
                ed,
                assignment.id,
            )
        }

        // Re-fetch to return the full data including dates
        const updated = await prisma.projectAssignment.findUnique({
            where: { id: assignment.id },
            include: {
                user: { select: { id: true, name: true, lastName: true, role: true, monthlyCost: true } },
            },
        })

        return NextResponse.json(updated, { status: 201 })
    } catch (e: any) {
        console.error('[POST /members] Error:', e)
        if (e?.code === 'P2002') {
            return NextResponse.json({ error: 'User already assigned' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to add member', details: e?.message }, { status: 500 })
    }
}

// DELETE /api/admin/projects/[id]/members?userId=…
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: projectId } = await params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    try {
        await prisma.projectAssignment.deleteMany({ where: { projectId, userId } })
        return new NextResponse(null, { status: 204 })
    } catch {
        return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }
}
