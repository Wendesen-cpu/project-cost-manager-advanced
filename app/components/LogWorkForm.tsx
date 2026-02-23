'use client'

import React from 'react'

export default function LogWorkForm() {
    return (
        <form className="flex w-full flex-col gap-4 max-w-[302px]">
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
                    defaultValue="2026-02-20"
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
                    defaultValue=""
                    className="w-full rounded-md border border-[#CAD5E2] pl-[13px] pr-[36px] py-[9px] text-[16px] text-[#171717] outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23314158%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:calc(100%-12px)_center]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    <option value="" disabled>Select Project...</option>
                    <option value="1">Project Pro</option>
                    <option value="2">Alpha Design</option>
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
                    placeholder="0.0"
                    className="w-full rounded-md border border-[#CAD5E2] px-[13px] py-[9px] text-[16px] text-[#171717] outline-none focus:border-[#155DFC] focus:ring-1 focus:ring-[#155DFC]"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                />
            </div>

            {/* Submit Button */}
            <button
                type="button"
                className="mt-2 flex w-full items-center justify-center rounded-md bg-[#155DFC] px-4 py-2 hover:bg-[#155DFC]/90 transition-colors"
            >
                <span
                    className="text-[16px] text-white leading-6"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Log Hours
                </span>
            </button>
        </form>
    )
}
