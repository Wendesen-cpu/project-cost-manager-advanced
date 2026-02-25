import { NextRequest, NextResponse } from 'next/server'
import prisma from '@lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { userId, projectId } = await req.json()
        const assignment = await prisma.projectAssignment.create({ data: { userId, projectId } })
        return NextResponse.json(assignment, { status: 201 })
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'User is already assigned to this project' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { userId, projectId } = await req.json()
        await prisma.projectAssignment.delete({
            where: { userId_projectId: { userId, projectId } },
        })
        return new NextResponse(null, { status: 204 })
    } catch {
        return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
    }
}
