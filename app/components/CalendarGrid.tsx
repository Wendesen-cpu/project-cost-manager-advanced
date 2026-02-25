import React from 'react'
import CalendarDayCell from './CalendarDayCell'
import type { TimeLog } from '@/lib/generated/prisma'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarGridProps {
    year: number
    month: number  // 0-indexed
    // keyed by "YYYY-MM-DD" → array of logs for that day
    logs?: Record<string, TimeLog[]>
    today: Date
}

function buildCalendarMatrix(year: number, month: number) {
    // first day of the month (0=Sun…6=Sat) → convert to Mon-based (0=Mon…6=Sun)
    const firstDay = new Date(year, month, 1)
    const rawDow = firstDay.getDay() // 0=Sun
    const startOffset = rawDow === 0 ? 6 : rawDow - 1  // Mon-based offset

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    // previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate()

    const cells: Array<{ day: number; isOtherMonth: boolean }> = []

    // leading cells from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
        cells.push({ day: prevMonthDays - i, isOtherMonth: true })
    }

    // current month days
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, isOtherMonth: false })
    }

    // trailing cells to fill the last row (Sun column)
    const remainder = cells.length % 7
    if (remainder !== 0) {
        const trailing = 7 - remainder
        for (let d = 1; d <= trailing; d++) {
            cells.push({ day: d, isOtherMonth: true })
        }
    }

    return cells
}

export default function CalendarGrid({ year, month, logs = {}, today }: CalendarGridProps) {
    const cells = buildCalendarMatrix(year, month)
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    return (
        <div className="w-full">
            {/* Day-of-week header */}
            <div
                className="grid grid-cols-7 border-b border-[#F1F5F9] bg-[rgba(248,250,252,0.5)]"
            >
                {DAY_LABELS.map((label) => (
                    <div
                        key={label}
                        className="flex items-center justify-center py-3"
                    >
                        <span
                            className="text-[10px] font-bold uppercase tracking-[1px] text-[#90A1B9] leading-[15px]"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            {label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Day cells grid */}
            <div className="grid grid-cols-7">
                {cells.map((cell, idx) => {
                    const keyDate = cell.isOtherMonth
                        ? null
                        : `${year}-${String(month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`
                    const isToday = keyDate === todayKey
                    const cellLogs = keyDate ? (logs[keyDate] ?? []) : []

                    return (
                        <CalendarDayCell
                            key={idx}
                            day={cell.day}
                            isOtherMonth={cell.isOtherMonth}
                            isToday={isToday}
                            logs={cellLogs}
                        />
                    )
                })}
            </div>
        </div>
    )
}
