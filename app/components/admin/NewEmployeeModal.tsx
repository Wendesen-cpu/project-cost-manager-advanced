'use client'

import { useState, useEffect, useRef } from 'react'

interface NewEmployeeModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated: () => void
}

const ROLES = ['EMPLOYEE', 'ADMIN'] as const

export default function NewEmployeeModal({ isOpen, onClose, onCreated }: NewEmployeeModalProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    // Detect requester role (mock-auth)
    const [requesterRole, setRequesterRole] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            const cookies = document.cookie.split('; ')
            const roleCookie = cookies.find(row => row.startsWith('mock-role='))
            setRequesterRole(roleCookie ? roleCookie.split('=')[1] : null)
        }
    }, [isOpen])

    const [form, setForm] = useState({
        name: '',
        lastName: '',
        email: '',
        password: '',
        monthlyCost: '',
        remainingVacationDays: '',
        role: 'EMPLOYEE'
    })

    const isSystemAdmin = requesterRole === 'SYSTEM_ADMIN'

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
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/admin/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || 'Failed to create employee')
            }
            onCreated()
            onClose()
            setForm({
                name: '', lastName: '', email: '', password: '',
                monthlyCost: '', remainingVacationDays: '', role: 'EMPLOYEE',
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(15,23,43,0.6)', backdropFilter: 'blur(2px)' }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
                style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
            >
                {/* Header */}
                <div
                    className="flex shrink-0 items-center justify-between px-7 py-5 border-b border-[#F1F5F9]"
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="flex items-center justify-center size-9 rounded-xl"
                            style={{ background: 'linear-gradient(45deg, #009966 0%, #00CC88 100%)' }}
                        >
                            {/* Simple user plus icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="8.5" cy="7" r="4"></circle>
                                <line x1="20" y1="8" x2="20" y2="14"></line>
                                <line x1="23" y1="11" x2="17" y2="11"></line>
                            </svg>
                        </div>
                        <div>
                            <h2
                                className="text-[#0F172B] font-bold text-lg leading-6"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                New Employee
                            </h2>
                            <p
                                className="text-[#6A7282] text-xs leading-4"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                Add a new member to the team
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

                {/* Scrollable Body */}
                <div className="overflow-y-auto w-full">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-7 py-6">
                        {/* Error */}
                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>First Name <Required /></label>
                                <input
                                    required
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. John"
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className={labelClass}>Last Name <Required /></label>
                                <input
                                    required
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                    placeholder="e.g. Doe"
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Email Address <Required /></label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="name@company.com"
                                className={inputClass}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>Password <Required /></label>
                            <input
                                required
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={inputClass}
                            />
                        </div>

                        {/* ── Employee Details ── */}
                        <div
                            className="flex flex-col gap-4 rounded-xl border border-[#E5E7EB] p-4 mt-2"
                            style={{ backgroundColor: '#F8FAFC' }}
                        >
                            {isSystemAdmin && (
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass}>System Role <Required /></label>
                                    <select
                                        required
                                        name="role"
                                        value={form.role}
                                        onChange={handleChange}
                                        className={inputClass}
                                        style={{ backgroundColor: '#FFFFFF' }}
                                    >
                                        <option value="EMPLOYEE">EMPLOYEE</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass}>Monthly Cost (€) <Required /></label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        name="monthlyCost"
                                        value={form.monthlyCost}
                                        onChange={handleChange}
                                        placeholder="e.g. 4000"
                                        className={inputClass}
                                        style={{ backgroundColor: '#FFFFFF' }}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className={labelClass}>Vacation Days <Required /></label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        name="remainingVacationDays"
                                        value={form.remainingVacationDays}
                                        onChange={handleChange}
                                        placeholder="e.g. 25"
                                        className={inputClass}
                                        style={{ backgroundColor: '#FFFFFF' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-[#E5E7EB]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#6A7282] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors border border-[#E5E7EB]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="relative px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 flex items-center gap-2"
                                style={{
                                    background: 'linear-gradient(45deg, #009966 0%, #00CC88 100%)',
                                    boxShadow: '0px 10px 15px -3px rgba(0,204,136,0.2), 0px 4px 6px -4px rgba(0,204,136,0.2)',
                                    fontFamily: 'Arial, sans-serif',
                                }}
                            >
                                {loading && (
                                    <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                Add Employee
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

// Shared styles
const labelClass = 'text-[#4B5563] font-bold text-xs uppercase tracking-[0.5px] leading-4'
const inputClass =
    'w-full rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#0F172B] placeholder-[#9CA3AF] outline-none focus:border-[#009966] focus:ring-2 focus:ring-[#009966]/20 transition-all'

function Required() {
    return <span className="text-red-500 ml-0.5">*</span>
}
