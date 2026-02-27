'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { TimeLog } from '../../lib/generated/prisma'

// Extends the base TimeLog with the project relation returned by the API
export type TimeLogWithProject = TimeLog & {
    project?: { name: string } | null
}

interface User {
    id: string
    name: string
    remainingVacationDays: number | null
}

interface Project {
    id: string
    name: string
}

interface PortalData {
    user: User | null
    projects: Project[]
    timeLogs: TimeLogWithProject[]
    loading: boolean
    refreshData: () => Promise<void>
    addLog: (log: TimeLogWithProject) => void
    deleteLog: (logId: string) => void
    updateUser: (user: User) => void
}

const PortalDataContext = createContext<PortalData | undefined>(undefined)

export function PortalDataProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [timeLogs, setTimeLogs] = useState<TimeLogWithProject[]>([])
    const [loading, setLoading] = useState(true)

    const refreshData = async () => {
        setLoading(true)
        try {
            console.log('🔄 PortalDataProvider: Starting refresh...')

            // Fetch the currently signed-in user
            const userRes = await fetch('/api/me')

            // If not authenticated, redirect to login
            if (userRes.status === 401) {
                window.location.href = '/login/employee'
                return
            }

            if (!userRes.ok) throw new Error('Failed to fetch user')
            const userData = await userRes.json()
            console.log('👤 PortalDataProvider: User fetched', userData)

            // Fetch user's projects & time logs in parallel
            const [projRes, logsRes] = await Promise.all([
                fetch(`/api/employee/projects?userId=${userData.id}`),
                fetch(`/api/employee/time-logs?userId=${userData.id}`)
            ])

            if (!projRes.ok) throw new Error('Failed to fetch projects')
            if (!logsRes.ok) throw new Error('Failed to fetch time logs')

            const projData = await projRes.json()
            const logsData = await logsRes.json()

            console.log('📊 PortalDataProvider: Projects fetched', projData.length, 'projects')
            console.log('📋 PortalDataProvider: Logs fetched', logsData.length, 'logs')

            // Update all state synchronously after all data is fetched
            setUser(userData)
            setProjects(projData)
            setTimeLogs(logsData)

            console.log('✅ PortalDataProvider: All state updated')
        } catch (error) {
            console.error('❌ PortalDataProvider: Error fetching data:', error)
            // Don't reset state on error - keep the last known good state
        } finally {
            setLoading(false)
        }
    }

    const addLog = (log: TimeLogWithProject) => {
        console.log('➕ PortalDataProvider: Adding log locally', log)
        setTimeLogs(prevLogs => [log, ...prevLogs])
    }

    const deleteLog = (logId: string) => {
        console.log('❌ PortalDataProvider: Removing log locally', logId)
        setTimeLogs(prevLogs => prevLogs.filter(log => log.id !== logId))
    }

    const updateUser = (updatedUser: User) => {
        console.log('👤 PortalDataProvider: Updating user locally', updatedUser)
        setUser(updatedUser)
    }

    useEffect(() => {
        refreshData()
    }, [])

    return (
        <PortalDataContext.Provider value={{ user, projects, timeLogs, loading, refreshData, addLog, deleteLog, updateUser }}>
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
