import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            include: {
                assignments: {
                    include: { user: { select: { id: true, name: true, lastName: true } } },
                },
            },
        })
        return NextResponse.json(projects)
    } catch {
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const {
            name, description, startDate, endDate,
            paymentType, totalProjectPrice, fixedCostType,
            totalFixedCost, status, ownerId,
        } = await req.json()

        const newProject = await prisma.project.create({
            data: {
                name,
                description,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                paymentType,
                totalProjectPrice,
                fixedCostType,
                totalFixedCost,
                status,
                ownerId,
            },
        })
        return NextResponse.json(newProject, { status: 201 })
    } catch {
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }
}
