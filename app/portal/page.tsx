'use client'

import EmployeeHeader from '../components/EmployeeHeader'
import TopNav from '../components/TopNav'
import EmployeeSidebar from '../components/EmployeeSidebar'

export default function EmployeePortal() {
    const handleLogout = () => {
        document.cookie = 'mock-role=; Max-Age=0; path=/'
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <TopNav onLogout={handleLogout} />
            <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <EmployeeHeader userName="Marco" />
                {/* Main Content Area */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <EmployeeSidebar />
                    {/* Placeholder for right-hand content in future */}
                    <div className="md:col-span-2"></div>
                </div>
            </main>
        </div>
    )
}
