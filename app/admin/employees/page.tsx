'use client'

import { useState, useEffect } from 'react'
import { Role } from '@lib/generated/prisma/enums'
import NewEmployeeModal from '../../components/admin/NewEmployeeModal'
import { Edit2, Trash2 } from 'lucide-react'

// Adjust standard Role enum to match the table display
type EmployeeData = {
    id: string
    name: string
    lastName: string
    email: string
    role: Role
    monthlyCost: number | null
    remainingVacationDays: number
}

export default function AdminEmployeesPage() {
    const [employees, setEmployees] = useState<EmployeeData[]>([])
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const fetchEmployees = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/admin/employees')
            if (res.ok) {
                const data = await res.json()
                setEmployees(data)
            }
        } catch (error) {
            console.error('Failed to fetch employees:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchEmployees()
    }, [])

    return (
        <div
            className="w-full min-h-screen"
            style={{ backgroundColor: '#F8FAFC' }}
        >
            <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12">
                <div className="flex justify-between items-center w-full">
                    <h1
                        className="text-[#0F172B] font-bold text-[30px] leading-9 tracking-[-0.75px]"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        Employees
                    </h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-[#155DFC] hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                        Add Employee
                    </button>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                    <th className="px-6 py-4 text-xs font-normal text-[#6a7282] uppercase tracking-[0.6px]">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 text-xs font-normal text-[#6a7282] uppercase tracking-[0.6px]">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-xs font-normal text-[#6a7282] uppercase tracking-[0.6px]">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-xs font-normal text-[#6a7282] uppercase tracking-[0.6px]">
                                        Monthly Cost (€)
                                    </th>
                                    <th className="px-6 py-4 text-xs font-normal text-[#6a7282] uppercase tracking-[0.6px]">
                                        Vacation Days (Remaining)
                                    </th>
                                    <th className="px-6 py-4 text-xs font-normal text-[#6a7282] uppercase tracking-[0.6px] text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            Loading employees...
                                        </td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No employees found.
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr key={emp.id} className="border-b border-[#e2e8f0] last:border-0 hover:bg-gray-50/50 transition-colors">
                                            {/* Name */}
                                            <td className="px-6 py-4 text-sm text-[#0f172b]">
                                                {emp.name} {emp.lastName}
                                            </td>

                                            {/* Role Badge */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#016630] text-xs font-bold whitespace-nowrap">
                                                    {emp.role}
                                                </span>
                                            </td>

                                            {/* Email Badge */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#016630] text-xs font-bold whitespace-nowrap">
                                                    {emp.email}
                                                </span>
                                            </td>

                                            {/* Monthly Cost */}
                                            <td className="px-6 py-4 text-sm text-[#6a7282]">
                                                €{emp.monthlyCost || 0}
                                            </td>

                                            {/* Vacation Days */}
                                            <td className="px-6 py-4 text-sm text-[#6a7282]">
                                                {emp.remainingVacationDays}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-6 items-center">
                                                    {emp.role === Role.ADMIN || (emp.role as string) === 'SYSTEM_ADMIN' ? (
                                                        <span className="text-[#99a1af] text-sm italic">
                                                            No permission
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <button className="text-[#4f39f6] hover:text-blue-800 text-sm font-medium transition-colors">
                                                                Edit
                                                            </button>
                                                            <button className="text-[#e7000b] hover:text-red-800 text-sm font-medium transition-colors">
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <NewEmployeeModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onCreated={() => {
                        setIsAddModalOpen(false)
                        fetchEmployees()
                    }}
                />
            </div>
        </div>
    )
}
