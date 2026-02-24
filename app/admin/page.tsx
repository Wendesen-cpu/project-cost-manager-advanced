'use client'

export default function AdminDashboardPage() {
    return (
        <div className="flex flex-col p-11 text-white">
            <h1
                className="text-3xl font-bold text-white mb-2"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                Dashboard
            </h1>
            <p
                className="text-[#90A1B9] text-sm"
                style={{ fontFamily: 'Arial, sans-serif' }}
            >
                Welcome to the admin console.
            </p>
        </div>
    )
}
