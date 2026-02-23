import React from 'react'

const chevronLeftIcon = 'http://localhost:3845/assets/dc7c420875c8609bbf555917e41a7e1c1a49f461.svg'
const chevronRightIcon = 'http://localhost:3845/assets/6006e30f9111e326af50f1ecb24b9838e89ce8bf.svg'

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

interface CalendarHeaderProps {
    month: number   // 0-indexed
    year: number
    onPrev: () => void
    onToday: () => void
    onNext: () => void
}

export default function CalendarHeader({ month, year, onPrev, onToday, onNext }: CalendarHeaderProps) {
    return (
        <div className="flex items-center justify-between px-6 py-[24px] border-b border-[#F1F5F9]">
            {/* Month + Year */}
            <span
                className="text-[20px] font-bold uppercase tracking-[-0.5px] text-[#1D293D] leading-7"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                {MONTH_NAMES[month]} {year}
            </span>

            {/* Navigation */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onPrev}
                    className="flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    aria-label="Previous month"
                >
                    <img src={chevronLeftIcon} alt="" className="size-5" />
                </button>

                <button
                    type="button"
                    onClick={onToday}
                    className="px-4 py-[9.75px] rounded-xl text-[12px] font-bold text-[#155DFC] hover:bg-blue-50 transition-colors leading-4"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    Today
                </button>

                <button
                    type="button"
                    onClick={onNext}
                    className="flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    aria-label="Next month"
                >
                    <img src={chevronRightIcon} alt="" className="size-5" />
                </button>
            </div>
        </div>
    )
}
