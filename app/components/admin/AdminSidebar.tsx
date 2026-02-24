'use client'

import SidebarLogo from './SidebarLogo'
import SidebarNav from './SidebarNav'
import SidebarUserFooter from './SidebarUserFooter'

interface AdminSidebarProps {
    username?: string
    onLogout?: () => void
}

/**
 * AdminSidebar — composition root.
 * Combines SidebarLogo + SidebarNav (top section) and SidebarUserFooter (bottom).
 * Width is fixed at 288px to match the Figma design.
 */
export default function AdminSidebar({ username, onLogout }: AdminSidebarProps) {
    return (
        <aside
            className="flex flex-col items-start justify-between h-full w-[288px] shrink-0 border-r border-solid"
            style={{
                backgroundColor: '#0F172B',
                borderColor: 'rgba(29, 41, 61, 0.5)',
            }}
            data-component="AdminSidebar"
        >
            {/* Top section: logo + navigation */}
            <div className="flex flex-col gap-10 w-full pt-8 pb-6">
                <SidebarLogo />
                <SidebarNav />
            </div>

            {/* Bottom section: language + user info */}
            <SidebarUserFooter username={username} onLogout={onLogout} />
        </aside>
    )
}
