import React from 'react'
import clsx from 'clsx'

export interface TimeLog {
    projectName: string
    hours: number
}

interface CalendarDayCellProps {
    day: number | null        // null = padding cell (outside month)
    isToday?: boolean
    isOtherMonth?: boolean
    logs?: TimeLog[]
}

export default function CalendarDayCell({ day, isToday, isOtherMonth, logs = [] }: CalendarDayCellProps) {
    return (
        <div
            className={clsx(
                'flex flex-col gap-1 pt-2 pb-2 px-2 border-b border-r border-[#F1F5F9] min-h-[100px]',
                isOtherMonth && 'opacity-40 bg-[rgba(248,250,252,0.3)]'
            )}
        >
            {day !== null && (
                <>
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                        <div
                            className={clsx(
                                'flex items-center justify-center size-6 rounded-full text-[12px] leading-4',
                                isToday
                                    ? 'bg-[#155DFC] text-white font-bold'
                                    : 'text-[#62748E] font-bold'
                            )}
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            {day}
                        </div>
                        {/* Hours badge (top-right summary) */}
                        {logs.length > 0 && (
                            <span
                                className="bg-[#EFF6FF] text-[#155DFC] text-[10px] font-bold px-[6px] py-[2px] rounded-md leading-[15px]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {logs.reduce((sum, l) => sum + l.hours, 0)}h
                            </span>
                        )}
                    </div>

                    {/* Event chips */}
                    {logs.map((log, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between bg-[#EFF6FF] border border-[rgba(219,234,254,0.5)] rounded-[4px] px-[5px] py-[3px] overflow-hidden w-full"
                        >
                            <span
                                className="text-[9px] text-[#1447E6] truncate leading-[11.25px] min-w-0"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {log.projectName}
                            </span>
                            <span
                                className="text-[9px] font-bold text-[#1447E6] shrink-0 ml-1 leading-[11.25px]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {log.hours}h
                            </span>
                        </div>
                    ))}
                </>
            )}
        </div>
    )
}
