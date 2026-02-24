'use client'

interface DashboardStatCardProps {
    icon: React.ReactNode
    iconBg: string
    label: string
    value: string | number
}

export default function DashboardStatCard({
    icon,
    iconBg,
    label,
    value,
}: DashboardStatCardProps) {
    return (
        <div
            className="relative flex flex-1 items-center gap-0 p-[25px] rounded-xl border border-solid bg-white"
            style={{
                borderColor: '#F1F5F9',
                boxShadow: '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
            }}
        >
            {/* Shadow overlay (Figma pattern) */}
            <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ background: 'rgba(255,255,255,0)' }}
            />

            {/* Icon box */}
            <div className="shrink-0 pr-5">
                <div
                    className="flex items-center justify-center rounded-lg size-14"
                    style={{ backgroundColor: iconBg, color: '#155DFC' }}
                >
                    {icon}
                </div>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-1">
                <span
                    className="text-[#6A7282] font-bold text-sm uppercase tracking-[0.7px] leading-5 whitespace-nowrap"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {label}
                </span>
                <span
                    className="text-[#0F172B] font-bold text-[30px] leading-9 whitespace-nowrap"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {value}
                </span>
            </div>
        </div>
    )
}
