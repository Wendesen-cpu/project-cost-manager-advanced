'use server';

/**
 * timelogs.ts – Server Actions for Time Log & Vacation management
 *
 * This file is the single source of truth for all log CRUD operations.
 * It is used by:
 *  - UI components (AddLogModal, ActivityMonthRow, CalendarDayCell, LogWorkForm, LogVacationForm)
 *  - AI chat agent (via imported server actions)
 *
 * Schema notes (differs from benchmark):
 *  - Single `TimeLog` model with `type: WORK | VACATION` instead of separate WorkLog / VacationLog tables
 *  - `User.remainingVacationDays` (Int?) tracks vacation balance — no separate Employee model
 *  - `userId` is used everywhere (instead of `employeeId`)
 *  - Conflict check for vacations: findFirst by userId + date + type (no unique constraint in schema)
 */

import prisma from '@lib/prisma';
import { revalidatePath } from 'next/cache';
import { TimeLogType, Role } from '@lib/generated/prisma/enums';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateToUTC(date: Date | string): Date {
    if (date instanceof Date) {
        // Keep as-is if already a Date (assumed to be UTC midnight)
        return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    }
    const [datePart] = date.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

function revalidateUserPaths(userId: string) {
    try {
        revalidatePath('/portal', 'page');
        revalidatePath('/portal', 'layout');
        // Also revalidate the user-specific route if it exists
        revalidatePath(`/portal/${userId}`, 'page');
    } catch (_) { /* safe to ignore outside Next.js rendering context */ }
}

// ─── logWork ──────────────────────────────────────────────────────────────────
/**
 * Log work hours for a user on a specific project & date.
 * Handles conflicts (existing log on same project+date):
 *   - No conflictAction → returns conflict info, lets caller decide
 *   - 'merge' → adds hours to existing log
 *   - 'ignore' → skips, returns existing log
 *   - 'add' or undefined (no conflict) → creates new log
 */
export async function logWork(data: {
    userId: string;
    projectId: string;
    date: Date | string;
    hours: number;
    conflictAction?: 'merge' | 'ignore' | 'add';
}) {
    if (data.hours <= 0 || data.hours % 0.5 !== 0) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }

    const dbDate = parseDateToUTC(data.date);

    // Validate project assignment (ADMINs bypass)
    const assignment = await prisma.projectAssignment.findUnique({
        where: { userId_projectId: { userId: data.userId, projectId: data.projectId } },
    });
    if (!assignment) {
        const user = await prisma.user.findUnique({ where: { id: data.userId } });
        if (!user || user.role === Role.EMPLOYEE) {
            throw new Error('User is not assigned to this project');
        }
    }

    // Conflict detection: same user, project, date, and type=WORK
    const existingLog = await prisma.timeLog.findFirst({
        where: {
            userId: data.userId,
            projectId: data.projectId,
            date: dbDate,
            type: TimeLogType.WORK,
        },
    });

    if (existingLog && !data.conflictAction) {
        return {
            conflict: true,
            existingHours: existingLog.hours,
            message: `There is already a log for ${existingLog.hours}h on this project and date. Do you want to merge (total ${existingLog.hours + data.hours}h), ignore, or add a new record?`,
        };
    }

    if (existingLog && data.conflictAction === 'merge') {
        const updated = await prisma.timeLog.update({
            where: { id: existingLog.id },
            data: { hours: existingLog.hours + data.hours },
            include: { project: { select: { id: true, name: true } } },
        });
        revalidateUserPaths(data.userId);
        return { success: true, log: updated, action: 'merged' };
    }

    if (existingLog && data.conflictAction === 'ignore') {
        return { success: true, log: existingLog, action: 'ignored' };
    }

    // Default or 'add'
    const log = await prisma.timeLog.create({
        data: {
            userId: data.userId,
            projectId: data.projectId,
            date: dbDate,
            hours: data.hours,
            type: TimeLogType.WORK,
        },
        include: { project: { select: { id: true, name: true } } },
    });

    revalidateUserPaths(data.userId);
    return { success: true, log, action: 'created' };
}

// ─── logVacation ──────────────────────────────────────────────────────────────
/**
 * Log a vacation day for a user.
 * hours defaults to 8 (= 1 full day). Deducts from User.remainingVacationDays.
 * Handles duplicates:
 *   - No conflictAction → returns conflict info
 *   - 'ignore' → skips
 *   - 'add' → creates anyway (allows multiple vacation entries per day)
 */
export async function logVacation(data: {
    userId: string;
    date: Date | string;
    hours?: number;
    conflictAction?: 'ignore' | 'add';
}) {
    const hours = data.hours ?? 8;
    const daysToDeduct = hours / 8;
    const dbDate = parseDateToUTC(data.date);

    // Check for existing vacation on this date
    const existingVacation = await prisma.timeLog.findFirst({
        where: {
            userId: data.userId,
            date: dbDate,
            type: TimeLogType.VACATION,
        },
    });

    if (existingVacation && !data.conflictAction) {
        return {
            conflict: true,
            message: `There is already a vacation logged for this date. Do you want to ignore or add a new record anyway?`,
        };
    }

    if (existingVacation && data.conflictAction === 'ignore') {
        return { success: true, log: existingVacation, action: 'ignored' };
    }

    // Check vacation balance
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new Error('User not found');

    if (user.remainingVacationDays === null || user.remainingVacationDays < daysToDeduct) {
        throw new Error('Not enough vacation days remaining');
    }

    // Deduct days and create log atomically
    const [, vacation] = await prisma.$transaction([
        prisma.user.update({
            where: { id: data.userId },
            data: { remainingVacationDays: { decrement: daysToDeduct } },
        }),
        prisma.timeLog.create({
            data: {
                userId: data.userId,
                projectId: null,
                date: dbDate,
                hours,
                type: TimeLogType.VACATION,
            },
            include: { project: { select: { id: true, name: true } } },
        }),
    ]);

    revalidateUserPaths(data.userId);
    return { success: true, log: vacation, action: 'created' };
}

// ─── deleteWorkLog ────────────────────────────────────────────────────────────
/**
 * Delete a WORK type TimeLog by ID.
 */
export async function deleteWorkLog(id: string, userId: string) {
    const log = await prisma.timeLog.findUnique({ where: { id } });
    if (!log) throw new Error('Work log not found');

    await prisma.timeLog.delete({ where: { id } });

    revalidateUserPaths(userId);
}

// ─── updateWorkLog ────────────────────────────────────────────────────────────
/**
 * Update hours and/or date of a WORK type TimeLog.
 */
export async function updateWorkLog(
    id: string,
    userId: string,
    data: { hours?: number; date?: Date | string }
) {
    if (data.hours !== undefined && (data.hours <= 0 || data.hours % 0.5 !== 0)) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }

    const updateData: any = {};
    if (data.hours !== undefined) updateData.hours = data.hours;
    if (data.date !== undefined) updateData.date = parseDateToUTC(data.date);

    const updated = await prisma.timeLog.update({
        where: { id },
        data: updateData,
        include: { project: { select: { id: true, name: true } } },
    });

    revalidateUserPaths(userId);
    return updated;
}

// ─── addBulkWorkLogs ──────────────────────────────────────────────────────────
/**
 * Create work logs for every day in a date range.
 * Skips weekends when skipWeekends=true.
 * Silently skips dates that already have a log for the same project (avoids duplicates).
 */
export async function addBulkWorkLogs(data: {
    userId: string;
    projectId: string;
    startDate: Date | string;
    endDate: Date | string;
    hours: number;
    skipWeekends: boolean;
}) {
    if (data.hours <= 0 || data.hours % 0.5 !== 0) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }

    // Validate assignment
    const assignment = await prisma.projectAssignment.findUnique({
        where: { userId_projectId: { userId: data.userId, projectId: data.projectId } },
    });
    if (!assignment) {
        const user = await prisma.user.findUnique({ where: { id: data.userId } });
        if (!user || user.role === Role.EMPLOYEE) {
            throw new Error('User is not assigned to this project');
        }
    }

    const start = parseDateToUTC(data.startDate);
    const end = parseDateToUTC(data.endDate);

    // Fetch existing logs in range to avoid duplicates
    const existingLogs = await prisma.timeLog.findMany({
        where: {
            userId: data.userId,
            projectId: data.projectId,
            type: TimeLogType.WORK,
            date: { gte: start, lte: end },
        },
        select: { date: true },
    });
    const existingDates = new Set(existingLogs.map(l => l.date.toISOString()));

    const logsToCreate: { userId: string; projectId: string; date: Date; hours: number; type: TimeLogType }[] = [];

    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const dayOfWeek = d.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (data.skipWeekends && isWeekend) continue;

        const dateKey = new Date(d).toISOString();
        if (existingDates.has(dateKey)) continue; // skip duplicates

        logsToCreate.push({
            userId: data.userId,
            projectId: data.projectId,
            date: new Date(d),
            hours: data.hours,
            type: TimeLogType.WORK,
        });
    }

    if (logsToCreate.length === 0) return { count: 0 };

    const result = await prisma.timeLog.createMany({ data: logsToCreate });

    revalidateUserPaths(data.userId);
    return { count: result.count };
}

// ─── updateBulkWorkLogs ───────────────────────────────────────────────────────
/**
 * Update hours for all WORK logs matching optional projectId + date range filters.
 */
export async function updateBulkWorkLogs(
    userId: string,
    data: {
        projectId?: string;
        startDate?: Date | string;
        endDate?: Date | string;
        hours: number;
    }
) {
    if (data.hours <= 0 || data.hours % 0.5 !== 0) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }

    const whereClause: any = { userId, type: TimeLogType.WORK };
    if (data.projectId) whereClause.projectId = data.projectId;
    if (data.startDate && data.endDate) {
        whereClause.date = {
            gte: parseDateToUTC(data.startDate),
            lte: parseDateToUTC(data.endDate),
        };
    }

    const updated = await prisma.timeLog.updateMany({
        where: whereClause,
        data: { hours: data.hours },
    });

    revalidateUserPaths(userId);
    return updated;
}

// ─── deleteVacationLog ────────────────────────────────────────────────────────
/**
 * Delete a VACATION type TimeLog and refund the vacation days to the user.
 */
export async function deleteVacationLog(id: string, userId: string) {
    const log = await prisma.timeLog.findUnique({ where: { id } });
    if (!log) throw new Error('Vacation log not found');

    const daysToRefund = log.hours / 8;

    await prisma.$transaction([
        prisma.timeLog.delete({ where: { id } }),
        prisma.user.update({
            where: { id: userId },
            data: { remainingVacationDays: { increment: daysToRefund } },
        }),
    ]);

    revalidateUserPaths(userId);
}

// ─── deleteTimeLog (unified) ──────────────────────────────────────────────────
/**
 * Delete any TimeLog by ID (auto-handles vacation day refund).
 * Convenience wrapper used by the AI chat agent when log type is unknown.
 */
export async function deleteTimeLog(id: string) {
    const log = await prisma.timeLog.findUnique({
        where: { id },
        include: { user: true },
    });
    if (!log) throw new Error('Time log not found');

    if (log.type === TimeLogType.VACATION) {
        return deleteVacationLog(id, log.userId);
    } else {
        return deleteWorkLog(id, log.userId);
    }
}

// ─── getEmployeeDashboardData ─────────────────────────────────────────────────
/**
 * Fetch a user's full dashboard data: profile, assigned projects, and recent logs.
 * Mirrors the benchmark's getEmployeeDashboardData but uses the User/TimeLog schema.
 */
export async function getEmployeeDashboardData(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            assignments: {
                include: { project: true },
            },
            timeLogs: {
                take: 100,
                orderBy: { date: 'desc' },
                include: { project: { select: { id: true, name: true } } },
            },
        },
    });

    if (!user) return null;

    // Split logs into work and vacation for convenience
    const workLogs = user.timeLogs.filter(l => l.type === TimeLogType.WORK);
    const vacations = user.timeLogs.filter(l => l.type === TimeLogType.VACATION);

    return {
        ...user,
        workLogs,
        vacations,
    };
}

// ─── clearAllLogs ─────────────────────────────────────────────────────────────
/**
 * Delete ALL TimeLogs for a user and refund any deducted vacation days.
 */
export async function clearAllLogs(userId: string) {
    const vacations = await prisma.timeLog.findMany({
        where: { userId, type: TimeLogType.VACATION },
        select: { hours: true },
    });

    const totalDaysToRefund = vacations.reduce((sum, v) => sum + v.hours / 8, 0);

    await prisma.$transaction([
        prisma.timeLog.deleteMany({ where: { userId } }),
        ...(totalDaysToRefund > 0
            ? [
                prisma.user.update({
                    where: { id: userId },
                    data: { remainingVacationDays: { increment: totalDaysToRefund } },
                }),
            ]
            : []),
    ]);

    revalidateUserPaths(userId);
}

// ─── deleteDuplicateWorkLogs ──────────────────────────────────────────────────
/**
 * Find and delete duplicate WORK logs (same userId + projectId + date).
 * Keeps the earliest created entry, removes all later duplicates.
 */
export async function deleteDuplicateWorkLogs(
    userId: string,
    startDate?: Date | string,
    endDate?: Date | string
) {
    const where: any = { userId, type: TimeLogType.WORK };
    if (startDate && endDate) {
        where.date = {
            gte: parseDateToUTC(startDate),
            lte: parseDateToUTC(endDate),
        };
    }

    const logs = await prisma.timeLog.findMany({
        where,
        orderBy: { date: 'asc' }, // no createdAt on TimeLog, order by date instead
    });

    const seen = new Set<string>();
    const toDelete: string[] = [];

    for (const log of logs) {
        const key = `${log.projectId}-${log.date.toISOString()}`;
        if (seen.has(key)) {
            toDelete.push(log.id);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        await prisma.timeLog.deleteMany({ where: { id: { in: toDelete } } });
    }

    revalidateUserPaths(userId);
    return { deletedCount: toDelete.length };
}

// ─── deleteDuplicateVacations ─────────────────────────────────────────────────
/**
 * Find and delete duplicate VACATION logs (same userId + date).
 * Keeps the first, removes extras, and refunds the extra vacation days deducted.
 */
export async function deleteDuplicateVacations(
    userId: string,
    startDate?: Date | string,
    endDate?: Date | string
) {
    const where: any = { userId, type: TimeLogType.VACATION };
    if (startDate && endDate) {
        where.date = {
            gte: parseDateToUTC(startDate),
            lte: parseDateToUTC(endDate),
        };
    }

    const logs = await prisma.timeLog.findMany({ where, orderBy: { date: 'asc' } });

    const seen = new Set<string>();
    const toDelete: string[] = [];
    let hoursToRefund = 0;

    for (const log of logs) {
        const key = log.date.toISOString();
        if (seen.has(key)) {
            toDelete.push(log.id);
            hoursToRefund += log.hours;
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        const daysToRefund = hoursToRefund / 8;
        await prisma.$transaction([
            prisma.timeLog.deleteMany({ where: { id: { in: toDelete } } }),
            prisma.user.update({
                where: { id: userId },
                data: { remainingVacationDays: { increment: daysToRefund } },
            }),
        ]);
    }

    revalidateUserPaths(userId);
    return { deletedCount: toDelete.length };
}

// ─── getUserTimeLogs ──────────────────────────────────────────────────────────
/**
 * Fetch all TimeLogs for a user with optional filters.
 * Used by the AI chat agent to read current state before deciding actions.
 */
export async function getUserTimeLogs(
    userId: string,
    opts?: {
        from?: Date | string;
        to?: Date | string;
        type?: 'WORK' | 'VACATION';
        projectId?: string;
    }
) {
    if (!userId) throw new Error('userId is required');

    const where: any = { userId };

    if (opts?.type) {
        where.type = opts.type === 'WORK' ? TimeLogType.WORK : TimeLogType.VACATION;
    }
    if (opts?.projectId) {
        where.projectId = opts.projectId;
    }
    if (opts?.from || opts?.to) {
        where.date = {};
        if (opts.from) where.date.gte = parseDateToUTC(opts.from);
        if (opts.to) where.date.lte = parseDateToUTC(opts.to);
    }

    const logs = await prisma.timeLog.findMany({
        where,
        orderBy: { date: 'desc' },
        include: { project: { select: { id: true, name: true } } },
    });

    return logs.map(l => ({ ...l, date: new Date(l.date).toISOString() }));
}


// export async function updateBulkWorkLogs(employeeId: string, data: {
//     projectId?: string;
//     startDate?: Date;
//     endDate?: Date;
//     hours: number;
// }) {
//     if (data.hours <= 0 || data.hours % 0.5 !== 0) {
//         throw new Error('Hours must be a positive multiple of 0.5');
//     }

//     const whereClause: any = { employeeId };
//     if (data.projectId) whereClause.projectId = data.projectId;
//     if (data.startDate && data.endDate) {
//         whereClause.date = {
//             gte: data.startDate,
//             lte: data.endDate
//         };
//     }

//     const updated = await prisma.timeLog.updateMany({
//         where: whereClause,
//         data: { hours: data.hours }
//     });

//     try {
//         revalidatePath(`/employee/${employeeId}`, 'page');
//         revalidatePath(`/employee/${employeeId}`, 'layout');
//     } catch (e) {
//         // Ignore errors outside of Next.js context
//     }
//     return updated;
// }