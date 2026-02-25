import Link from 'next/link'
import { Calendar, Briefcase, Users } from 'lucide-react'
import { ProjectStatus, PaymentType } from '@lib/generated/prisma/enums'

interface ProjectCardProps {
    id: string
    name: string
    description: string | null
    status: ProjectStatus
    startDate: string | null
    paymentType: PaymentType
    memberCount: number
    totalValue: number | null
}

function formatCurrency(amount: number): string {
    return `€${amount.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatDate(dateString: string | null): string {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB') // DD/MM/YYYY format
}

export default function ProjectCard({
    id,
    name,
    description,
    status,
    startDate,
    paymentType,
    memberCount,
    totalValue,
}: ProjectCardProps) {
    const isArchived = status === ProjectStatus.ARCHIVED

    return (
        <div className="bg-white border border-[#f1f5f9] flex flex-col p-[25px] rounded-[16px] shadow-sm w-full transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer relative overflow-hidden group">
            {/* Header: Title and Status */}
            <div className="flex justify-between items-start mb-[16px] w-full">
                <h3 className="text-[#0f172b] font-bold text-[20px] leading-7 truncate pr-4 group-hover:text-[#155dfc] transition-colors">
                    {name}
                </h3>
                <span
                    className={`shrink-0 border px-[11px] py-[5px] rounded-[6px] text-[10px] font-bold uppercase tracking-[0.5px] ${isArchived
                        ? 'bg-gray-100 border-gray-200 text-gray-500'
                        : 'bg-[#dcfce7] border-[#d0fae5] text-[#007a55]'
                        }`}
                >
                    {status}
                </span>
            </div>

            {/* Description */}
            <div className="mb-[24px] w-full">
                <p className="text-[#6a7282] text-[14px] leading-[22.75px] line-clamp-2">
                    {description || 'No description provided.'}
                </p>
            </div>

            {/* Stats list */}
            <div className="border-t border-[#f8fafc] pt-[25px] flex flex-col gap-[11.8px] w-full">
                {/* Start Date */}
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-[6px]">
                        <Calendar className="w-[14px] h-[14px] text-[#6a7282]" strokeWidth={2} />
                        <span className="text-[#6a7282] text-[12px] font-bold uppercase tracking-[-0.6px]">
                            Start
                        </span>
                    </div>
                    <span className="text-[#0f172b] text-[12px] font-bold">
                        {formatDate(startDate)}
                    </span>
                </div>

                {/* Payment Type */}
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-[6px]">
                        <Briefcase className="w-[14px] h-[14px] text-[#6a7282]" strokeWidth={2} />
                        <span className="text-[#6a7282] text-[12px] font-bold uppercase tracking-[-0.6px]">
                            Type
                        </span>
                    </div>
                    <span className="text-[#0f172b] text-[12px] font-bold">
                        {paymentType}
                    </span>
                </div>

                {/* Members */}
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-[6px]">
                        <Users className="w-[14px] h-[14px] text-[#6a7282]" strokeWidth={2} />
                        <span className="text-[#6a7282] text-[12px] font-bold uppercase tracking-[-0.6px]">
                            Members
                        </span>
                    </div>
                    <span className="text-[#0f172b] text-[12px] font-bold">
                        {memberCount}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#f8fafc] mt-[24px] pt-[17px] flex justify-between items-center w-full">
                <Link
                    href={`/admin/projects/${id}`}
                    className="text-[#155dfc] text-[12px] font-bold uppercase tracking-[1.2px] hover:text-blue-800 transition-colors"
                >
                    View Details
                </Link>
                <span className="text-[#0f172b] text-[14px] font-bold">
                    {totalValue ? formatCurrency(totalValue) : '€0'}
                </span>
            </div>
        </div>
    )
}
