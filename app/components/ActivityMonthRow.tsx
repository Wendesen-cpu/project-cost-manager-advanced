'use client'

import React, { useState } from 'react'
import clsx from 'clsx'
import { Calendar, ChevronDown, Trash2, CheckCircle2, Palmtree } from 'lucide-react'
import { usePortalData, type TimeLogWithProject } from '../portal/PortalDataProvider'
import { useLanguage } from '../i18n'

interface ActivityMonthRowProps {
    month: string           // e.g. "APRIL 2026"
    totalHours: number
    workHours: number
    vacationHours: number
    logs: TimeLogWithProject[]  // All logs for this month
    isLast?: boolean
}

export default function ActivityMonthRow({
    month,
    totalHours,
    workHours,
    vacationHours,
    logs,
    isLast = false,
}: ActivityMonthRowProps) {
    const [expanded, setExpanded] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const { deleteLog, refreshData } = usePortalData()
    const { t } = useLanguage()

    const handleDelete = async (log: TimeLogWithProject) => {
        if (deletingId) return
        setDeletingId(log.id)
        try {
            const res = await fetch(`/api/employee/time-logs/${log.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            deleteLog(log.id)
            // If it's vacation, refresh to get updated remaining days
            if (log.type === 'VACATION') {
                await refreshData()
            }
        } catch (err) {
            console.error('Failed to delete log:', err)
        } finally {
            setDeletingId(null)
        }
    }

    const formatDate = (dateVal: Date | string) => {
        const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal
        const dd = String(d.getUTCDate()).padStart(2, '0')
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
        const yyyy = d.getUTCFullYear()
        return `${dd}/${mm}/${yyyy}`
    }

    // Sort logs newest first
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className={clsx('w-full', !isLast && 'border-b border-[#F1F5F9]')}>
            {/* ── ACCORDION HEADER ── */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-6 py-5 hover:bg-gray-50/50 transition-colors"
            >
                {/* Left: calendar icon + month label */}
                <div className="flex items-center gap-3">
                    <div className="flex p-2 rounded-lg bg-[#EFF6FF] shrink-0">
                        <Calendar className="size-[18px] text-[#155DFC]" />
                    </div>
                    <span
                        className="text-[12px] font-bold uppercase tracking-[-0.3px] text-[#314158] leading-4"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        {month}
                    </span>
                </div>

                {/* Right: hours summary + chevron */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-0.5">
                        {/* Total hours */}
                        <div className="flex items-baseline gap-1">
                            <span
                                className="text-[18px] font-bold text-[#0F172B] leading-7"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {totalHours}
                            </span>
                            <span
                                className="text-[10px] font-bold uppercase text-[#90A1B9] leading-[13px] tracking-[1px]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {t('employeeDashboard.hrs')}
                            </span>
                        </div>
                        {/* Work / Vacation breakdown */}
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[9px] font-bold text-[#2B7FFF] uppercase leading-3 tracking-[-0.3px]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {workHours}H {t('employeeDashboard.logWorKHoursInShort').toUpperCase()}
                            </span>
                            <span
                                className="text-[9px] font-bold text-[#FF6900] uppercase leading-3 tracking-[-0.3px]"
                                style={{ fontFamily: 'Arial, sans-serif' }}
                            >
                                {vacationHours}H {t('employeeDashboard.vacation').toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <ChevronDown
                        className={clsx(
                            'size-[18px] text-[#62748E] transition-transform duration-200',
                            expanded && 'rotate-180'
                        )}
                    />
                </div>
            </button>

            {/* ── EXPANDED LOG LIST ── */}
            {expanded && (
                <div className="ml-2 border-l border-[#F1F5F9] animate-in slide-in-from-top-2 fade-in duration-200">
                    {sortedLogs.length === 0 ? (
                        <div className="px-6 py-4 text-sm text-[#90A1B9]">{t('employeeDashboard.noActivity')}</div>
                    ) : (
                        sortedLogs.map((log) => {
                            const isVacation = log.type === 'VACATION'
                            const isDeleting = deletingId === log.id

                            return (
                                <div
                                    key={log.id}
                                    className={clsx(
                                        'flex items-center justify-between px-4 py-4 border-b border-[#F8FAFC] last:border-b-0 transition-colors',
                                        isVacation ? 'bg-orange-50/40 hover:bg-orange-50/60' : 'hover:bg-[#F8FAFC]/80'
                                    )}
                                >
                                    {/* Left: icon + title + date */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Icon */}
                                        <div
                                            className={clsx(
                                                'flex items-center justify-center size-10 rounded-xl shrink-0 shadow-sm',
                                                isVacation
                                                    ? 'bg-orange-100 border border-orange-200'
                                                    : 'bg-white border border-[#E8F0FE] shadow-[0px_1px_4px_0px_rgba(21,93,252,0.08)]'
                                            )}
                                        >
                                            {isVacation ? (
                                                <Palmtree className="size-5 text-[#FF6900]" />
                                            ) : (
                                                <CheckCircle2 className="size-5 text-[#155DFC]" />
                                            )}
                                        </div>

                                        {/* Text */}
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <span
                                                className={clsx(
                                                    'text-[13px] font-bold leading-4 truncate',
                                                    isVacation ? 'text-[#FF6900]' : 'text-[#0F172B]'
                                                )}
                                                style={{ fontFamily: 'Arial, sans-serif' }}
                                            >
                                                {isVacation ? t('employeeDashboard.vacation') : (log.project?.name ?? 'Unknown Project')}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="size-[10px] text-[#90A1B9] shrink-0" />
                                                <span
                                                    className="text-[11px] font-medium text-[#90A1B9] leading-4"
                                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                                >
                                                    {formatDate(log.date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: hours/days + delete */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        {isVacation ? (
                                            <span
                                                className="text-[11px] font-bold text-[#FF6900] uppercase tracking-[-0.3px]"
                                                style={{ fontFamily: 'Arial, sans-serif' }}
                                            >
                                                -{log.hours / 8} {log.hours / 8 !== 1 ? t('employeeDashboard.days') : t('employeeDashboard.days').replace(/s$/i, '')}
                                            </span>
                                        ) : (
                                            <div className="flex items-baseline gap-0.5">
                                                <span
                                                    className="text-[18px] font-bold text-[#0F172B] leading-7"
                                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                                >
                                                    {log.hours}
                                                </span>
                                                <span
                                                    className="text-[10px] font-bold text-[#90A1B9] uppercase leading-4 tracking-[1px]"
                                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                                >
                                                    {t('employeeDashboard.hrs')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Delete button */}
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(log) }}
                                            disabled={isDeleting}
                                            title="Delete log"
                                            className={clsx(
                                                'flex items-center justify-center size-8 rounded-lg transition-all',
                                                isDeleting
                                                    ? 'opacity-40 cursor-not-allowed'
                                                    : 'hover:bg-red-50 hover:text-red-500 text-[#CBD5E1] hover:scale-105 active:scale-95'
                                            )}
                                        >
                                            {isDeleting ? (
                                                <span className="size-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}
