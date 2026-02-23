import React from 'react'
import MonthlyCalendar from './MonthlyCalendar'
import RecentActivity from './RecentActivity'

export default function PortalMainContent() {
    return (
        <div className="flex flex-col gap-8">
            <MonthlyCalendar />
            <RecentActivity />
        </div>
    )
}
