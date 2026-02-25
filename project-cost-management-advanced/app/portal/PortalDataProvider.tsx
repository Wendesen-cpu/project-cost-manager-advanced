'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
// @ts-ignore
import type { TimeLog } from '../../lib/generated/prisma'

interface PortalData {
    user: any | null
    projects: any[]
    timeLogs: TimeLog[]
    loading: boolean
    refreshData: () => Promise<void>
}

const PortalDataContext = createContext<PortalData | undefined>(undefined)

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null)
    const [projects, setProjects] = useState<any[]>([])
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
    const [loading, setLoading] = useState(true)

    const refreshData = async () => {
        try {
            // Fetch mock user
            const userRes = await fetch('/api/me')
            if (!userRes.ok) throw new Error('Failed to fetch user')
            const userData = await userRes.json()
            setUser(userData)

            // Fetch user's projects & time logs in parallel
            const [projRes, logsRes] = await Promise.all([
                fetch(`/api/employee/projects?userId=${userData.id}`),
                fetch(`/api/employee/time-logs?userId=${userData.id}`)
            ])

            if (projRes.ok) setProjects(await projRes.json())
            if (logsRes.ok) setTimeLogs(await logsRes.json())
        } catch (error) {
            console.error('Error fetching portal data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshData()
    }, [])

    return (
        <PortalDataContext.Provider value={{ user, projects, timeLogs, loading, refreshData }}>
            {children}
        </PortalDataContext.Provider>
    )
}

export function usePortalData() {
    const context = useContext(PortalDataContext)
    if (context === undefined) {
        throw new Error('usePortalData must be used within a PortalDataProvider')
    }
    return context
}
