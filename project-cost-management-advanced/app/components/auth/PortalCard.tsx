import Link from 'next/link'
import { Shield, Users, ArrowRight } from 'lucide-react'

interface PortalCardProps {
    title: string
    description: string
    href: string
    type: 'admin' | 'employee'
}

export default function PortalCard({ title, description, href, type }: PortalCardProps) {
    const isAdmin = type === 'admin'
    const Icon = isAdmin ? Shield : Users
    const accentColor = isAdmin ? 'from-[#0F172B] to-[#1E293B]' : 'from-[#2563EB] to-[#3B82F6]'
    const shadowColor = isAdmin ? 'shadow-slate-200' : 'shadow-blue-100'

    return (
        <Link
            href={href}
            className={`flex-1 min-w-[340px] p-8 bg-white/70 backdrop-blur-xl border border-white/40 rounded-[32px] shadow-2xl ${shadowColor} hover:shadow-3xl hover:-translate-y-2 transition-all duration-300 group flex flex-col items-center text-center relative overflow-hidden`}
        >
            {/* Background Accent Gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accentColor} opacity-5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:opacity-10 transition-opacity`} />

            <div className={`size-16 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-300`}>
                <Icon className="text-white size-7" />
            </div>

            <h3 className="text-xl font-bold text-[#0F172B] mb-3 tracking-tight group-hover:scale-105 transition-transform">
                {title}
            </h3>

            <p className="text-sm text-[#64748B] leading-relaxed max-w-[240px] mb-8">
                {description}
            </p>

            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${isAdmin ? 'text-[#0F172B]' : 'text-[#2563EB]'}`}>
                Access Portal
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
            </div>
        </Link>
    )
}
