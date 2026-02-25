'use client'

import React, { useState } from 'react'
import { usePortalData } from '../portal/PortalDataProvider'

export default function LogWorkForm() {
    const { user, projects, refreshData } = usePortalData()
    const today = new Date().toISOString().split('T')[0]

    const [date, setDate] = useState(today)
    const [projectId, setProjectId] = useState('')
    const [hours, setHours] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !projectId || !hours) return

        setLoading(true)
        try {
            const res = await fetch('/api/employee/time-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    projectId,
                    date,
                    hours: parseFloat(hours),
                    type: 'WORK'
                })
            })

            if (!res.ok) throw new Error('Failed to log work')

            // Wait for refresh to show the new log directly on the calendar
            await refreshData()
            setHours('') // reset form
        } catch (err) {
            console.error(err)
            alert('Error logging work. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 max-w-[302px]">
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
                    required
                    className="w-full rounded-md border border-[#CAD5E2] px-[13px] py-[9px] text-[16px] text-[#171717] outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                />
            </div>

            {/* Project Field */}
            <div className="flex flex-col gap-1 w-full">
                <label
                    className="text-[14px] text-[#314158] leading-5"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Project
                </label>
                {/* We use a select here to match the wireframe intent, styled similar to Figma */}
                <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    required
                    className="w-full rounded-md border border-[#CAD5E2] pl-[13px] pr-[36px] py-[9px] text-[16px] text-[#171717] outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23314158%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-12px)_center]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    <option value="" disabled>Select Project...</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {/* Hours Field */}
            <div className="flex flex-col gap-1 w-full">
                <label
                    className="text-[14px] text-[#314158] leading-5"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Hours
                </label>
                <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.0"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    required
                    className="w-full rounded-md border border-[#CAD5E2] px-[13px] py-[9px] text-[16px] text-[#171717] outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                />
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center rounded-md bg-[#155DFC] px-4 py-2 hover:bg-[#155DFC]/90 transition-colors disabled:opacity-50"
            >
                <span
                    className="text-[16px] text-white leading-6"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {loading ? 'Logging...' : 'Log Hours'}
                </span>
            </button>
        </form>
    )
}
