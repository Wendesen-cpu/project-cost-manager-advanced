"use client";

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { TimeLog } from '../../lib/generated/prisma'
import { getSession } from '../lib/auth';

interface User {
  id: string;
  name: string;
  remainingVacationDays: number | null;
}

interface Project {
  id: string;
  name: string;
}

export interface TimeLogWithProject extends TimeLog {
  project?: Project;
}

interface PortalData {
  user: User | null
  projects: Project[]
  timeLogs: TimeLog[]
  loading: boolean
  refreshData: () => Promise<void>
  silentRefresh: () => Promise<void>
  addLog: (log: TimeLog) => void
  deleteLog: (logId: string) => void
  updateUser: (user: User) => void
}

const PortalDataContext = createContext<PortalData | undefined>(undefined);

export function PortalDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch(`/api/me`);
      if (!userRes.ok) throw new Error('Failed to fetch user');
      const userData = await userRes.json();

      const [projRes, logsRes] = await Promise.all([
        fetch(`/api/employee/projects?userId=${userData.id}`),
        fetch(`/api/employee/time-logs?userId=${userData.id}`),
      ]);
      if (!projRes.ok) throw new Error('Failed to fetch projects');
      if (!logsRes.ok) throw new Error('Failed to fetch time logs');

      setUser(userData);
      setProjects(await projRes.json());
      setTimeLogs(await logsRes.json());
    } catch (error) {
      console.error('PortalDataProvider: Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      const userRes = await fetch(`/api/me`);
      if (!userRes.ok) return;
      const userData = await userRes.json();

      const [projRes, logsRes] = await Promise.all([
        fetch(`/api/employee/projects?userId=${userData.id}`),
        fetch(`/api/employee/time-logs?userId=${userData.id}`),
      ]);
      if (!projRes.ok || !logsRes.ok) return;

      setUser(userData);
      setProjects(await projRes.json());
      setTimeLogs(await logsRes.json());
    } catch (error) {
      console.error('PortalDataProvider: Silent refresh error:', error);
    }
  };

  const addLog = (log: TimeLog) => {
    setTimeLogs((prevLogs) => [log, ...prevLogs]);
  };

  const deleteLog = (logId: string) => {
    setTimeLogs((prevLogs) => prevLogs.filter((log) => log.id !== logId));
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <PortalDataContext.Provider
      value={{
        user,
        projects,
        timeLogs,
        loading,
        refreshData,
        silentRefresh,
        addLog,
        deleteLog,
        updateUser,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  );
}

export function usePortalData() {
  const context = useContext(PortalDataContext);
  if (context === undefined) {
    throw new Error("usePortalData must be used within a PortalDataProvider");
  }
  return context;
}
