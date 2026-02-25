'use client'

import LoginForm from '@/app/components/auth/LoginForm'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
    const router = useRouter()

    const handleLogin = (email: string) => {
        // Mock login integration
        document.cookie = 'mock-role=ADMIN; path=/'
        router.push('/admin')
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.8),transparent)] pointer-events-none" />
            <LoginForm type="admin" onSubmit={handleLogin} />
        </div>
    )
}
