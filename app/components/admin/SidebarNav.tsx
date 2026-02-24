'use client'

import { usePathname } from 'next/navigation'
import SidebarNavLink from './SidebarNavLink'
import { LayoutDashboard, Users, Briefcase, Target, Link as LinkIcon } from 'lucide-react'

const NAV_ITEMS = [
    {
        href: '/admin',
        label: 'Dashboard',
        icon: <LayoutDashboard className="size-full" strokeWidth={2} />,
    },
    {
        href: '/admin/employees',
        label: 'Employees',
        icon: <Users className="size-full" strokeWidth={2} />,
    },
    {
        href: '/admin/projects',
        label: 'Projects',
        icon: <Briefcase className="size-full" strokeWidth={2} />,
    },
    {
        href: '/admin/projections',
        label: 'Projections',
        icon: <Target className="size-full" strokeWidth={2} />,
    },
    {
        href: '/admin/new-section',
        label: 'New Section',
        icon: <LinkIcon className="size-full" strokeWidth={2} />,
    },
]

export default function SidebarNav() {
    const pathname = usePathname()

    return (
        <nav
            className="flex flex-col gap-1.5 w-full px-8"
            data-component="SidebarNav"
        >
            {NAV_ITEMS.map((item) => {
                // Exact match for /admin, prefix match for sub-routes
                const isActive =
                    item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href)

                return (
                    <SidebarNavLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={isActive}
                    />
                )
            })}
        </nav>
    )
}
