import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                assignments: {
                    include: { user: { select: { id: true, name: true, lastName: true } } },
                },
            },
        })
        if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        return NextResponse.json(project)
    } catch {
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        const {
            name, description, startDate, endDate,
            paymentType, totalProjectPrice, fixedCostType,
            totalFixedCost, status,
        } = await req.json()

        const updated = await prisma.project.update({
            where: { id },
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
            },
        })
        return NextResponse.json(updated)
    } catch {
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    try {
        await prisma.project.delete({ where: { id } })
        return new NextResponse(null, { status: 204 })
    } catch {
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }
}
