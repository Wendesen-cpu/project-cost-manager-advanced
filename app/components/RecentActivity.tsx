import React, { useMemo } from 'react'
import SectionHeader from './SectionHeader'
import ActivityMonthRow from './ActivityMonthRow'
import { Activity } from 'lucide-react'
import { usePortalData } from '../portal/PortalDataProvider'

export default function RecentActivity() {
    const { timeLogs } = usePortalData()

    const activityData = useMemo(() => {
        const monthMap: Record<string, { monthDate: Date, workHours: number, vacationHours: number }> = {}

        timeLogs.forEach(log => {
            const d = new Date(log.date)
            // Group by YYYY-MM
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

            if (!monthMap[key]) {
                monthMap[key] = { monthDate: d, workHours: 0, vacationHours: 0 }
            }

            if (log.type === 'WORK') {
                monthMap[key].workHours += log.hours
            } else if (log.type === 'VACATION') {
                monthMap[key].vacationHours += log.hours
            }
        })

        // Convert map to array and sort descending by date
        const sortedKeys = Object.keys(monthMap).sort((a, b) => b.localeCompare(a))

        return sortedKeys.map(key => {
            const data = monthMap[key]
            const monthName = data.monthDate.toLocaleString('default', { month: 'long' }).toUpperCase()
            const year = data.monthDate.getFullYear()
            return {
                month: `${monthName} ${year}`,
                totalHours: data.workHours + data.vacationHours,
                workHours: data.workHours,
                vacationHours: data.vacationHours,
            }
        })
    }, [timeLogs])

    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Recent Activity" icon={<Activity className="size-[14px] text-[#62748E]" />} />
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
                {activityData.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[#62748E] font-medium" style={{ fontFamily: 'Arial, sans-serif' }}>
                        No recent activity found.
                    </div>
                ) : (
                    activityData.map((row, i) => (
                        <ActivityMonthRow
                            key={row.month}
                            month={row.month}
                            totalHours={row.totalHours}
                            workHours={row.workHours}
                            vacationHours={row.vacationHours}
                            isLast={i === activityData.length - 1}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
