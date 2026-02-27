'use client'

import { useState, useEffect, useRef } from 'react'
import { Shield, UserPlus, UserCircle, X, Check, Loader2 } from 'lucide-react'
import { useLanguage } from '@/app/i18n'

interface EmployeeModalProps {
    isOpen: boolean
    employeeId?: string | null // If provided, we are in EDIT mode
    onClose: () => void
    onSuccess: () => void
}

export default function EmployeeModal({ isOpen, employeeId, onClose, onSuccess }: EmployeeModalProps) {
    const { t } = useLanguage()
    const isEdit = !!employeeId
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const overlayRef = useRef<HTMLDivElement>(null)

    // Detect requester role (mock-auth)
    const [requesterRole, setRequesterRole] = useState<string | null>(null)

    const [form, setForm] = useState({
        name: '',
        lastName: '',
        email: '',
        password: '', // Only used/required in create mode or passed empty
        monthlyCost: '',
        remainingVacationDays: '',
        role: 'EMPLOYEE'
    })

    useEffect(() => {
        if (isOpen) {
            const cookies = document.cookie.split('; ')
            const roleCookie = cookies.find(row => row.startsWith('mock-role='))
            const role = roleCookie ? roleCookie.split('=')[1] : null
            setRequesterRole(role)

            if (isEdit) {
                fetchEmployeeData(employeeId!)
            } else {
                setForm({
                    name: '', lastName: '', email: '', password: '',
                    monthlyCost: '', remainingVacationDays: '', role: 'EMPLOYEE'
                })
            }
        }
    }, [isOpen, isEdit, employeeId])

    const fetchEmployeeData = async (id: string) => {
        setFetching(true)
        setError(null)
        try {
            const res = await fetch(`/api/admin/employees/${id}`)
            if (!res.ok) throw new Error('Failed to fetch user data')
            const data = await res.json()
            setForm({
                name: data.name,
                lastName: data.lastName,
                email: data.email,
                password: '', // Don't fetch password
                monthlyCost: data.monthlyCost?.toString() || '',
                remainingVacationDays: data.remainingVacationDays?.toString() || '',
                role: data.role
            })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setFetching(false)
        }
    }

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose()
    }

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        if (isOpen) document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const url = isEdit ? `/api/admin/employees/${employeeId}` : '/api/admin/employees'
        const method = isEdit ? 'PUT' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.error || `Failed to ${isEdit ? 'update' : 'create'} user`)
            }
            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const isSystemAdmin = requesterRole === 'SYSTEM_ADMIN'
    const modalTitle = isEdit ? t('employees.editUser') : t('employees.newUser')
    const modalSubtitle = isEdit ? t('employees.updateAccountDetails') : t('employees.addNewMember')
    const Icon = isEdit ? <UserCircle className="text-white size-5" /> : <UserPlus className="text-white size-5" />

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172B]/60 backdrop-blur-[2px]"
        >
            <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between px-8 py-6 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-[#0F172B] flex items-center justify-center shadow-lg rotate-3">
                            {Icon}
                        </div>
                        <div>
                            <h2 className="text-[#0F172B] font-bold text-xl tracking-tight leading-none mb-1.5">
                                {modalTitle}
                            </h2>
                            <p className="text-[#64748B] text-xs font-medium">
                                {modalSubtitle}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-xl hover:bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] hover:text-[#0F172B] transition-all">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Form Container */}
                <div className="overflow-y-auto w-full">
                    {fetching ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="animate-spin text-[#0F172B] size-8 opacity-20" />
                            <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest">{t('employees.loadingDetails')}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={labelClass}>{t('employees.firstName')} <Required /></label>
                                    <input required name="name" value={form.name} onChange={handleChange} placeholder={t('employees.firstNamePlaceholder')} className={inputClass} />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelClass}>{t('employees.lastName')} <Required /></label>
                                    <input required name="lastName" value={form.lastName} onChange={handleChange} placeholder={t('employees.lastNamePlaceholder')} className={inputClass} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={labelClass}>{t('employees.emailAddress')} <Required /></label>
                                <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder={t('employees.emailPlaceholder')} className={inputClass} />
                            </div>

                            {!isEdit && (
                                <div className="space-y-2">
                                    <label className={labelClass}>{t('employees.password')} <Required /></label>
                                    <input required type="password" name="password" value={form.password} onChange={handleChange} placeholder={t('employees.passwordPlaceholder')} className={inputClass} />
                                </div>
                            )}

                            <div className="p-6 bg-[#F8FAFC] rounded-[24px] border border-[#F1F5F9] space-y-6">
                                {isSystemAdmin && (
                                    <div className="space-y-2">
                                        <label className={labelClass}>{t('employees.systemRole')} <Required /></label>
                                        <div className="relative">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8]" />
                                            <select
                                                required
                                                name="role"
                                                value={form.role}
                                                onChange={handleChange}
                                                className={`${inputClass} pl-11 bg-white`}
                                            >
                                                <option value="EMPLOYEE">{t('employees.roleEmployee')}</option>
                                                <option value="ADMIN">{t('employees.roleAdmin')}</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={labelClass}>{t('employees.monthlyCost')} <Required /></label>
                                        <input required type="number" min="0" step="0.01" name="monthlyCost" value={form.monthlyCost} onChange={handleChange} placeholder={t('employees.monthlyCostPlaceholder')} className={`${inputClass} bg-white`} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelClass}>{t('employees.vacationDaysLabel')} <Required /></label>
                                        <input required type="number" min="0" name="remainingVacationDays" value={form.remainingVacationDays} onChange={handleChange} placeholder={t('employees.vacationDaysPlaceholder')} className={`${inputClass} bg-white`} />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4">
                                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl text-sm font-bold text-[#64748B] hover:bg-[#F1F5F9] transition-all">
                                    {t('employees.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 rounded-2xl bg-[#0F172B] text-white text-sm font-bold shadow-lg shadow-slate-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin size-4" /> : <Check className="size-4" />}
                                    {isEdit ? t('employees.saveChanges') : t('employees.createUser')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

const labelClass = 'text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest ml-1'
const inputClass = 'w-full px-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#0F172B] transition-all placeholder:text-[#CBD5E1]'

function Required() { return <span className="text-red-500 ml-0.5">*</span> }
