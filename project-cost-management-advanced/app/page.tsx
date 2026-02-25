'use client'

import PortalCard from './components/auth/PortalCard'

export default function Home() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2563EB]/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0F172B]/5 rounded-full blur-[120px] animate-pulse delay-700" />
                <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-40" />
            </div>

            {/* Header section */}
            <div className="text-center mb-16 relative z-10 animate-in fade-in slide-in-from-top-12 duration-1000">
                <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 border border-blue-100/50 shadow-sm">
                    <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-[3px]">Next-Gen Platform</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-[#0F172B] tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-[#0F172B] to-[#1E293B]">
                    Project Cost Manager
                </h1>
                <p className="text-[#64748B] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium">
                    The ultimate suite for tracking project lifecycles, team costs, and
                    <span className="text-[#0F172B] font-bold"> real-time financial accuracy.</span>
                </p>
            </div>

            {/* Cards container */}
            <div className="flex flex-wrap justify-center gap-8 w-full max-w-5xl relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                <PortalCard
                    type="admin"
                    title="Management Panel"
                    description="Full administrative control over project financials, resources, and reporting."
                    href="/login/admin"
                />
                <PortalCard
                    type="employee"
                    title="Member Portal"
                    description="Personalized dashboard for time logging, tasks, and leave management."
                    href="/login/employee"
                />
            </div>

            {/* Subtle footer */}
            <div className="mt-24 relative z-10 flex flex-col items-center gap-2 animate-in fade-in duration-1000 delay-700">
                <div className="h-px w-12 bg-[#E2E8F0]" />
                <div className="text-[10px] uppercase tracking-[5px] font-black text-[#94A3B8]">
                    Neosperience AI Division
                </div>
            </div>
        </div>
    )
}
