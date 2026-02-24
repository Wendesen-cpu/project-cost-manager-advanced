'use client'

import { usePathname } from 'next/navigation'
import SidebarNavLink from './SidebarNavLink'

// SVG icons served from Figma's local asset server
const NAV_ITEMS = [
    {
        href: '/admin',
        label: 'Dashboard',
        iconSrc: 'http://localhost:3845/assets/d59a236f60900359fb54aec9bec22ba06c4b77da.svg',
    },
    {
        href: '/admin/employees',
        label: 'Employees',
        iconSrc: 'http://localhost:3845/assets/0690ba3c606b79f0e2e514b8e2c88457a3a347ba.svg',
    },
    {
        href: '/admin/projects',
        label: 'Projects',
        iconSrc: 'http://localhost:3845/assets/8f3fac0fd847db5714aba8674ffad3e418a1c8af.svg',
    },
    {
        href: '/admin/projections',
        label: 'Projections',
        iconSrc: 'http://localhost:3845/assets/ae1c8c92bb57264cf90ad8db1815586898829c3b.svg',
    },
    {
        href: '/admin/new-section',
        label: 'New Section',
        iconSrc: 'http://localhost:3845/assets/21958c71a50eb5943ea5ccfead5df3f6cb1347af.svg',
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
                        iconSrc={item.iconSrc}
                        isActive={isActive}
                    />
                )
            })}
        </nav>
    )
}
