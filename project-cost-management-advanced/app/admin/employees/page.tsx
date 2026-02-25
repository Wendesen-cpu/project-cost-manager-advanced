'use client'

import { useState, useEffect } from 'react'
import { Role } from '@lib/generated/prisma/enums'
import EmployeeModal from '../../components/admin/EmployeeModal'
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
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [requesterRole, setRequesterRole] = useState<string | null>(null)

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
        const cookies = document.cookie.split('; ')
        const roleCookie = cookies.find(row => row.startsWith('mock-role='))
        setRequesterRole(roleCookie ? roleCookie.split('=')[1] : null)
        fetchEmployees()
    }, [])

    const handleAdd = () => {
        setEditingId(null)
        setIsModalOpen(true)
    }

    const handleEdit = (id: string) => {
        setEditingId(id)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return
        try {
            const res = await fetch(`/api/admin/employees/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to delete user')
            }
            fetchEmployees()
        } catch (error: any) {
            alert(error.message)
        }
    }

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
                        onClick={handleAdd}
                        className="bg-[#155DFC] hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/10 transition-all flex items-center gap-2 group"
                    >
                        <Edit2 className="size-4 opacity-70 group-hover:opacity-100" />
                        Add Employee
                    </button>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-[#e2e8f0] overflow-hidden w-full">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                    <th className="px-8 py-5 text-[10px] font-bold text-[#6a7282] uppercase tracking-[1px]">
                                        Name
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[#6a7282] uppercase tracking-[1px]">
                                        Role
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[#6a7282] uppercase tracking-[1px]">
                                        Email
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[#6a7282] uppercase tracking-[1px]">
                                        Monthly Cost (€)
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[#6a7282] uppercase tracking-[1px]">
                                        Vacation Days (Remaining)
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-bold text-[#6a7282] uppercase tracking-[1px] text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="size-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                <span className="text-xs font-bold text-[#94a3af] uppercase tracking-widest">Loading Personnel...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-medium">
                                            No employees found in the directory.
                                        </td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => {
                                        const isRestricted = (requesterRole === 'ADMIN' && (emp.role === 'ADMIN' || emp.role === 'SYSTEM_ADMIN' || (emp.role as string) === 'SYSTEM_ADMIN'))

                                        return (
                                            <tr key={emp.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#F8FAFC] transition-colors group">
                                                {/* Name */}
                                                <td className="px-8 py-5 text-sm font-bold text-[#0F172B]">
                                                    {emp.name} {emp.lastName}
                                                </td>

                                                {/* Role Badge */}
                                                <td className="px-8 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${emp.role === 'SYSTEM_ADMIN'
                                                        ? 'bg-slate-900 text-white'
                                                        : emp.role === 'ADMIN'
                                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        }`}>
                                                        {emp.role}
                                                    </span>
                                                </td>

                                                {/* Email */}
                                                <td className="px-8 py-5 text-sm text-[#64748B]">
                                                    {emp.email}
                                                </td>

                                                {/* Monthly Cost */}
                                                <td className="px-8 py-5 text-sm font-medium text-[#0F172B]">
                                                    €{emp.monthlyCost?.toLocaleString() || 0}
                                                </td>

                                                {/* Vacation Days */}
                                                <td className="px-8 py-5 text-sm text-[#64748B]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-12 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500 rounded-full"
                                                                style={{ width: `${Math.min(100, (emp.remainingVacationDays / 30) * 100)}%` }}
                                                            />
                                                        </div>
                                                        {emp.remainingVacationDays}d
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isRestricted ? (
                                                            <span className="text-[10px] font-bold text-[#94a1af] uppercase tracking-widest italic py-2">
                                                                No Access
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(emp.id)}
                                                                    className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors"
                                                                    title="Edit User"
                                                                >
                                                                    <Edit2 className="size-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(emp.id)}
                                                                    className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <EmployeeModal
                    isOpen={isModalOpen}
                    employeeId={editingId}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false)
                        fetchEmployees()
                    }}
                />
            </div>
        </div>
    )
}
