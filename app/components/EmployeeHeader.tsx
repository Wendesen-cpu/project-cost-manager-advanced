import { LayoutDashboard } from 'lucide-react'
import { useLanguage } from '../i18n'

interface EmployeeHeaderProps {
    userName?: string
}

export default function EmployeeHeader({ userName = 'Marco' }: EmployeeHeaderProps) {
    const { t } = useLanguage()

    return (
        <div
            className="relative overflow-hidden rounded-3xl p-12 shadow-[0px_25px_50px_-12px_rgba(28,57,142,0.2)] w-full"
            style={{
                background: 'linear-gradient(167.94deg, #0F172B 0%, #1D293D 50%, #1C398E 100%)',
            }}
        >
            {/* Blue glow blob — top right */}
            <div
                className="absolute rounded-full blur-[32px] size-80"
                style={{
                    background: 'rgba(43, 127, 255, 0.1)',
                    top: '-80px',
                    right: '-80px',
                }}
            />

            {/* Green glow blob — bottom left */}
            <div
                className="absolute rounded-full blur-[32px] size-80"
                style={{
                    background: 'rgba(0, 188, 125, 0.1)',
                    bottom: '-80px',
                    left: '-80px',
                }}
            />

            {/* Content */}
            <div className="relative flex flex-col gap-3">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-[rgba(81,162,255,0.2)] bg-[rgba(43,127,255,0.2)] px-[13px] py-[5px] backdrop-blur-[4px]">
                    <LayoutDashboard className="size-3.5 shrink-0 text-[#51A2FF]" />
                    <span
                        className="text-[#BEDBFF] text-[12px] tracking-[0.6px] uppercase font-normal leading-4"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        {t('employeeDashboard.title')}
                    </span>
                </div>

                {/* Heading */}
                <h1
                    className="text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-white whitespace-nowrap mt-2"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                >
                    {t('employeeDashboard.welcome')},{' '}
                    <span
                        className="bg-gradient-to-r from-[#51A2FF] to-[#00D492] bg-clip-text"
                        style={{ WebkitTextFillColor: 'transparent' }}
                    >
                        {userName}
                    </span>
                </h1>

                {/* Subtitle */}
                <p
                    className="text-[#CAD5E2] max-w-[576px]"
                    style={{
                        fontFamily: 'Arial, sans-serif',
                        fontSize: '17.9px',
                        lineHeight: '29.25px',
                    }}
                >
                    {t('employeeDashboard.subtitle')}
                </p>
            </div>
        </div>
    )
}
