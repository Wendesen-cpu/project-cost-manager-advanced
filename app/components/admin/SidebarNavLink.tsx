'use client'

import Link from 'next/link'

interface SidebarNavLinkProps {
    href: string
    label: string
    icon: React.ReactNode
    isActive?: boolean
}

export default function SidebarNavLink({ href, label, icon, isActive = false }: SidebarNavLinkProps) {
    return (
        <Link
            href={href}
            className="relative flex items-center gap-3 w-full px-4 py-[14px] rounded-2xl shrink-0 transition-colors"
            style={
                isActive
                    ? { backgroundColor: '#155DFC' }
                    : undefined
            }
            data-component="SidebarNavLink"
        >
            {/* Active shadow overlay */}
            {isActive && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                        boxShadow:
                            '0px 10px 15px -3px rgba(21, 93, 252, 0.2), 0px 4px 6px -4px rgba(21, 93, 252, 0.2)',
                    }}
                />
            )}

            {/* Icon */}
            <div className={`relative shrink-0 flex items-center justify-center size-5 ${isActive ? 'text-white' : 'text-[#90A1B9]'}`}>
                {icon}
            </div>

            {/* Label */}
            <span
                className={`relative font-bold text-sm uppercase tracking-[-0.35px] leading-5 whitespace-nowrap ${isActive ? 'text-white' : 'text-[#90A1B9]'
                    }`}
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                {label}
            </span>
        </Link>
    )
}
