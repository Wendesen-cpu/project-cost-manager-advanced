import React from 'react'
import SectionHeader from './SectionHeader'
import StatCard from './StatCard'
import ActivityAccordion from './ActivityAccordion'
import LogWorkForm from './LogWorkForm'

export default function EmployeeSidebar() {
    const myStatsIcon = "http://localhost:3845/assets/09d5ea8b2151e09d5d1829e7ac874300f7221bd4.svg"
    const vacationPalmIcon = "http://localhost:3845/assets/a420367a2d7fb6109e6a0e88286164a5cd0e9e0a.svg"
    const projectBriefcaseIcon = "http://localhost:3845/assets/fa2c9e5b4333d8524243520fdba984b6c86f4614.svg"
    const logActivityIcon = "http://localhost:3845/assets/decc33d18872057dbc4710629cc8f905520a5bc1.svg"
    const logWorkHoursIcon = "http://localhost:3845/assets/df422acecca71a87a67ae9c84043821227db329a.svg"
    const logVacationIcon = "http://localhost:3845/assets/10b954d7ae9ad0793651808f440e26305cbc6f97.svg"

    return (
        <div className="flex flex-col gap-8 w-full max-w-sm">
            {/* My Stats Section */}
            <section className="flex flex-col gap-4">
                <SectionHeader title="My Stats" iconSrc={myStatsIcon} />
                <StatCard
                    title="Vacation Remaining"
                    value="18"
                    unit="Days"
                    iconSrc={vacationPalmIcon}
                    iconBgColor="bg-[#EFF6FF]"
                />
                <StatCard
                    title="Assigned Projects"
                    value="3"
                    iconSrc={projectBriefcaseIcon}
                    iconBgColor="bg-[#F1F5F9]"
                />
            </section>

            {/* Log Activity Section */}
            <section className="flex flex-col gap-4">
                <SectionHeader title="Log Activity" iconSrc={logActivityIcon} />
                <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0]/60 bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]">
                    <ActivityAccordion
                        title="Log Work Hours"
                        iconSrc={logWorkHoursIcon}
                        defaultExpanded={true}
                    >
                        <LogWorkForm />
                    </ActivityAccordion>

                    <ActivityAccordion
                        title="Log Vacation"
                        iconSrc={logVacationIcon}
                        isLast={true}
                    >
                        <div className="text-sm text-gray-500 py-4">
                            Vacation logging form coming soon...
                        </div>
                    </ActivityAccordion>
                </div>
            </section>
        </div>
    )
}
