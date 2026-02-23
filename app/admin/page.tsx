'use client'

export default function AdminDashboard() {
    const handleLogout = () => {
        document.cookie = 'mock-role=; Max-Age=0; path=/'
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
                    <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">Logout</button>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white shadow rounded-lg p-5">
                        <h3 className="text-lg font-medium text-gray-900">Employees</h3>
                        <p className="mt-2 text-sm text-gray-500">Manage employee records, costs, and vacation days.</p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-5">
                        <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                        <p className="mt-2 text-sm text-gray-500">Manage projects and view financial overviews.</p>
                    </div>
                    <div className="bg-white shadow rounded-lg p-5">
                        <h3 className="text-lg font-medium text-gray-900">Assignments</h3>
                        <p className="mt-2 text-sm text-gray-500">Assign employees to specific projects.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
