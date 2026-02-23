'use client'

import React, { useState } from 'react'
import clsx from 'clsx'

interface ActivityAccordionProps {
    title: string
    iconSrc: string
    defaultExpanded?: boolean
    children: React.ReactNode
    isLast?: boolean
}

const chevronDownIcon = "http://localhost:3845/assets/aec11f4d66a5bdcdfe4eb5593e3cdea196a03ea4.svg"

export default function ActivityAccordion({
    title,
    iconSrc,
    defaultExpanded = false,
    children,
    isLast = false
}: ActivityAccordionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)

    return (
        <div className={clsx("w-full", !isLast && "border-b border-[#F1F5F9]")}>
            {/* Header (Trigger) */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50/50"
            >
                <div className="flex items-center gap-3">
                    <div className="flex p-2 rounded-lg bg-[#EFF6FF] shrink-0 items-center justify-center">
                        <img src={iconSrc} alt="" className="size-[18px]" />
                    </div>
                    <span
                        className="text-[12px] font-bold uppercase tracking-[-0.3px] text-[#314158] leading-4"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        {title}
                    </span>
                </div>
                <img
                    src={chevronDownIcon}
                    alt="Toggle"
                    className={clsx(
                        "size-[18px] transition-transform duration-200",
                        isExpanded && "rotate-180"
                    )}
                />
            </button>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                    {children}
                </div>
            )}
        </div>
    )
}
