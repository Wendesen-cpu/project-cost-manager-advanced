'use client'

import { usePathname } from 'next/navigation'
import SidebarNavLink from './SidebarNavLink'
import { LayoutDashboard, Users, Briefcase, Target, Link as LinkIcon } from 'lucide-react'
import { useLanguage } from '../../i18n'

const NAV_ITEMS = [
    {
        href: '/admin',
        labelKey: 'nav.dashboard',
        icon: <LayoutDashboard className="size-full" strokeWidth={2} />,
    },
    {
        href: '/admin/employees',
        labelKey: 'nav.employees',
        icon: <Users className="size-full" strokeWidth={2} />,
    },
    {
        href: '/admin/projects',
        labelKey: 'nav.projects',
        icon: <Briefcase className="size-full" strokeWidth={2} />,
    },
    {
        href: '/admin/projections',
        labelKey: 'nav.projections',
        icon: <Target className="size-full" strokeWidth={2} />,
    },
]

export default function SidebarNav() {
    const pathname = usePathname()
    const { t } = useLanguage()

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
                        label={t(item.labelKey)}
                        icon={item.icon}
                        isActive={isActive}
                    />
                )
            })}
        </nav>
    )
}
