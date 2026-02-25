'use client'

import { useState, useEffect, useMemo } from 'react'
import { PlusCircle, Search } from 'lucide-react'
import ProjectCard from '../../components/admin/ProjectCard'
import NewProjectModal from '../../components/admin/NewProjectModal'
import { ProjectStatus, PaymentType } from '@lib/generated/prisma/enums'

type RawProjectFromApi = {
    id: string
    name: string
    description: string | null
    status: ProjectStatus
    startDate: string | null
    paymentType: PaymentType
    totalProjectPrice: number | null
    totalFixedCost: number | null
    _count?: {
        assignments: number
    }
    assignments?: any[]
}

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<RawProjectFromApi[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)

    const fetchProjects = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/projects')
            if (res.ok) {
                const data = await res.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return projects
        const q = searchQuery.toLowerCase()
        return projects.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.description && p.description.toLowerCase().includes(q))
        )
    }, [projects, searchQuery])

    return (
        <div className="w-full min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12">

                {/* Header row */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full gap-4">
                    <div className="flex flex-col gap-1">
                        <h1
                            className="text-[#0F172B] font-bold text-[30px] leading-9 tracking-[-0.75px]"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            Projects
                        </h1>
                        <p className="text-[#6a7282] text-[16px] leading-6" style={{ fontFamily: 'Arial, sans-serif' }}>
                            Manage and track company active projects
                        </p>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-[#155DFC] hover:bg-blue-700 text-white rounded-[12px] px-6 py-3 flex items-center justify-center gap-2 transition-shadow shadow-[0px_4px_6px_-4px_#bedbff,0px_10px_15px_-3px_#bedbff] shrink-0"
                    >
                        <PlusCircle className="w-5 h-5 text-white" strokeWidth={2} />
                        <span className="font-bold text-[14px]" style={{ fontFamily: 'Arial, sans-serif' }}>
                            Add New Project
                        </span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full max-w-[448px]">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Search className="w-[18px] h-[18px] text-[#6a7282]" strokeWidth={2} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-[41px] pr-[17px] py-[15px] border border-[#e2e8f0] rounded-[12px] text-[#171717] text-[14px] outline-none focus:border-[#155dfc] transition-colors placeholder:text-[#171717]/50"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    />
                </div>

                {/* Grid */}
                <div className="w-full mt-2">
                    {isLoading ? (
                        <p className="text-[#6a7282] italic">Loading projects...</p>
                    ) : filteredProjects.length === 0 ? (
                        <p className="text-[#6a7282] italic">No projects found.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-start">
                            {filteredProjects.map((proj) => {
                                // Fallback member count extraction if _count is missing for some reason
                                const memberCount = proj._count?.assignments ?? proj.assignments?.length ?? 0

                                // Determine the total value (Revenue) to show
                                const totalValue = proj.totalProjectPrice ?? 0

                                return (
                                    <ProjectCard
                                        key={proj.id}
                                        id={proj.id}
                                        name={proj.name}
                                        description={proj.description}
                                        status={proj.status}
                                        startDate={proj.startDate}
                                        paymentType={proj.paymentType}
                                        memberCount={memberCount}
                                        totalValue={totalValue}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* New Project Modal using the existing modal */}
                <NewProjectModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onCreated={() => {
                        setIsAddModalOpen(false)
                        fetchProjects()
                    }}
                />
            </div>
        </div>
    )
}
