'use client'

import LoginForm from '@/app/components/auth/LoginForm'
import { useRouter } from 'next/navigation'

export default function EmployeeLoginPage() {
    const router = useRouter()

    const handleSuccess = (userData: any) => {
        // Set mock role for middleware/layout awareness
        document.cookie = `mock-role=${userData.role}; path=/`
        router.push('/portal')
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.8),transparent)] pointer-events-none" />
            <LoginForm type="employee" onSuccess={handleSuccess} />
        </div>
    )
}
