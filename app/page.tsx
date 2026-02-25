'use client'

import PortalCard from './components/auth/PortalCard'

export default function Home() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px]">
            {/* Header section */}
            <div className="text-center mb-16 animate-in fade-in slide-in-from-top duration-700">
                <h1 className="text-4xl font-extrabold text-[#0F172B] tracking-tight mb-4">
                    Project Cost Manager
                </h1>
                <p className="text-[#64748B] text-lg max-w-lg mx-auto leading-relaxed">
                    Manage projects, track time, and analyze financial projections with ease.
                </p>
            </div>

            {/* Cards container */}
            <div className="flex flex-wrap justify-center gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <PortalCard
                    title="Admin Portal"
                    description="Manage projects, employees, and view financial stats."
                    href="/login/admin"
                />
                <PortalCard
                    title="Employee Portal"
                    description="Log work hours, track vacation, and view assignments."
                    href="/login/employee"
                />
            </div>

            {/* Subtle footer */}
            <div className="mt-20 text-[10px] uppercase tracking-[3px] font-bold text-[#CBD5E1]">
                Corporate Resource Management
            </div>
        </div>
    )
}
