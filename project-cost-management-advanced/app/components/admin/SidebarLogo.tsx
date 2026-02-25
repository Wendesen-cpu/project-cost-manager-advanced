'use client'

import { Layers } from 'lucide-react'

export default function SidebarLogo() {
    return (
        <div
            className="flex items-center gap-3 px-8 pt-8 pb-0 w-full shrink-0"
            data-component="SidebarLogo"
        >
            {/* Icon box with gradient */}
            <div
                className="relative flex items-center justify-center rounded-xl shrink-0 size-10"
                style={{
                    background: 'linear-gradient(45deg, #155DFC 0%, #4F39F6 100%)',
                }}
            >
                {/* Shadow overlay */}
                <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                        boxShadow:
                            '0px 10px 15px -3px rgba(43, 127, 255, 0.2), 0px 4px 6px -4px rgba(43, 127, 255, 0.2)',
                    }}
                />
                <Layers className="relative z-10 size-[22px] text-white" strokeWidth={2.5} />
            </div>

            {/* Brand text */}
            <div className="flex flex-col gap-0.5">
                <p
                    className="text-white font-bold text-xl uppercase tracking-[-0.5px] leading-7 whitespace-nowrap"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Project Pro
                </p>
                <p
                    className="text-[#62748E] font-bold text-[10px] uppercase tracking-[1px] leading-[10px] whitespace-nowrap"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Admin Console
                </p>
            </div>
        </div>
    )
}
