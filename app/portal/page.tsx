'use client'

export default function EmployeePortal() {
    const handleLogout = () => {
        document.cookie = 'mock-role=; Max-Age=0; path=/'
        window.location.href = '/login'
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
                    <h1 className="text-xl font-bold text-gray-900">Employee Portal</h1>
                    <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">Logout</button>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 px-4">
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Log Time</h2>
                    <form className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Project</label>
                            <select className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-black">
                                <option>Select a project</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date</label>
                            <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hours</label>
                            <input type="number" step="0.5" defaultValue="8" className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-black">
                                <option value="WORK">Work</option>
                                <option value="VACATION">Vacation</option>
                            </select>
                        </div>
                        <button type="button" className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
                            Submit
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}
