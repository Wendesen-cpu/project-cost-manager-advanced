'use client'

import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '@/app/i18n'

interface Employee {
    id: string
    name: string
    lastName: string
}

interface NewProjectModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated: () => void
}

const PAYMENT_TYPES = ['HOURLY', 'FIXED'] as const
const FIXED_COST_TYPES = ['TOTAL', 'MONTHLY'] as const
const PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'ARCHIVED'] as const

export default function NewProjectModal({ isOpen, onClose, onCreated }: NewProjectModalProps) {
    const { t } = useLanguage()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    const [form, setForm] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        paymentType: 'HOURLY' as (typeof PAYMENT_TYPES)[number],
        totalProjectPrice: '',
        fixedCostType: '' as '' | (typeof FIXED_COST_TYPES)[number],
        totalFixedCost: '',
        status: 'PLANNED' as (typeof PROJECT_STATUSES)[number],
        ownerId: '',
    })

    // Fetch employees for the owner dropdown
    useEffect(() => {
        if (!isOpen) return
        fetch('/api/admin/employees')
            .then((r) => r.json())
            .then(setEmployees)
            .catch(() => { })
    }, [isOpen])

    // Close on overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose()
    }

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (isOpen) document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    description: form.description || null,
                    startDate: form.startDate || null,
                    endDate: form.endDate || null,
                    paymentType: form.paymentType,
                    totalProjectPrice: form.totalProjectPrice ? parseFloat(form.totalProjectPrice) : null,
                    fixedCostType: form.fixedCostType || null,
                    totalFixedCost: form.totalFixedCost ? parseFloat(form.totalFixedCost) : null,
                    status: form.status,
                    ownerId: form.ownerId,
                }),
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Failed to create project')
            }
            onCreated()
            onClose()
            setForm({
                name: '', description: '', startDate: '', endDate: '',
                paymentType: 'HOURLY', totalProjectPrice: '', fixedCostType: '',
                totalFixedCost: '', status: 'PLANNED', ownerId: '',
            })
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(15,23,43,0.6)', backdropFilter: 'blur(2px)' }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
                style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-7 py-5 border-b border-[#F1F5F9]"
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center size-9 rounded-xl"
                            style={{ background: 'linear-gradient(45deg, #155DFC 0%, #4F39F6 100%)' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <h2
                                className="text-[#0F172B] font-bold text-lg leading-6"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {t('projects.newProjectTitle')}
                            </h2>
                            <p
                                className="text-[#6A7282] text-xs leading-4"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {t('projects.fillDetails')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center size-8 rounded-lg hover:bg-[#F1F5F9] transition-colors text-[#6A7282] hover:text-[#0F172B]"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-7 py-6">
                    {/* Error */}
                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>{t('projects.nameLabel')} <Required /></label>
                        <input
                            required
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder={t('projects.namePlaceholder')}
                            className={inputClass}
                        />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className={labelClass}>{t('projects.description')}</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder={t('projects.descriptionPlaceholder')}
                            rows={3}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>{t('projects.startDate')}</label>
                            <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>{t('projects.endDate')}</label>
                            <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>

                    {/* Status + Owner */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>{t('projects.status')} <Required /></label>
                            <select required name="status" value={form.status} onChange={handleChange} className={inputClass}>
                                {PROJECT_STATUSES.map((s) => {
                                    const statusKey = `projects.status${s.charAt(0) + s.slice(1).toLowerCase()}`
                                    return (
                                        <option key={s} value={s}>{t(statusKey)}</option>
                                    )
                                })}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>{t('projects.projectOwner')} <Required /></label>
                            <select required name="ownerId" value={form.ownerId} onChange={handleChange} className={inputClass}>
                                <option value="">{t('projects.selectOwner')}</option>
                                {employees.map((e) => (
                                    <option key={e.id} value={e.id}>{e.name} {e.lastName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* ── Payment Type ──────────────────────────────── */}
                    <div
                        className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] p-4"
                        style={{ backgroundColor: '#F8FAFC' }}
                    >
                        <label className={labelClass}>{t('projects.paymentType')} <Required /></label>

                        {/* Radio cards */}
                        <div className="flex gap-3">
                            {([
                                { value: 'HOURLY', label: t('projects.hourlyOption') },
                                { value: 'FIXED', label: t('projects.fixedPriceOption') },
                            ] as const).map(({ value, label }) => {
                                const active = form.paymentType === value
                                return (
                                    <label
                                        key={value}
                                        className="flex flex-1 items-center gap-2.5 cursor-pointer rounded-xl border px-4 py-3 transition-all"
                                        style={{
                                            borderColor: active ? '#155DFC' : '#E5E7EB',
                                            backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                                            boxShadow: active ? '0 0 0 2px rgba(21,93,252,0.15)' : 'none',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentType"
                                            value={value}
                                            checked={active}
                                            onChange={handleChange}
                                            className="accent-[#155DFC] size-4 shrink-0"
                                        />
                                        <span
                                            className="font-bold text-sm"
                                            style={{
                                                fontFamily: 'Arial, sans-serif',
                                                color: active ? '#155DFC' : '#4B5563',
                                            }}
                                        >
                                            {label}
                                        </span>
                                    </label>
                                )
                            })}
                        </div>

                        {/* Dynamic value input */}
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>
                                {form.paymentType === 'HOURLY'
                                    ? t('projects.hourlyRate')
                                    : t('projects.fixedProjectPrice')}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                name="totalProjectPrice"
                                value={form.totalProjectPrice}
                                onChange={handleChange}
                                placeholder={form.paymentType === 'HOURLY' ? t('projects.hourlyRatePlaceholder') : t('projects.fixedProjectPricePlaceholder')}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* ── Fixed Cost Structure ─────────────────────── */}
                    <div
                        className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] p-4"
                        style={{ backgroundColor: '#F8FAFC' }}
                    >
                        <label className={labelClass}>{t('projects.fixedCostType')} <Required /></label>

                        {/* Radio cards */}
                        <div className="flex gap-3">
                            {([
                                { value: 'TOTAL', label: t('projects.totalFixedCostOption'), hint: t('projects.onTimeCost') },
                                { value: 'MONTHLY', label: t('projects.monthlyFixedCostOption'), hint: t('projects.perMonthCost') },
                            ] as const).map(({ value, label, hint }) => {
                                const active = form.fixedCostType === value
                                return (
                                    <label
                                        key={value}
                                        className="flex flex-1 flex-col gap-0.5 cursor-pointer rounded-xl border px-4 py-3 transition-all"
                                        style={{
                                            borderColor: active ? '#155DFC' : '#E5E7EB',
                                            backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                                            boxShadow: active ? '0 0 0 2px rgba(21,93,252,0.15)' : 'none',
                                        }}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <input
                                                type="radio"
                                                name="fixedCostType"
                                                value={value}
                                                checked={active}
                                                onChange={handleChange}
                                                className="accent-[#155DFC] size-4 shrink-0"
                                                required // Always required now since it's independent
                                            />
                                            <span
                                                className="font-bold text-sm"
                                                style={{
                                                    fontFamily: 'Arial, sans-serif',
                                                    color: active ? '#155DFC' : '#4B5563',
                                                }}
                                            >
                                                {label}
                                            </span>
                                        </div>
                                        <span
                                            className="pl-[26px] text-xs"
                                            style={{
                                                fontFamily: 'Arial, sans-serif',
                                                color: active ? '#6A7282' : '#9CA3AF',
                                            }}
                                        >
                                            {hint}
                                        </span>
                                    </label>
                                )
                            })}
                        </div>

                        {/* Dynamic value input — only shown once a type is chosen */}
                        {form.fixedCostType && (
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>
                                    {form.fixedCostType === 'TOTAL'
                                        ? t('projects.totalFixedCostAmount')
                                        : t('projects.monthlyFixedCostAmount')}
                                    {' '}<Required />
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    name="totalFixedCost"
                                    value={form.totalFixedCost}
                                    onChange={handleChange}
                                    placeholder={
                                        form.fixedCostType === 'TOTAL'
                                            ? t('projects.totalFixedCostPlaceholder')
                                            : t('projects.monthlyFixedCostPlaceholder')
                                    }
                                    className={inputClass}
                                    required // Always required if the type is set
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#6A7282] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors border border-[#E5E7EB]"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            {t('projects.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 flex items-center gap-2"
                            style={{
                                background: 'linear-gradient(45deg, #155DFC 0%, #4F39F6 100%)',
                                boxShadow: '0px 10px 15px -3px rgba(43,127,255,0.2), 0px 4px 6px -4px rgba(43,127,255,0.2)',
                                fontFamily: 'Arial, sans-serif',
                            }}
                        >
                            {loading && (
                                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            )}
                            {t('projects.createProject')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Shared styles
const labelClass = 'text-[#4B5563] font-bold text-xs uppercase tracking-[0.5px] leading-4'
const inputClass =
    'w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#0F172B] placeholder-[#9CA3AF] outline-none focus:border-[#155DFC] focus:ring-2 focus:ring-[#155DFC]/20 transition-all'

function Required() {
    return <span className="text-red-500 ml-0.5">*</span>
}
