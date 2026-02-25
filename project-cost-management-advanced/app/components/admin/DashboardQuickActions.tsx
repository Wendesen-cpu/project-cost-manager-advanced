'use client'

import { Plus } from 'lucide-react'

interface DashboardQuickActionsProps {
    onNewProject: () => void
    onNewEmployee: () => void
}

export default function DashboardQuickActions({ onNewProject, onNewEmployee }: DashboardQuickActionsProps) {
    return (
        <div
            className="flex flex-col gap-6 w-full rounded-2xl border border-solid p-[33px]"
            style={{
                backgroundColor: '#F8FAFC',
                borderColor: 'rgba(229, 231, 235, 0.5)',
            }}
        >
            {/* Section heading */}
            <div className="flex items-center gap-2">
                <div
                    className="shrink-0 w-1.5 rounded-full"
                    style={{ height: '24px', backgroundColor: '#155DFC' }}
                />
                <span
                    className="text-[#0F172B] font-bold text-xl leading-7 whitespace-nowrap"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Quick Actions
                </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4">
                {/* New Project — Blue */}
                <button
                    onClick={onNewProject}
                    className="relative flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm leading-5 transition-opacity hover:opacity-90"
                    style={{
                        backgroundColor: '#155DFC',
                        boxShadow: '0px 10px 15px -3px #bedbff, 0px 4px 6px -4px #bedbff',
                        fontFamily: 'Arial, sans-serif',
                    }}
                >
                    <Plus className="size-[18px]" strokeWidth={2.5} />
                    New Project
                </button>

                {/* New Employee — Green */}
                <button
                    onClick={onNewEmployee}
                    className="relative flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm leading-5 transition-opacity hover:opacity-90"
                    style={{
                        backgroundColor: '#009966',
                        boxShadow: '0px 10px 15px -3px #a4f4cf, 0px 4px 6px -4px #a4f4cf',
                        fontFamily: 'Arial, sans-serif',
                    }}
                >
                    <Plus className="size-[18px]" strokeWidth={2.5} />
                    New Employee
                </button>
            </div>
        </div>
    )
}
