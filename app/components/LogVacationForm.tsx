'use client'

import React, { useState } from 'react'
import { usePortalData } from '../portal/PortalDataProvider'
import { useLanguage } from '../i18n'
import { logVacation } from '../actions/timelogs'

export default function LogVacationForm() {
    const { user, addLog, updateUser } = usePortalData()
    const { t } = useLanguage()
    const today = new Date().toISOString().split('T')[0]

    const [date, setDate] = useState(today)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setError('')
        setLoading(true)
        try {
            const result = await logVacation({
                userId: user.id,
                date,
                hours: 8,
            })

            if (result.conflict) {
                setError(result.message || 'A vacation is already logged for this date.')
                return
            }

            if ('error' in result && result.error) {
                throw new Error(result.error as string)
            }

            if (result.log) {
                addLog(result.log)
                // Optimistically update vacation days balance
                updateUser({
                    ...user,
                    remainingVacationDays: (user.remainingVacationDays || 0) - 1,
                })
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Error logging vacation. Please try again.')
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

            {/* Error Message */}
            {error && (
                <p className="text-[12px] text-red-500 leading-5" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {error}
                </p>
            )}

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
