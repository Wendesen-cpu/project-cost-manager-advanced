'use client'

import { useState } from 'react'
import { Mail, Lock, LogIn, ArrowRight, ArrowLeft, Shield, User } from 'lucide-react'
import Link from 'next/link'

interface LoginFormProps {
    type: 'admin' | 'employee'
    // Callback on successful login
    onSuccess: (userData: any) => void
}

export default function LoginForm({ type, onSuccess }: LoginFormProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isAdmin = type === 'admin'
    const accentColor = isAdmin ? '#0F172B' : '#2563EB'
    const icon = isAdmin ? <Shield className="text-white size-6" /> : <User className="text-white size-6" />
    const title = isAdmin ? 'ADMIN MANAGEMENT PANEL' : 'EMPLOYEE PERSONAL PORTAL'
    const subtitle = isAdmin ? 'System Administrator' : 'Welcome Back'
    const buttonText = loading ? 'SIGNING IN...' : (isAdmin ? 'LOGIN TO ADMIN' : 'LOGIN TO PORTAL')
    const switchText = isAdmin ? 'GO TO EMPLOYEE PORTAL' : 'GO TO ADMIN PANEL'
    const switchHref = isAdmin ? '/login/employee' : '/login/admin'
    const switchIcon = isAdmin ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Login failed')

            // Verify role matches the portal type
            if (isAdmin && (data.role !== 'ADMIN' && data.role !== 'SYSTEM_ADMIN')) {
                throw new Error('Access denied: Admin credentials required.')
            }
            if (!isAdmin && data.role !== 'EMPLOYEE') {
                throw new Error('Access denied: Employee credentials required.')
            }

            onSuccess(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[480px] bg-white rounded-[32px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-[#F1F5F9] relative z-10">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-10">
                <div
                    className="size-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300"
                    style={{ backgroundColor: accentColor }}
                >
                    {icon}
                </div>
                <h2 className="text-2xl font-bold text-[#0F172B] tracking-tight mb-2 uppercase">
                    {title}
                </h2>
                <p className="text-sm text-[#64748B] font-medium">
                    {subtitle}
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                    {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest ml-1">
                        {isAdmin ? 'Email Address' : 'Email Address'}
                    </label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
                        <input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-[#94A3B8]"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest ml-1">
                        Password
                    </label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#94A3B8] group-focus-within:text-[#2563EB] transition-colors" />
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50/50 transition-all placeholder:text-[#94A3B8]"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                    style={{ backgroundColor: accentColor }}
                >
                    {!loading && <LogIn className="size-4 opacity-70 group-hover:opacity-100 transition-opacity" />}
                    {buttonText}
                </button>
            </form>

            <div className="mt-8 pt-8 border-t border-[#F1F5F9] flex flex-col items-center gap-4">
                <p className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-[2px]">
                    {isAdmin ? 'Super Admin can manage all accounts.' : ''}
                </p>
                <Link
                    href={switchHref}
                    className="flex items-center gap-2 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest hover:text-[#2563EB] transition-colors group"
                >
                    {isAdmin ? '' : switchIcon}
                    {switchText}
                    {isAdmin ? switchIcon : ''}
                </Link>
            </div>
        </div>
    )
}
