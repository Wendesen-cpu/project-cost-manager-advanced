'use client'

import React, { useState, useMemo } from 'react'
import SectionHeader from './SectionHeader'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
import type { TimeLog } from '@/lib/generated/prisma'
import { Calendar } from 'lucide-react'
import { usePortalData } from '../portal/PortalDataProvider'

export default function MonthlyCalendar() {
    const { timeLogs } = usePortalData()
    const today = new Date() // Use actual today instead of mocked Figma today
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())

    // Group logs by YYYY-MM-DD for the CalendarGrid
    const groupedLogs = useMemo(() => {
        const groups: Record<string, (TimeLog & { project?: { name: string } })[]> = {}
        timeLogs.forEach(log => {
            // log.date is an ISO string from our API (or Date object if fetched differently, but fetch returns string)
            const dateStr = new Date(log.date).toISOString().split('T')[0]
            if (!groups[dateStr]) groups[dateStr] = []
            groups[dateStr].push(log as any) // Type casting since the fetch includes the project relation
        })
        return groups
    }, [timeLogs])

    const goToPrev = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
        else setViewMonth(m => m - 1)
    }
    const goToNext = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
        else setViewMonth(m => m + 1)
    }
    const goToToday = () => {
        setViewYear(today.getFullYear())
        setViewMonth(today.getMonth())
    }

    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Monthly Calendar" icon={<Calendar className="size-[14px] text-[#62748E]" />} />
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
                <CalendarHeader
                    month={viewMonth}
                    year={viewYear}
                    onPrev={goToPrev}
                    onToday={goToToday}
                    onNext={goToNext}
                />
                <CalendarGrid
                    year={viewYear}
                    month={viewMonth}
                    logs={groupedLogs}
                    today={today}
                />
            </div>
        </div>
    )
}
