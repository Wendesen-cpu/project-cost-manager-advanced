'use client'

import AdminSidebar from '@/app/components/admin/AdminSidebar'

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const handleLogout = () => {
        document.cookie = 'mock-role=; Max-Age=0; path=/'
        window.location.href = '/'
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Fixed-width sidebar */}
            <AdminSidebar onLogout={handleLogout} />

            {/* Scrollable main content area */}
            <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F8FAFC' }}>
                {children}
            </main>
        </div>
    )
}
