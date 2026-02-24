import React from 'react'
import SectionHeader from './SectionHeader'
import ActivityMonthRow from './ActivityMonthRow'

import { Activity } from 'lucide-react'

const ACTIVITY_DATA = [
    { month: 'APRIL 2026', totalHours: 92, workHours: 84, vacationHours: 8 },
    { month: 'MARCH 2026', totalHours: 184, workHours: 176, vacationHours: 8 },
    { month: 'FEBRUARY 2026', totalHours: 112, workHours: 112, vacationHours: 0 },
]

export default function RecentActivity() {
    return (
        <div className="flex flex-col gap-4">
            <SectionHeader title="Recent Activity" icon={<Activity className="size-[14px] text-[#62748E]" />} />
            <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
                {ACTIVITY_DATA.map((row, i) => (
                    <ActivityMonthRow
                        key={row.month}
                        month={row.month}
                        totalHours={row.totalHours}
                        workHours={row.workHours}
                        vacationHours={row.vacationHours}
                        isLast={i === ACTIVITY_DATA.length - 1}
                    />
                ))}
            </div>
        </div>
    )
}
