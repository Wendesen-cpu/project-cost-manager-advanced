import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

/**
 * GET /api/employee/projects?userId=...
 * Fetches the projects assigned to a specific employee user.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    try {
        const assignments = await prisma.projectAssignment.findMany({
            where: { userId },
            include: { project: true }
        })

        const projects = assignments.map(a => a.project)
        return NextResponse.json(projects)
    } catch (err) {
        console.error('Failed to fetch employee projects:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
