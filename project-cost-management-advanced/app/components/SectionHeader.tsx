import React from 'react'

interface SectionHeaderProps {
    title: string
    icon: React.ReactNode
}

export default function SectionHeader({ title, icon }: SectionHeaderProps) {
    return (
        <div className="flex w-full items-center gap-2 px-1">
            <div className="flex size-[14px] items-center justify-center shrink-0">
                {icon}
            </div>
            <h3
                className="flex flex-col justify-center text-[14px] font-bold uppercase tracking-[1.4px] text-[#62748E] leading-5"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                {title}
            </h3>
        </div>
    )
}
