'use client'

import React, { useState } from 'react'
import clsx from 'clsx'
import { Trees, Plus, X } from 'lucide-react'
import type { TimeLog } from '@/lib/generated/prisma'

interface CalendarDayCellProps {
    day: number | null        // null = padding cell (outside month)
    isToday?: boolean
    isOtherMonth?: boolean
    logs?: (TimeLog & { project?: { name: string } })[]
    year?: number
    month?: number
    onAddLogClick?: (date: Date) => void
    onDeleteLog?: (logId: string) => void
}

export default function CalendarDayCell({ day, isToday, isOtherMonth, logs = [], year, month, onAddLogClick, onDeleteLog }: CalendarDayCellProps) {
    const workLogs = logs.filter(l => l.type === 'WORK')
    const [isHovering, setIsHovering] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (logId: string) => {
        if (!confirm('Are you sure you want to delete this log?')) return
        
        setDeletingId(logId)
        try {
            const res = await fetch(`/api/employee/time-logs/${logId}`, {
                method: 'DELETE'
            })
            if (!res.ok) throw new Error('Failed to delete')
            onDeleteLog?.(logId)
        } catch (err) {
            console.error(err)
            alert('Error deleting log')
        } finally {
            setDeletingId(null)
        }
    }

    const handleAddClick = () => {
        if (day && year !== undefined && month !== undefined) {
            const date = new Date(year, month, day)
            onAddLogClick?.(date)
        }
    }

    return (
        <div
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={clsx(
                'flex flex-col gap-1 pt-2 pb-2 px-2 border-b border-r border-[#F1F5F9] min-h-[100px] relative transition-colors',
                isHovering && !isOtherMonth && 'bg-[#F8FAFC]',
                isOtherMonth && 'opacity-40 bg-[rgba(248,250,252,0.3)]'
            )}
        >
            {day !== null && (
                <>
                    {/* Day number header with + button */}
                    <div className="flex items-center justify-between">
                        <div
                            className={clsx(
                                'flex items-center justify-center size-6 rounded-full text-[12px] leading-4',
                                isToday
                                    ? 'bg-[#155DFC] text-white font-bold'
                                    : 'text-[#62748E] font-bold'
                            )}
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            {day}
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Hours badge (summary) */}
                            {workLogs.length > 0 && (
                                <span
                                    className="bg-[#EFF6FF] text-[#155DFC] text-[10px] font-bold px-[6px] py-[2px] rounded-md leading-[15px]"
                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                >
                                    {workLogs.reduce((sum, l) => sum + l.hours, 0)}h
                                </span>
                            )}
                            {/* Add button (appears on hover) */}
                            {isHovering && !isOtherMonth && (
                                <button
                                    onClick={handleAddClick}
                                    className="text-[#155DFC] hover:text-[#1250E6] transition-colors"
                                    title="Add work log or vacation"
                                >
                                    <Plus className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Event chips */}
                    {logs.map((log, i) => {
                        if (log.type === 'VACATION') {
                            return (
                                <div
                                    key={i}
                                    className="flex items-center justify-between gap-1 bg-[#FFF7ED] border border-[#FFEDD5] rounded-[4px] px-[5px] py-[3px] overflow-hidden w-full mt-1 group"
                                    title={`Vacation - ${log.hours}h`}
                                >
                                    <div className="flex items-center gap-1 min-w-0">
                                        <Trees className="size-[10px] text-[#EA580C] shrink-0" />
                                        <span
                                            className="text-[9px] font-bold text-[#EA580C] truncate leading-[11.25px] min-w-0"
                                            style={{ fontFamily: 'Arial, sans-serif' }}
                                        >
                                            Vacation
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        disabled={deletingId === log.id}
                                        className="shrink-0 text-[#EA580C]/60 hover:text-[#EA580C] transition-colors disabled:opacity-50 ml-1"
                                        title="Delete"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            )
                        }

                        // Work Log
                        return (
                            <div
                                key={i}
                                className="flex items-center justify-between gap-1 bg-[#EFF6FF] border border-[rgba(219,234,254,0.5)] rounded-[4px] px-[5px] py-[3px] overflow-hidden w-full group"
                                title={`${log.project?.name || 'Unknown Project'} - ${log.hours}h`}
                            >
                                <span
                                    className="text-[9px] text-[#1447E6] truncate leading-[11.25px] min-w-0"
                                    style={{ fontFamily: 'Arial, sans-serif' }}
                                >
                                    {log.project?.name || 'Unknown Project'}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                    <span
                                        className="text-[9px] font-bold text-[#1447E6] leading-[11.25px]"
                                        style={{ fontFamily: 'Arial, sans-serif' }}
                                    >
                                        {log.hours}h
                                    </span>
                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        disabled={deletingId === log.id}
                                        className="shrink-0 text-[#1447E6]/60 hover:text-[#1447E6] transition-colors disabled:opacity-50 ml-1"
                                        title="Delete"
                                    >
                                        <X className="size-3" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </>
            )}
        </div>
    )
}
