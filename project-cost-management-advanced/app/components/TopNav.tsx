'use client'

import { LogOut } from 'lucide-react'

interface TopNavProps {
    onLogout?: () => void
}

export default function TopNav({ onLogout }: TopNavProps) {
    return (
        <div className="w-full bg-white shadow-sm">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                {/* Brand Section */}
                <div className="flex items-center gap-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#155DFC]">
                        <span
                            className="text-base font-bold text-white leading-6"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            P
                        </span>
                    </div>
                    <span
                        className="text-base font-bold text-[#1D293D] tracking-[-0.4px] leading-6"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        Project Pro
                    </span>
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-6">
                    {/* Language Switcher */}
                    <div className="flex items-center rounded-lg bg-[#F1F5F9] p-1">
                        <button className="flex items-center justify-center rounded-md bg-white px-3 py-1 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
                            <span
                                className="text-xs font-bold text-[#155DFC] leading-4"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                EN
                            </span>
                        </button>
                        <button className="flex items-center justify-center rounded-md px-3 py-1 hover:bg-white/50 transition-colors">
                            <span
                                className="text-xs font-bold text-[#62748E] leading-4"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                IT
                            </span>
                        </button>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <LogOut className="size-4 shrink-0 text-[#62748E]" />
                        <span
                            className="text-sm text-[#62748E] leading-5"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            Logout
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}
