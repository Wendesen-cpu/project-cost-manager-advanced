'use client'

import React, { useState } from 'react'
import SectionHeader from './SectionHeader'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
import type { TimeLog } from './CalendarDayCell'

import { Calendar } from 'lucide-react'

// Static sample logs matching the Figma (every weekday in Feb 2026 = 8h, "Food deli..." project)
const SAMPLE_LOGS: Record<string, TimeLog[]> = (() => {
    const logs: Record<string, TimeLog[]> = {}
    // Feb 2026 weekdays: 2–6, 9–13 (done in Figma)
    const weekdays = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    weekdays.forEach(d => {
        const key = `2026-02-${String(d).padStart(2, '0')}`
        logs[key] = [{ projectName: 'Food delivery', hours: 8 }]
    })
    return logs
})()

export default function MonthlyCalendar() {
    const today = new Date(2026, 1, 20) // Feb 20 2026 (matches Figma)
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())

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
                    logs={SAMPLE_LOGS}
                    today={today}
                />
            </div>
        </div>
    )
}
