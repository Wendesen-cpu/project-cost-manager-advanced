'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

interface PortalCardProps {
    title: string
    description: string
    href: string
}

export default function PortalCard({ title, description, href }: PortalCardProps) {
    return (
        <Link
            href={href}
            className="flex-1 min-w-[300px] p-8 bg-white border border-[#E2E8F0] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col items-center text-center"
        >
            <h3 className="text-xl font-bold text-[#0F172B] mb-2 group-hover:text-[#4F39F6] transition-colors">
                {title}
            </h3>
            <p className="text-sm text-[#64748B] leading-relaxed max-w-[200px]">
                {description}
            </p>
        </Link>
    )
}
