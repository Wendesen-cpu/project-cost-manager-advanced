'use client'

import React, { useState } from 'react'

export default function LogVacationForm() {
    const today = new Date().toISOString().split('T')[0]
    const [date, setDate] = useState(today)

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        // TODO: wire up to real vacation logging API
        console.log('Logging vacation day:', date)
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
                    Date
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
                className="flex w-full items-center justify-center rounded-md bg-[#16A34A] px-4 py-2 hover:bg-[#16A34A]/90 transition-colors"
            >
                <span
                    className="text-[16px] text-white leading-6"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Log Vacation Day
                </span>
            </button>

            {/* Note */}
            <p
                className="text-[12px] text-[#64748B] leading-5"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                Note: This will deduct 1 day from your balance.
            </p>
        </form>
    )
}
