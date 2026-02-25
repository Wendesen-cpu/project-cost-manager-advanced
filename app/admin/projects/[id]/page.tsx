'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Pencil, X } from 'lucide-react'
import { Role, ProjectStatus, PaymentType, FixedCostType } from '@lib/generated/prisma/enums'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AssignedUser {
    id: string
    name: string
    lastName: string
    role: Role
    monthlyCost: number | null
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

interface Owner {
    id: string
    name: string
    lastName: string
    email: string
}

interface Project {
    id: string
    name: string
    description: string | null
    startDate: string | null
    endDate: string | null
    paymentType: PaymentType
    totalProjectPrice: number | null
    fixedCostType: string | null
    totalFixedCost: number | null
    status: ProjectStatus
    owner: Owner
    assignments: Assignment[]
    timeLogs: TimeLogEntry[]
}

interface EmployeeOption {
    id: string
    name: string
    lastName: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatEuro(n: number): string {
    return `€${n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(d: string | null): string {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB')
}

function computeDuration(start: string | null, end: string | null): string {
    if (!start || !end) return '—'
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms <= 0) return '—'
    const days = Math.round(ms / (1000 * 60 * 60 * 24))
    const months = Math.floor(days / 30)
    const rem = days % 30
    if (months > 0 && rem > 0) return `${months} month${months > 1 ? 's' : ''} ${rem} day${rem > 1 ? 's' : ''}`
    if (months > 0) return `${months} month${months > 1 ? 's' : ''}`
    return `${days} day${days > 1 ? 's' : ''}`
}

// Count business days (Mon-Fri) between two dates
function countWorkingDays(start: Date, end: Date): number {
    let count = 0
    const d = new Date(start)
    while (d <= end) {
        const day = d.getDay()
        if (day !== 0 && day !== 6) count++
        d.setDate(d.getDate() + 1)
    }
    return count
}

function computeCosts(project: Project) {
    // Hourly rate = monthlyCost / 160 (standard monthly work hours)
    const MONTHLY_HOURS = 160

    // Only consider logs within the project duration
    const projStart = project.startDate ? new Date(project.startDate).getTime() : -Infinity
    const projEnd = project.endDate ? new Date(project.endDate).getTime() : Infinity
    const validLogs = project.timeLogs.filter((log) => {
        const logTime = new Date(log.date).getTime()
        return logTime >= projStart && logTime <= projEnd
    })

    // Effective Labor Cost: actual logged hours × hourly rate per user
    const effectiveLabor = validLogs.reduce((sum, log) => {
        const assignment = project.assignments.find((a) => a.userId === log.userId)
        const hourlyRate = (assignment?.user.monthlyCost ?? 0) / MONTHLY_HOURS
        return sum + log.hours * hourlyRate
    }, 0)

    // Estimated Labor Cost: for each employee, compute their total cost over
    // their full assignment period using working days × daily hours × hourly rate
    const estimatedLabor = project.assignments.reduce((sum, a) => {
        const hourlyRate = (a.user.monthlyCost ?? 0) / MONTHLY_HOURS
        const aStart = a.startDate
            ? new Date(a.startDate)
            : project.startDate ? new Date(project.startDate) : new Date()
        const aEnd = a.endDate
            ? new Date(a.endDate)
            : project.endDate ? new Date(project.endDate) : new Date()
        const workDays = countWorkingDays(aStart, aEnd)
        const dailyHrs = a.dailyHours ?? 8
        return sum + hourlyRate * dailyHrs * workDays
    }, 0)

    // Fixed Costs
    let fixedCostsAmount = project.totalFixedCost ?? 0
    if (project.paymentType === PaymentType.FIXED && project.fixedCostType === FixedCostType.MONTHLY) {
        if (project.startDate && project.endDate) {
            const start = new Date(project.startDate)
            const end = new Date(project.endDate)
            const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
            fixedCostsAmount = (project.totalFixedCost ?? 0) * Math.max(months, 1)
        }
    }

    const effectiveCost = effectiveLabor + fixedCostsAmount
    const estimatedCost = estimatedLabor + fixedCostsAmount

    // Revenue is the total price agreed with the client
    const revenue = project.totalProjectPrice ?? 0

    const effectiveMargin = revenue - effectiveCost
    const estimatedMargin = revenue - estimatedCost
    const effectiveRoi = revenue > 0 ? ((effectiveMargin / revenue) * 100).toFixed(1) : '0.0'
    const estimatedRoi = revenue > 0 ? ((estimatedMargin / revenue) * 100).toFixed(1) : '0.0'

    return { effectiveCost, estimatedCost, revenue, effectiveMargin, estimatedMargin, effectiveRoi, estimatedRoi }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ProjectStatus }) {
    const map: Record<ProjectStatus, { bg: string; text: string; border: string; label: string }> = {
        ACTIVE: { bg: '#DCFCE7', text: '#007A55', border: '#D0FAE5', label: 'Active' },
        PLANNED: { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', label: 'Planned' },
        ARCHIVED: { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0', label: 'Archived' },
    }
    const s = map[status] ?? map.PLANNED
    return (
        <span
            className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide border"
            style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
        >
            {s.label}
        </span>
    )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
    accent,
    title,
    children,
}: {
    accent: string
    title: string
    children: React.ReactNode
}) {
    return (
        <div
            className="flex-1 rounded-lg bg-white p-5 border border-[#E2E8F0]"
            style={{ borderLeft: `3px solid ${accent}` }}
        >
            <p className="text-xs font-medium text-[#6A7282] uppercase tracking-wide mb-3">{title}</p>
            {children}
        </div>
    )
}

// ─── Edit Project Modal ───────────────────────────────────────────────────────
function EditProjectModal({
    project,
    onClose,
    onSaved,
}: {
    project: Project
    onClose: () => void
    onSaved: () => void
}) {
    const [form, setForm] = useState({
        name: project.name,
        description: project.description ?? '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        paymentType: project.paymentType,
        totalProjectPrice: project.totalProjectPrice ?? '',
        fixedCostType: project.fixedCostType ?? '',
        totalFixedCost: project.totalFixedCost ?? '',
        status: project.status,
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }))

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            const body: any = {
                name: form.name,
                description: form.description || null,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                paymentType: form.paymentType,
                totalProjectPrice: form.totalProjectPrice ? Number(form.totalProjectPrice) : null,
                fixedCostType: form.fixedCostType || null,
                totalFixedCost: form.totalFixedCost ? Number(form.totalFixedCost) : null,
                status: form.status,
            }
            const res = await fetch(`/api/admin/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) throw new Error('Save failed')
            onSaved()
        } catch {
            setError('Failed to save changes.')
        } finally {
            setSaving(false)
        }
    }

    const inputCls = 'border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#0F172B] bg-white outline-none focus:border-[#4F39F6] w-full'
    const labelCls = 'text-xs text-[#6A7282] mb-1'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            {/* Modal */}
            <div
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] rounded-t-xl">
                    <h3 className="text-lg font-bold text-[#0F172B]">Edit Project</h3>
                    <button
                        onClick={onClose}
                        className="text-[#6A7282] hover:text-[#0F172B] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-4">
                    {/* Name */}
                    <div className="flex flex-col">
                        <label className={labelCls}>Project Name *</label>
                        <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col">
                        <label className={labelCls}>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            rows={3}
                            className={inputCls + ' resize-none'}
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <label className={labelCls}>Start Date</label>
                            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex flex-col">
                            <label className={labelCls}>End Date</label>
                            <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputCls} />
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col">
                        <label className={labelCls}>Status</label>
                        <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls}>
                            {Object.values(ProjectStatus).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Payment Type */}
                    <div className="flex flex-col">
                        <label className={labelCls}>Payment Type</label>
                        <select value={form.paymentType} onChange={(e) => set('paymentType', e.target.value)} className={inputCls}>
                            {Object.values(PaymentType).map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Price */}
                    <div className="flex flex-col">
                        <label className={labelCls}>Total Project Price (€)</label>
                        <input
                            type="number"
                            value={form.totalProjectPrice}
                            onChange={(e) => set('totalProjectPrice', e.target.value)}
                            className={inputCls}
                            placeholder="e.g. 12000"
                        />
                    </div>

                    {form.paymentType === PaymentType.FIXED && (
                        <>
                            {/* Fixed Cost Type */}
                            <div className="flex flex-col">
                                <label className={labelCls}>Fixed Cost Type</label>
                                <select value={form.fixedCostType} onChange={(e) => set('fixedCostType', e.target.value)} className={inputCls}>
                                    <option value="">None</option>
                                    {Object.values(FixedCostType).map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Total Fixed Cost */}
                            <div className="flex flex-col">
                                <label className={labelCls}>Total Fixed Cost (€)</label>
                                <input
                                    type="number"
                                    value={form.totalFixedCost}
                                    onChange={(e) => set('totalFixedCost', e.target.value)}
                                    className={inputCls}
                                    placeholder="e.g. 5000"
                                />
                            </div>
                        </>
                    )}

                    {error && <p className="text-sm text-[#B91C1C]">{error}</p>}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white z-10 flex justify-end gap-3 px-6 py-4 border-t border-[#E2E8F0] rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-medium text-[#6A7282] border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.name.trim()}
                        className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#4F39F6' }}
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Add-member form state
    const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>([])
    const [selectedUserId, setSelectedUserId] = useState('')
    const [dailyHours, setDailyHours] = useState<number>(8)
    const [assignmentStart, setAssignmentStart] = useState('')
    const [assignmentEnd, setAssignmentEnd] = useState('')
    const [addingMember, setAddingMember] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)

    const fetchProject = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin/projects/${id}`)
            if (!res.ok) throw new Error('Failed to load project')
            const data: Project = await res.json()
            setProject(data)
        } catch {
            setError('Could not load project data.')
        } finally {
            setLoading(false)
        }
    }, [id])

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/employees')
            if (res.ok) {
                const data: EmployeeOption[] = await res.json()
                setAllEmployees(data)
            }
        } catch { /* ignore */ }
    }, [])

    useEffect(() => {
        fetchProject()
        fetchEmployees()
    }, [fetchProject, fetchEmployees])

    const unassignedEmployees = allEmployees.filter(
        (emp) => !project?.assignments.some((a) => a.userId === emp.id),
    )

    const handleAddMember = async () => {
        if (!selectedUserId || !project) return
        setAddingMember(true)
        try {
            const body: any = { userId: selectedUserId, dailyHours }
            if (assignmentStart) body.startDate = assignmentStart
            if (assignmentEnd) body.endDate = assignmentEnd

            const res = await fetch(`/api/admin/projects/${project.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (res.ok) {
                setSelectedUserId('')
                setDailyHours(8)
                setAssignmentStart('')
                setAssignmentEnd('')
                await fetchProject()
            }
        } finally {
            setAddingMember(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!project) return
        setRemovingId(userId)
        try {
            await fetch(`/api/admin/projects/${project.id}/members?userId=${userId}`, {
                method: 'DELETE',
            })
            await fetchProject()
        } finally {
            setRemovingId(null)
        }
    }

    if (loading) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
                <div
                    className="animate-spin rounded-full border-4 border-t-transparent"
                    style={{ width: 40, height: 40, borderColor: '#4F39F6', borderTopColor: 'transparent' }}
                />
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
                <p className="text-[#B91C1C]">{error ?? 'Project not found'}</p>
            </div>
        )
    }

    const { effectiveCost, estimatedCost, revenue, effectiveMargin, estimatedMargin, effectiveRoi, estimatedRoi } = computeCosts(project)
    const totalWorkHours = project.timeLogs.reduce((s, l) => s + l.hours, 0)

    return (
        <div className="w-full min-h-screen" style={{ backgroundColor: '#F8FAFC', fontFamily: 'Arial, sans-serif' }}>
            <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8">

                {/* ── Back ── */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm text-[#6A7282] hover:text-[#0F172B] transition-colors w-fit"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Projects
                </button>

                {/* ── Header Card ── */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] px-6 py-5">
                    <div className="flex flex-col gap-5">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-[#0F172B] font-bold text-2xl">{project.name}</h1>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-[#6A7282] border border-[#E2E8F0] rounded-md px-3 py-1.5 hover:bg-[#F8FAFC] transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" />
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={() => router.push(`/admin/projects/${project.id}/gantt`)}
                                        className="flex items-center gap-1.5 text-xs font-medium text-[#4F39F6] border border-[#4F39F6]/30 rounded-md px-3 py-1.5 hover:bg-[#4F39F6]/5 transition-colors"
                                    >
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                            <path d="M9 17H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v4" />
                                            <path d="M9 11h6M9 8h10M4 12h5M13 17l3 3 5-5" />
                                        </svg>
                                        View Gantt
                                    </button>
                                </div>
                                {project.description && (
                                    <p className="text-sm text-[#6A7282]">{project.description}</p>
                                )}
                            </div>
                            <StatusBadge status={project.status} />
                        </div>

                        {/* Metadata grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 pt-4 border-t border-[#F1F5F9]">
                            {[
                                { label: 'Start Date', value: formatDate(project.startDate) },
                                { label: 'End Date', value: formatDate(project.endDate) },
                                { label: 'Duration', value: computeDuration(project.startDate, project.endDate) },
                                { label: 'Payment Type', value: project.paymentType === PaymentType.FIXED ? 'Fixed Price' : 'Hourly' },
                                {
                                    label: 'Price',
                                    value: revenue > 0 ? formatEuro(revenue) : '—',
                                },
                                { label: 'Owner', value: `${project.owner.name} ${project.owner.lastName}` },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex flex-col gap-0.5">
                                    <p className="text-xs text-[#6A7282]">{label}</p>
                                    <p className="text-sm font-semibold text-[#0F172B] truncate">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="flex gap-4 flex-col md:flex-row">
                    {/* Revenue */}
                    <StatCard accent="#4F39F6" title="Estimated Total Revenue">
                        <p className="text-2xl font-bold text-[#0F172B]">{formatEuro(revenue)}</p>
                    </StatCard>

                    {/* Costs */}
                    <StatCard accent="#EF4444" title="Project Costs">
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-xs text-[#6A7282] mb-0.5">Effective Total Cost</p>
                                <p className="text-xl font-bold text-[#0F172B]">{formatEuro(Math.round(effectiveCost))}</p>
                                <p className="text-xs text-[#6A7282]">Based on {totalWorkHours.toFixed(0)}h actually logged</p>
                            </div>
                            <div className="border-t border-[#E2E8F0]" />
                            <div>
                                <p className="text-xs text-[#6A7282] mb-0.5">Estimated Total Cost</p>
                                <p className="text-xl font-bold text-[#0F172B]">{formatEuro(Math.round(estimatedCost))}</p>
                                <p className="text-xs text-[#6A7282]">Full assignment duration × daily hours</p>
                            </div>
                        </div>
                    </StatCard>

                    {/* Margin */}
                    <StatCard accent="#10B981" title="Margin">
                        <div className="flex flex-col gap-3">
                            <div>
                                <p className="text-xs text-[#6A7282] mb-0.5">Effective Margin</p>
                                <p
                                    className="text-xl font-bold"
                                    style={{ color: effectiveMargin >= 0 ? '#007A55' : '#EF4444' }}
                                >
                                    {formatEuro(Math.round(effectiveMargin))}
                                </p>
                                <p className="text-xs text-[#6A7282]">ROI: {effectiveRoi}%</p>
                            </div>
                            <div className="border-t border-[#E2E8F0]" />
                            <div>
                                <p className="text-xs text-[#6A7282] mb-0.5">Estimated Margin</p>
                                <p
                                    className="text-xl font-bold"
                                    style={{ color: estimatedMargin >= 0 ? '#007A55' : '#EF4444' }}
                                >
                                    {formatEuro(Math.round(estimatedMargin))}
                                </p>
                                <p className="text-xs text-[#6A7282]">ROI: {estimatedRoi}%</p>
                            </div>
                        </div>
                    </StatCard>
                </div>

                {/* ── Team Section ── */}
                <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E2E8F0]">
                        <h2 className="text-base font-bold text-[#0F172B]">Team</h2>
                    </div>

                    {/* Add Member Form */}
                    <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC] flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[#6A7282]">Member</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#0F172B] bg-white outline-none focus:border-[#4F39F6] min-w-[200px]"
                            >
                                <option value="">Select employee…</option>
                                {unassignedEmployees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name} {emp.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[#6A7282]">Daily Hours</label>
                            <input
                                type="number"
                                min={1}
                                max={24}
                                value={dailyHours}
                                onChange={(e) => setDailyHours(Number(e.target.value))}
                                className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#0F172B] bg-white outline-none focus:border-[#4F39F6] w-24"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[#6A7282]">Start Date</label>
                            <input
                                type="date"
                                value={assignmentStart}
                                onChange={(e) => setAssignmentStart(e.target.value)}
                                min={project?.startDate?.split('T')[0] || ''}
                                max={project?.endDate?.split('T')[0] || ''}
                                className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#0F172B] bg-white outline-none focus:border-[#4F39F6] w-36"
                                placeholder="Optional"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs text-[#6A7282]">End Date</label>
                            <input
                                type="date"
                                value={assignmentEnd}
                                onChange={(e) => setAssignmentEnd(e.target.value)}
                                min={assignmentStart || project?.startDate?.split('T')[0] || ''}
                                max={project?.endDate?.split('T')[0] || ''}
                                className="border border-[#E2E8F0] rounded-md px-3 py-2 text-sm text-[#0F172B] bg-white outline-none focus:border-[#4F39F6] w-36"
                                placeholder="Optional"
                            />
                        </div>

                        <button
                            onClick={handleAddMember}
                            disabled={!selectedUserId || addingMember}
                            className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-50"
                            style={{ backgroundColor: '#0F172B' }}
                        >
                            {addingMember ? 'Adding…' : 'Add Member'}
                        </button>
                    </div>

                    {/* Team Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                                    {['Name', 'Role', 'Daily Hours', 'Dates', 'Monthly Cost', 'Actions'].map((h) => (
                                        <th
                                            key={h}
                                            className="text-left px-6 py-3 text-xs font-normal text-[#6A7282] uppercase tracking-[0.6px]"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {project.assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-[#6A7282] italic">
                                            No team members assigned yet.
                                        </td>
                                    </tr>
                                ) : (
                                    project.assignments.map((a) => (
                                        <tr
                                            key={a.id}
                                            className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-[#0F172B]">
                                                {a.user.name} {a.user.lastName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#016630] text-xs font-bold">
                                                    {a.user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#0F172B] font-medium">
                                                {a.dailyHours}h / day
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#6A7282]">
                                                {a.startDate || a.endDate ? (
                                                    <>
                                                        {a.startDate ? formatDate(a.startDate) : 'Start'}
                                                        {' – '}
                                                        {a.endDate ? formatDate(a.endDate) : 'End'}
                                                    </>
                                                ) : (
                                                    'Project Duration'
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#6A7282]">
                                                {a.user.monthlyCost ? formatEuro(a.user.monthlyCost) : '—'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleRemoveMember(a.userId)}
                                                    disabled={removingId === a.userId}
                                                    className="text-sm font-medium text-[#E7000B] hover:text-red-800 transition-colors disabled:opacity-50"
                                                >
                                                    {removingId === a.userId ? 'Removing…' : 'Remove'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* ── Edit Modal ── */}
            {showEditModal && (
                <EditProjectModal
                    project={project}
                    onClose={() => setShowEditModal(false)}
                    onSaved={() => {
                        setShowEditModal(false)
                        fetchProject()
                    }}
                />
            )}
        </div>
    )
}
