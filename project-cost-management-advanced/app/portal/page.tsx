'use client'

import EmployeeHeader from '../components/EmployeeHeader'
import TopNav from '../components/TopNav'
import EmployeeSidebar from '../components/EmployeeSidebar'
import PortalMainContent from '../components/PortalMainContent'
import { PortalDataProvider, usePortalData } from './PortalDataProvider'

export default function EmployeePortal() {
    const handleLogout = () => {
        document.cookie = 'mock-role=; Max-Age=0; path=/'
        window.location.href = '/'
    }

    return (
        <PortalDataProvider>
            <PortalContent onLogout={handleLogout} />
        </PortalDataProvider>
    )
}

function PortalContent({ onLogout }: { onLogout: () => void }) {
    const { user, loading } = usePortalData()
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="size-8 animate-spin rounded-full border-4 border-[#155DFC] border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav onLogout={onLogout} />
            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <EmployeeHeader userName={user?.name || 'Employee'} />
                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <EmployeeSidebar />
                    <div className="md:col-span-2">
                        <PortalMainContent />
                    </div>
                </div>
            </main>
        </div>
    )
}
