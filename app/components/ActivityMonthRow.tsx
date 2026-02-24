'use client'

import React, { useState } from 'react'
import clsx from 'clsx'

import { Calendar, ChevronDown } from 'lucide-react'

interface ActivityMonthRowProps {
    month: string         // e.g. "APRIL 2026"
    totalHours: number
    workHours: number
    vacationHours: number
    isLast?: boolean
}

export default function ActivityMonthRow({
    month,
    totalHours,
    workHours,
    vacationHours,
    isLast = false,
}: ActivityMonthRowProps) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className={clsx('w-full', !isLast && 'border-b border-[#F1F5F9]')}>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-6 py-5 hover:bg-gray-50/50 transition-colors"
            >
                {/* Left: icon + month label */}
                <div className="flex items-center gap-3">
                    <div className="flex p-2 rounded-lg bg-[#EFF6FF] shrink-0">
                        <Calendar className="size-[18px] text-[#155DFC]" />
                    </div>
                    <span
                        className="text-[12px] font-bold uppercase tracking-[-0.3px] text-[#314158] leading-4"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        {month}
                    </span>
                </div>

                {/* Right: hours summary + chevron */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-0.5">
                        {/* Total hours */}
                        <div className="flex items-baseline gap-1">
                            <span
                                className="text-[30px] font-bold text-[#0F172B] leading-9"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {totalHours}
                            </span>
                            <span
                                className="text-[12px] font-bold uppercase text-[#90A1B9] leading-4"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                HRS
                            </span>
                        </div>
                        {/* Work / Vacation breakdown */}
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[10px] font-bold text-[#62748E] leading-[15px]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {workHours}H WORK
                            </span>
                            <span
                                className="text-[10px] font-bold text-[#F97316] leading-[15px]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {vacationHours}H VACATION
                            </span>
                        </div>
                    </div>
                    <ChevronDown
                        className={clsx('size-[18px] text-[#62748E] transition-transform duration-200', expanded && 'rotate-180')}
                    />
                </div>
            </button>

            {/* Expandable detail — placeholder for now */}
            {expanded && (
                <div className="px-6 pb-4 pt-1 text-sm text-gray-400 animate-in slide-in-from-top-2 fade-in duration-200">
                    Detailed breakdown coming soon…
                </div>
            )}
        </div>
    )
}
