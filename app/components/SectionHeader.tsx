import React from 'react'

interface SectionHeaderProps {
    title: string
    iconSrc: string
}

export default function SectionHeader({ title, iconSrc }: SectionHeaderProps) {
    return (
        <div className="flex w-full items-center gap-2 px-1">
            <div className="relative size-[14px] shrink-0">
                <img alt="" className="absolute block max-w-none h-full w-full" src={iconSrc} />
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
