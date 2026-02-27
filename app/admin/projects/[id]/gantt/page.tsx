'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { ProjectStatus, PaymentType } from '@lib/generated/prisma/enums'
import { useLanguage } from '@/app/i18n'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AssignedUser {
    id: string
    name: string
    lastName: string
}

interface Assignment {
    id: string
    userId: string
    dailyHours: number
    startDate: string | null
    endDate: string | null
    user: AssignedUser
}

interface TimeLogEntry {
    hours: number
    userId: string
    date: string
}

interface Project {
    id: string
    name: string
    description: string | null
    startDate: string | null
    endDate: string | null
    paymentType: PaymentType
    status: ProjectStatus
    owner: { id: string; name: string; lastName: string; email: string }
    assignments: Assignment[]
    timeLogs: TimeLogEntry[]
}

// ─── Palette for bars ─────────────────────────────────────────────────────────
const BAR_COLORS = [
    '#4F39F6', // indigo
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#F97316', // orange
    '#EC4899', // pink
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMonth(d: Date) {
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function fmtDateShort(d: Date) {
    return d.toLocaleDateString('en-GB')
}

// ─── Gantt Bar ────────────────────────────────────────────────────────────────
interface BarProps {
    label: string
    color: string
    leftPct: number
    widthPct: number
    tooltip: string
}

function GanttBar({ label, color, leftPct, widthPct, tooltip }: BarProps) {
    const [hovered, setHovered] = useState(false)
    const barRef = useRef<HTMLDivElement>(null)

    return (
        <div className="flex items-center gap-4 py-3 relative">
            {/* Name + dot */}
            <div className="flex items-center gap-2 w-40 shrink-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-[#0F172B] truncate">{label}</span>
            </div>

            {/* Bar track */}
            <div className="relative flex-1 h-8">
                <div
                    ref={barRef}
                    className="absolute h-full rounded-md cursor-pointer transition-opacity hover:opacity-90"
                    style={{
                        backgroundColor: color,
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 2)}%`,
                    }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                />

                {/* Tooltip */}
                {hovered && (
                    <div
                        className="absolute z-10 bg-[#0F172B] text-white text-xs rounded-md px-3 py-2 pointer-events-none whitespace-nowrap shadow-lg"
                        style={{
                            left: `calc(${leftPct}% + ${Math.max(widthPct, 2) / 2}%)`,
                            transform: 'translateX(-50%) translateY(-110%)',
                            top: 0,
                        }}
                    >
                        {tooltip}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172B]" />
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GanttPage() {
    const { t } = useLanguage()
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProject = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin/projects/${id}`)
            if (!res.ok) throw new Error('Not found')
            const data: Project = await res.json()
            setProject(data)
        } catch {
            setError(t('projects.couldNotLoadProject'))
        } finally {
            setLoading(false)
        }
    }, [id, t])

    useEffect(() => { fetchProject() }, [fetchProject])

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="animate-spin rounded-full border-4 border-t-transparent w-10 h-10" style={{ borderColor: '#4F39F6', borderTopColor: 'transparent' }} />
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-[#B91C1C]">{error ?? t('projects.projectNotFound')}</p>
            </div>
        )
    }

    // ── Compute timeline bounds ──────────────────────────────────────────────
    // Use project dates; fall back to today if completely un-dated
    const fallbackStart = Date.now()
    const fallbackEnd = Date.now() + 30 * 24 * 60 * 60 * 1000 // +30 days

    const timelineStart = project.startDate
        ? new Date(project.startDate).getTime()
        : fallbackStart
    const timelineEnd = project.endDate
        ? new Date(project.endDate).getTime()
        : fallbackEnd
    const timelineSpan = Math.max(timelineEnd - timelineStart, 1)

    // ── Per-member date range from their Assignment ──────────────────────────
    const memberRanges = project.assignments.map((a, idx) => {
        // Fall back to project timeline if the assignment itself doesn't have start/end dates
        const memberStart = a.startDate ? new Date(a.startDate).getTime() : timelineStart
        const memberEnd = a.endDate ? new Date(a.endDate).getTime() : timelineEnd

        const leftPct = ((memberStart - timelineStart) / timelineSpan) * 100
        const widthPct = ((memberEnd - memberStart) / timelineSpan) * 100

        return {
            assignment: a,
            color: BAR_COLORS[idx % BAR_COLORS.length],
            leftPct: Math.max(0, leftPct),
            widthPct: Math.min(100 - Math.max(0, leftPct), Math.max(widthPct, 5)),
            startDate: new Date(memberStart),
            endDate: new Date(memberEnd),
        }
    })

    const startLabel = fmtMonth(new Date(timelineStart))
    const endLabel = fmtMonth(new Date(timelineEnd))

    return (
        <div className="w-full min-h-screen" style={{ backgroundColor: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-2 text-sm text-[#6A7282]">
                    <button onClick={() => router.push('/admin/projects')} className="hover:text-[#0F172B] transition-colors">
                        {t('nav.projects')}
                    </button>
                    <span>/</span>
                    <button onClick={() => router.push(`/admin/projects/${project.id}`)} className="hover:text-[#0F172B] transition-colors">
                        {project.name}
                    </button>
                    <span>/</span>
                    <span className="text-[#0F172B] font-medium">{t('projects.ganttChart')}</span>
                </nav>

                {/* ── Header ── */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-[#0F172B] font-bold text-3xl">{project.name}</h1>
                        {project.description && (
                            <p className="text-sm text-[#6A7282]">{project.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => router.push(`/admin/projects/${project.id}`)}
                        className="flex items-center gap-2 text-sm font-medium text-[#0F172B] border border-[#E2E8F0] rounded-md px-4 py-2 bg-white hover:bg-[#F8FAFC] transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('projects.backToDetails')}
                    </button>
                </div>

                {/* ── Timeline card ── */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                    {/* Card header */}
                    <div className="px-6 pt-5 pb-3 border-b border-[#F1F5F9]">
                        <p className="text-sm font-bold text-[#0F172B] uppercase tracking-wide">
                            {t('projects.ganttTitle')}
                        </p>
                    </div>

                    {/* Date scale header */}
                    <div className="px-6 pt-4 flex items-center gap-4">
                        <div className="w-40 shrink-0 text-xs font-bold text-[#6A7282] uppercase tracking-[0.6px]">
                            {t('projects.memberTableHeader')}
                        </div>
                        <div className="relative flex-1 flex justify-between">
                            <span className="text-xs text-[#6A7282]">{startLabel}</span>
                            <span className="text-xs text-[#6A7282]">{endLabel}</span>
                        </div>
                    </div>

                    {/* Bars */}
                    <div className="px-6 pb-2 divide-y divide-[#F1F5F9]">
                        {memberRanges.length === 0 ? (
                            <p className="py-8 text-center text-sm text-[#6A7282] italic">
                                {t('projects.noTeamMembersAssigned')}
                            </p>
                        ) : (
                            memberRanges.map(({ assignment, color, leftPct, widthPct, startDate, endDate }) => (
                                <GanttBar
                                    key={assignment.id}
                                    label={`${assignment.user.name} ${assignment.user.lastName}`}
                                    color={color}
                                    leftPct={leftPct}
                                    widthPct={widthPct}
                                    tooltip={`${assignment.user.name}: ${fmtDateShort(startDate)} – ${fmtDateShort(endDate)} · ${assignment.dailyHours}h/day`}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer scale */}
                    <div className="px-6 py-3 border-t border-[#F1F5F9] flex items-center">
                        <div className="w-40 shrink-0 text-xs text-[#6A7282] uppercase tracking-[0.4px]">
                            {t('projects.startLabel').replace('{label}', startLabel)}
                        </div>
                        <div className="flex-1 flex justify-center items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#4F39F6]" />
                            <span className="text-xs text-[#6A7282] uppercase tracking-[0.6px]">{t('projects.timelineView')}</span>
                        </div>
                        <div className="text-xs text-[#6A7282] uppercase tracking-[0.4px]">
                            {t('projects.endLabel').replace('{label}', endLabel)}
                        </div>
                    </div>
                </div>

                {/* ── Info box ── */}
                <div className="rounded-lg border border-[#C7D7FF] bg-[#EFF6FF] px-5 py-4 flex gap-3">
                    <Info className="w-4 h-4 text-[#4F39F6] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-[#4F39F6] uppercase tracking-wide mb-1">{t('projects.ganttViewInfo')}</p>
                        <p className="text-xs text-[#4F39F6] leading-5">
                            {t('projects.ganttViewDescription')}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
