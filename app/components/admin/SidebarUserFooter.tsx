'use client'

import SidebarLanguageSwitcher from './SidebarLanguageSwitcher'

const logoutIconSrc = 'http://localhost:3845/assets/f3e7e8be56b27df417759e48bd55d6da4f9e8097.svg'

interface SidebarUserFooterProps {
    username?: string
    onLogout?: () => void
}

export default function SidebarUserFooter({
    username = 'Administrator',
    onLogout,
}: SidebarUserFooterProps) {
    return (
        <div
            className="flex flex-col gap-6 p-6 w-full shrink-0"
            data-component="SidebarUserFooter"
        >
            {/* Language switcher */}
            <SidebarLanguageSwitcher />

            {/* User info row */}
            <div className="flex items-center justify-between px-2 w-full">
                {/* User text */}
                <div className="flex flex-col items-start">
                    <span
                        className="text-[#62748E] font-bold text-[10px] uppercase tracking-[1px] leading-[15px] whitespace-nowrap"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        Logged in as
                    </span>
                    <span
                        className="text-[#CAD5E2] font-bold text-xs leading-4 whitespace-nowrap overflow-hidden"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        {username}
                    </span>
                </div>

                {/* Logout button */}
                <button
                    onClick={onLogout}
                    className="flex items-center justify-center p-2 rounded-xl hover:bg-white/5 transition-colors shrink-0"
                    aria-label="Logout"
                >
                    <div className="relative size-5 shrink-0">
                        <img
                            src={logoutIconSrc}
                            alt="logout"
                            className="absolute inset-0 size-full block"
                        />
                    </div>
                </button>
            </div>
        </div>
    )
}
