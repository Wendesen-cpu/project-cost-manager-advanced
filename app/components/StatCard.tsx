import React from 'react'

interface StatCardProps {
    title: string
    value: string | number
    unit?: string
    icon: React.ReactNode
    iconBgColor?: string
}

export default function StatCard({
    title,
    value,
    unit,
    icon,
    iconBgColor = 'bg-[#EFF6FF]'
}: StatCardProps) {
    return (
        <div className="flex w-full items-center justify-between rounded-2xl border border-[#E2E8F0]/60 bg-white p-[21px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] relative">
            <div className="flex flex-col items-start justify-center">
                <span
                    className="text-[12px] font-bold uppercase tracking-[0.6px] text-[#62748E] leading-4 mb-1"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {title}
                </span>
                <div className="flex items-baseline gap-1">
                    <span
                        className="text-[30px] font-bold text-[#0F172B] leading-9"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        {value}
                    </span>
                    {unit && (
                        <span
                            className="text-[18px] font-bold uppercase text-[#90A1B9] leading-7"
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            {unit}
                        </span>
                    )}
                </div>
            </div>
            <div className={`relative shrink-0 flex items-center justify-center p-3 rounded-xl ${iconBgColor}`}>
                {icon}
            </div>
        </div>
    )
}
