'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardStatCard from '@/app/components/admin/DashboardStatCard'
import DashboardQuickActions from '@/app/components/admin/DashboardQuickActions'
import NewProjectModal from '@/app/components/admin/NewProjectModal'
import NewEmployeeModal from '@/app/components/admin/NewEmployeeModal'
import { Briefcase, Users, Wallet } from 'lucide-react'

interface DashboardStats {
    activeProjectCount: number
    totalEmployeeCount: number
    estimatedMonthlyRevenue: number
}

function formatCurrency(amount: number): string {
    return `€${amount.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [statsLoading, setStatsLoading] = useState(true)
    const [statsError, setStatsError] = useState<string | null>(null)
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
    const [isNewEmployeeOpen, setIsNewEmployeeOpen] = useState(false)

    const fetchStats = useCallback(async () => {
        setStatsLoading(true)
        setStatsError(null)
        try {
            const res = await fetch('/api/admin/dashboard/stats')
            if (!res.ok) throw new Error('Failed to load stats')
            const data: DashboardStats = await res.json()
            setStats(data)
        } catch {
            setStatsError('Could not load dashboard stats.')
        } finally {
            setStatsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchStats()
    }, [fetchStats])

    // Called after a project is successfully created
    const handleProjectCreated = () => {
        fetchStats()
    }

    return (
        <div
            className="w-full min-h-full"
            style={{ backgroundColor: '#FFFFFF' }}
        >
            <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12">
                {/* Page title */}
                <h1
                    className="text-[#0F172B] font-bold text-[30px] leading-9 tracking-[-0.75px]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Dashboard
                </h1>

                {/* Stat cards row */}
                {statsError ? (
                    <div
                        className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-red-700 text-sm"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        {statsError}
                    </div>
                ) : (
                    <div className="flex gap-6 w-full">
                        <DashboardStatCard
                            icon={<Briefcase strokeWidth={2} />}
                            iconBg="#EFF6FF"
                            label="Active Projects"
                            value={statsLoading ? '—' : stats?.activeProjectCount ?? 0}
                        />
                        <DashboardStatCard
                            icon={<Users strokeWidth={2} />}
                            iconBg="#F1F5F9"
                            label="Total Employees"
                            value={statsLoading ? '—' : stats?.totalEmployeeCount ?? 0}
                        />
                        <DashboardStatCard
                            icon={<Wallet strokeWidth={2} />}
                            iconBg="#EFF6FF"
                            label="Est. Monthly Revenue"
                            value={
                                statsLoading
                                    ? '—'
                                    : formatCurrency(stats?.estimatedMonthlyRevenue ?? 0)
                            }
                        />
                    </div>
                )}

                {/* Quick actions */}
                <DashboardQuickActions
                    onNewProject={() => setIsNewProjectOpen(true)}
                    onNewEmployee={() => setIsNewEmployeeOpen(true)}
                />

                {/* New Project Modal */}
                <NewProjectModal
                    isOpen={isNewProjectOpen}
                    onClose={() => setIsNewProjectOpen(false)}
                    onCreated={handleProjectCreated}
                />

                {/* New Employee Modal */}
                <NewEmployeeModal
                    isOpen={isNewEmployeeOpen}
                    onClose={() => setIsNewEmployeeOpen(false)}
                    onCreated={handleProjectCreated}
                />
            </div>
        </div>
    )
}
