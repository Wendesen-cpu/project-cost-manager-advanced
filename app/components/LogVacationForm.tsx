'use client'

import React, { useState } from 'react'
import { usePortalData } from '../portal/PortalDataProvider'
import { useLanguage } from '../i18n'

export default function LogVacationForm() {
    const { user, refreshData } = usePortalData()
    const { t } = useLanguage()
    const today = new Date().toISOString().split('T')[0]

    const [date, setDate] = useState(today)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            const res = await fetch('/api/employee/time-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    date,
                    hours: 8, // Using 8 hours to represent 1 vacation day
                    type: 'VACATION'
                })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to log vacation')
            }

            await refreshData()
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Error logging vacation. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4 max-w-[302px]"
        >
            {/* Date Field */}
            <div className="flex flex-col gap-1 w-full">
                <label
                    className="text-[14px] text-[#314158] leading-5"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {t('common.date')}
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-md border border-[#CAD5E2] px-[13px] py-[9px] text-[16px] text-[#171717] outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-md bg-[#16A34A] px-4 py-2 hover:bg-[#16A34A]/90 transition-colors disabled:opacity-50"
            >
                <span
                    className="text-[16px] text-white leading-6"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {loading ? t('common.logging') : t('common.logVacation')}
                </span>
            </button>

            {/* Note */}
            <p
                className="text-[12px] text-[#64748B] leading-5"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                {t('common.vacationNote')}
            </p>
        </form>
    )
}
