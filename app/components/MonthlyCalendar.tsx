'use client'

import React, { useState, useMemo } from 'react'
import SectionHeader from './SectionHeader'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'
import AddLogModal from './AddLogModal'
import type { TimeLog } from '@/lib/generated/prisma'
import { Calendar } from 'lucide-react'
import { usePortalData } from '../portal/PortalDataProvider'

export default function MonthlyCalendar() {
    const { timeLogs, deleteLog } = usePortalData()
    const today = new Date() // Use actual today instead of mocked Figma today
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Group logs by YYYY-MM-DD for the CalendarGrid
    const groupedLogs = useMemo(() => {
        const groups: Record<string, (TimeLog & { project?: { name: string } })[]> = {}
        timeLogs.forEach(log => {
            // Extract YYYY-MM-DD date string consistently
            let dateStr: string
            const dateValue = log.date as unknown
            
            if (typeof dateValue === 'string') {
                // If already a string, extract date part (handles ISO format)
                dateStr = (dateValue as string).split('T')[0]
            } else if (dateValue instanceof Date) {
                // If Date object, extract date without timezone conversion
                const d = dateValue as Date
                dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
            } else {
                // Convert to ISO string and extract date
                const isoString = new Date(dateValue as string | number).toISOString()
                dateStr = isoString.split('T')[0]
            }
            
            if (!groups[dateStr]) groups[dateStr] = []
            groups[dateStr].push(log as TimeLog & { project?: { name: string } })
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

    const handleAddLogClick = (date: Date) => {
        setSelectedDate(date)
        setIsModalOpen(true)
    }

    const handleDeleteLog = (logId: string) => {
        // Optimistic update: remove log from state immediately
        deleteLog(logId)
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
                    onAddLogClick={handleAddLogClick}
                    onDeleteLog={handleDeleteLog}
                />
            </div>

            {/* Add Log Modal */}
            {selectedDate && (
                <AddLogModal
                    isOpen={isModalOpen}
                    date={selectedDate}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}
