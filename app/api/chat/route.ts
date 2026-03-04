import { groq } from '@ai-sdk/groq';
import { stepCountIs, streamText, tool } from 'ai';
import { z } from 'zod';
import prisma from '@lib/prisma';
import {
    logWork,
    logVacation,
    deleteTimeLog,
    updateWorkLog,
    addBulkWorkLogs,
    deleteVacationLog,
    getUserTimeLogs,
    updateBulkWorkLogs,
    deleteWorkLog,
    clearAllLogs,
    deleteDuplicateWorkLogs,
} from '@/app/actions/timelogs';
import { createOllama } from 'ai-sdk-ollama';
import { getSession } from '@/app/lib/auth';
import { TimeLogType } from '@/lib/generated/prisma';

export const maxDuration = 30;

const ollama = createOllama({
    baseURL: 'http://localhost:11434',
});

export async function POST(req: Request) {

    const { messages, language: bodyLanguage } = await req.json();
    const language = bodyLanguage || (req as Request).headers.get('X-Language') || 'en';
    const languageInstruction = language === 'it'
        ? 'IMPORTANT: The app is set to Italian. You MUST respond exclusively in Italian (Italiano) in every message. Never switch to English.'
        : 'The app is set to English. Respond in English by default. However, if the user writes to you in Italian, respond in Italian to match their language.';
    const session = await getSession();

    if (!session || typeof session.userId !== 'string') {
        return new Response('Unauthorized', { status: 401 });
    }

    const employeeId = session.userId;

    if (!employeeId) {
        return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 });
    }
    const modelMessages = messages.map((m: any) => {
        let textContent = '';
        if (typeof m.content === 'string') {
            textContent = m.content;
        } else if (Array.isArray(m.parts)) {
            textContent = m.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('\n');
        } else if (Array.isArray(m.content)) {
            textContent = m.content
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('\n');
        } else if (m.parts && typeof m.parts === 'object') {
            textContent = (m.parts as any).text || '';
        }

        return {
            role: (m.role === 'user' || m.role === 'system') ? 'user' : 'assistant',
            content: (textContent || ' ').trim()
        };
    }).filter((m: any) => m.content !== '');

    // Fetch user context to provide to the AI
    const user = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { id: true, name: true, lastName: true, remainingVacationDays: true },
    });

    // Fetch user's assigned projects
    const availableProjects = await prisma.projectAssignment.findMany({
        where: { userId: employeeId },
        include: { project: { select: { id: true, name: true } } },
    });

    const availableProjectMap = Object.fromEntries(
        (availableProjects || []).map((p) => [
            p.project.name.toLowerCase(),
            p.project.id,
        ]),
    );
    const projectList = availableProjects
        .map(a => `- "${a.project.name}" (id: ${a.project.id})`)
        .join('\n') || '(no assigned projects)';

    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are the Project Pro Assistant — an AI that helps employees log work hours, manage vacation, view logs, and update time entries.

## LANGUAGE
${languageInstruction}

## ABSOLUTE RULE — PROJECT SELECTION (NO EXCEPTIONS)

When a user wants to log work hours but has NOT specified a project name:
- YOU MUST CALL \`requestProjectSelection\` TOOL IMMEDIATELY.
- DO NOT write any text. DO NOT list projects. DO NOT ask "which project?".
- The UI will show a visual picker — your job is ONLY to call the tool.

### ❌ WRONG (NEVER DO THIS):
User: "log 8h today"
Assistant: "Sure! Which project? Here are your projects: - Health Info App - Ecommerce App"
→ THIS IS A FAILURE. You listed projects as text. NEVER do this.

### ✅ CORRECT:
User: "log 8h today"
Assistant: [calls requestProjectSelection tool with actionType="logWork", hours=8, date="2026-03-03"]
→ The UI renders a radio picker automatically.

## OTHER RULES

**Today's date:** ${new Date().toISOString().split("T")[0]} (${new Date().toLocaleDateString("en-US", { weekday: "long" })})

**Date format for tools:** Always YYYY-MM-DD.

**Bulk logging:** For date ranges use \`addBulkWorkLogs\`. For single dates use \`logWork\`. For bulk vacation use \`addBulkVacationLogs\`.

**Bulk deletion:** Use \`deleteBulkWorkLogs\` for work logs, \`deleteBulkVacations\` for vacation logs.

**Weekends:** Skip weekends by default for ALL bulk operations (logging AND deleting work logs AND vacations). This applies unless the user explicitly says "include weekends" or confirms when asked.
- If the user confirms a bulk action without mentioning weekends, ALWAYS pass \`skipWeekends: true\`.
- Only pass \`skipWeekends: false\` when the user explicitly says "include weekends" or "including weekends".

**Confirmations:** When a tool returns "CONFIRMATION REQUIRED" and the user says "yes":
- Do NOT ask again.
- Call the EXACT same tool with ALL the same parameters PLUS \`confirmed: true\`.

**Conflicts:** When a tool returns \`conflict: true\` ask what to do: merge, ignore, or add as separate entry.

**No raw JSON:** Never output raw JSON. Use tools for actions, plain text for conversation.
`;


    const result = streamText({
        model: groq(process.env.SELECTED_AI_MODEL || 'openai/gpt-oss-120b'),
        system: systemPrompt,
        messages: modelMessages,

        tools: {
            getRecentWorkLogs: {
                description: "Get recent work logs for the current employee",
                inputSchema: z.object({}),
                execute: async () => {
                    const logs = await prisma.timeLog.findMany({
                        where: { userId: employeeId, type: "WORK" },
                        orderBy: { date: "desc" },
                        take: 50,
                        include: { project: true },
                    });
                    return {
                        success: true,
                        logs: logs.map((l) => ({
                            id: l.id,
                            project: l.project,
                            date: l.date.toISOString().split("T")[0],
                            hours: l.hours,
                        })),
                    };
                },
            },
            requestProjectSelection: {
                description:
                    "Call this when user wants to log work but did not specify which project. Returns available projects for user to select from.",
                inputSchema: z.object({
                    actionType: z
                        .enum(["logWork", "addBulkWorkLogs"])
                        .describe("The type of action pending"),
                    hours: z.number().optional().describe("Hours for single day log"),
                    date: z
                        .string()
                        .optional()
                        .describe("Date for single day log (YYYY-MM-DD)"),
                    startDate: z
                        .string()
                        .optional()
                        .describe("Start date for bulk log"),
                    endDate: z.string().optional().describe("End date for bulk log"),
                    hoursPerDay: z
                        .number()
                        .optional()
                        .describe("Hours per day for bulk log"),
                    skipWeekends: z
                        .boolean()
                        .optional()
                        .describe("If true, weekends are skipped for bulk logs"),
                    month: z
                        .string()
                        .optional()
                        .describe("Month in YYYY-MM format (e.g., 2026-02)"),
                }),
                execute: async ({
                    actionType,
                    hours,
                    date,
                    startDate,
                    endDate,
                    hoursPerDay,
                    skipWeekends,
                    month,
                }: {
                    actionType: "logWork" | "addBulkWorkLogs";
                    hours?: number;
                    date?: string;
                    startDate?: string;
                    endDate?: string;
                    hoursPerDay?: number;
                    skipWeekends?: boolean;
                    month?: string;
                }) => {
                    return {
                        success: true,
                        requiresProjectSelection: true,
                        projects: availableProjects.map(p => ({ id: p.project.id, name: p.project.name })),
                        pendingAction: {
                            type: actionType,
                            hours,
                            date,
                            startDate,
                            endDate,
                            hoursPerDay,
                            skipWeekends,
                            month,
                        },
                        message: "Please select a project from the list.",
                    };
                },
            },
            selectProjectAndLog: {
                description:
                    "Execute a pending work log action after user selects a project",
                inputSchema: z.object({
                    projectId: z.string().describe("The selected project ID"),
                    actionType: z.enum(["logWork", "addBulkWorkLogs"]),
                    hours: z.number().optional(),
                    date: z.string().optional(),
                    startDate: z.string().optional(),
                    endDate: z.string().optional(),
                    hoursPerDay: z.number().optional(),
                    confirmed: z.boolean().optional(),
                    skipWeekends: z.boolean().optional(),
                    month: z.string().optional(),
                }),
                execute: async ({
                    projectId,
                    actionType,
                    hours,
                    date,
                    startDate,
                    endDate,
                    hoursPerDay,
                    confirmed,
                    skipWeekends,
                    month,
                }: {
                    projectId: string;
                    actionType: "logWork" | "addBulkWorkLogs";
                    hours?: number;
                    date?: string;
                    startDate?: string;
                    endDate?: string;
                    hoursPerDay?: number;
                    confirmed?: boolean;
                    skipWeekends?: boolean;
                    month?: string;
                }) => {
                    try {
                        if (actionType === "logWork" && date && hours !== undefined) {
                            const d = new Date(date);
                            const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

                            if (isWeekend && !confirmed) {
                                return {
                                    success: false,
                                    message: `${date} is a weekend. Ask user for confirmation.`,
                                    requiresConfirmation: true,
                                };
                            }

                            let targetId = projectId;
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetId = availableProjectMap[lowerInput];
                            }

                            await logWork({
                                userId: employeeId,
                                projectId: targetId,
                                date: d,
                                hours,
                            });
                            const projectName =
                                availableProjects.find((p: any) => p.project.id === targetId)?.project.name ||
                                "the project";
                            return {
                                success: true,
                                message: `Logged ${hours}h for ${projectName} on ${date}.`,
                            };
                        } else if (
                            actionType === "addBulkWorkLogs" &&
                            hoursPerDay !== undefined &&
                            (month || (startDate && endDate))
                        ) {
                            let start: Date;
                            let end: Date;
                            let dateRangeStr = "";

                            if (month) {
                                const [year, monthNum] = month.split("-").map(Number);
                                start = new Date(Date.UTC(year, monthNum - 1, 1));
                                end = new Date(Date.UTC(year, monthNum, 0));
                                dateRangeStr = `${month} (${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]})`;
                            } else if (startDate && endDate) {
                                start = new Date(startDate);
                                end = new Date(endDate);
                                dateRangeStr = `${startDate} to ${endDate}`;
                            } else {
                                return {
                                    success: false,
                                    message:
                                        "Invalid arguments. Provide month or start/end dates.",
                                };
                            }

                            if (skipWeekends === false) {
                                const weekendDates = [];
                                for (
                                    let d = new Date(start);
                                    d <= end;
                                    d.setDate(d.getDate() + 1)
                                ) {
                                    const dayOfWeek = d.getUTCDay();
                                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                                        weekendDates.push(d.toISOString().split("T")[0]);
                                    }
                                }

                                if (weekendDates.length > 0 && !confirmed) {
                                    return {
                                        success: false,
                                        message: `The range includes weekend days: ${weekendDates.join(", ")}. Ask user for confirmation.`,
                                        requiresConfirmation: true,
                                    };
                                }
                            }

                            let targetId = projectId;
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetId = availableProjectMap[lowerInput];
                            }

                            const result = await addBulkWorkLogs({
                                userId: employeeId,
                                projectId: targetId,
                                startDate: start,
                                endDate: end,
                                hours: hoursPerDay,
                                skipWeekends: skipWeekends !== false, // Default to true
                            });

                            const projectName =
                                availableProjects.find((p: any) => p.project.id === targetId)?.project.name ||
                                "the project";
                            return {
                                success: true,
                                message: `Logged ${hoursPerDay}h for ${projectName} on ${result.count} days (${dateRangeStr}).`,
                            };
                        }
                        return { success: false, message: "Invalid action parameters." };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            logWork: {
                description:
                    "Log work hours for a specific project. IMPORTANT: Only call this if the user explicitly mentioned a project name. If they did not, use requestProjectSelection instead.",
                inputSchema: z.object({
                    projectId: z.string().describe("The ID or Name of the project"),
                    date: z.string().describe("The date in YYYY-MM-DD format"),
                    hours: z.coerce.number().describe("Hours worked"),
                    confirmed: z
                        .boolean()
                        .optional()
                        .describe("True if user confirmed weekend logging"),
                    conflictAction: z
                        .enum(["merge", "ignore", "add"])
                        .optional()
                        .describe(
                            "Action to take if a log already exists for this date and project",
                        ),
                }),
                execute: async ({
                    projectId,
                    date,
                    hours,
                    confirmed,
                    conflictAction,
                }: {
                    projectId: string;
                    date: string;
                    hours: number;
                    confirmed?: boolean;
                    conflictAction?: "merge" | "ignore" | "add";
                }) => {
                    try {
                        const d = new Date(date);
                        const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

                        if (isWeekend && !confirmed) {
                            return {
                                success: false,
                                message: `${date} is a weekend. Ask user for confirmation.`,
                                requiresConfirmation: true,
                            };
                        }

                        let targetId = projectId;
                        const lowerInput = projectId.toLowerCase();
                        if (availableProjectMap[lowerInput]) {
                            targetId = availableProjectMap[lowerInput];
                        }

                        const result = await logWork({
                            userId: employeeId,
                            projectId: targetId,
                            date: d,
                            hours,
                            conflictAction,
                        });

                        if ((result as any).conflict) {
                            return {
                                success: false,
                                conflict: true,
                                message: (result as any).message,
                                existingHours: (result as any).existingHours,
                            };
                        }

                        const projectName =
                            availableProjects.find((p: any) => p.project.id === targetId)?.project.name ||
                            "the project";
                        let msg = `Logged ${hours}h for ${projectName} on ${date}.`;
                        if ((result as any).action === "merged")
                            msg = `Merged ${hours}h into existing log for ${projectName} on ${date}.`;
                        if ((result as any).action === "ignored")
                            msg = `Ignored request as log already exists for ${projectName} on ${date}.`;

                        return { success: true, message: msg };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            addBulkWorkLogs: {
                description:
                    "Log work hours for multiple consecutive days. Use this when the user wants to log the same hours across a date range.",
                inputSchema: z.object({
                    projectId: z.string().describe("The ID or Name of the project"),
                    startDate: z
                        .string()
                        .optional()
                        .describe("Start date in YYYY-MM-DD format"),
                    endDate: z
                        .string()
                        .optional()
                        .describe("End date in YYYY-MM-DD format"),
                    month: z
                        .string()
                        .optional()
                        .describe("Month in YYYY-MM format (e.g., 2026-02)"),
                    hoursPerDay: z.coerce.number().describe("Hours to log per day"),
                    skipWeekends: z
                        .boolean()
                        .optional()
                        .describe(
                            "If true, Saturday and Sunday will be skipped automatically",
                        ),
                    confirmed: z
                        .boolean()
                        .optional()
                        .describe("True if user confirmed weekend logging"),
                }),
                execute: async ({
                    projectId,
                    startDate,
                    endDate,
                    month,
                    hoursPerDay,
                    skipWeekends,
                    confirmed,
                }: {
                    projectId: string;
                    startDate?: string;
                    endDate?: string;
                    month?: string;
                    hoursPerDay: number;
                    skipWeekends?: boolean;
                    confirmed?: boolean;
                }) => {
                    try {
                        let start: Date;
                        let end: Date;
                        let dateRangeStr = "";

                        if (month) {
                            const [year, monthNum] = month.split("-").map(Number);
                            start = new Date(Date.UTC(year, monthNum - 1, 1));
                            end = new Date(Date.UTC(year, monthNum, 0));
                            dateRangeStr = `${month} (${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]})`;
                        } else if (startDate && endDate) {
                            start = new Date(startDate);
                            end = new Date(endDate);
                            dateRangeStr = `${startDate} to ${endDate}`;
                        } else {
                            return {
                                success: false,
                                message:
                                    "Please provide either a month OR a start/end date range.",
                            };
                        }

                        const weekendDates = [];

                        if (skipWeekends === false) {
                            // Check for weekends first if not skipping
                            for (
                                let d = new Date(start);
                                d <= end;
                                d.setDate(d.getDate() + 1)
                            ) {
                                const dayOfWeek = d.getUTCDay();
                                if (dayOfWeek === 0 || dayOfWeek === 6) {
                                    weekendDates.push(d.toISOString().split("T")[0]);
                                }
                            }

                            if (weekendDates.length > 0 && !confirmed) {
                                return {
                                    success: false,
                                    message: `The range includes weekend days: ${weekendDates.join(", ")}. Ask user for confirmation.`,
                                    requiresConfirmation: true,
                                };
                            }
                        }

                        // Resolve project ID
                        let targetId = projectId;
                        const lowerInput = projectId.toLowerCase();
                        if (availableProjectMap[lowerInput]) {
                            targetId = availableProjectMap[lowerInput];
                        }

                        const result = await addBulkWorkLogs({
                            userId: employeeId,
                            projectId: targetId,
                            startDate: start,
                            endDate: end,
                            hours: hoursPerDay,
                            skipWeekends: skipWeekends !== false, // Default to true
                        });

                        const projectName =
                            availableProjects.find((p: any) => p.project.id === targetId)?.project.name ||
                            "the project";
                        return {
                            success: true,
                            message: `Logged ${hoursPerDay}h for ${projectName} on ${result.count} days (${dateRangeStr}).`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            updateWorkLog: {
                description:
                    "Update an existing work log. If logId is not known, provide date and projectId.",
                inputSchema: z.object({
                    logId: z
                        .string()
                        .optional()
                        .describe("The ID of the work log to update"),
                    hours: z.coerce
                        .number()
                        .optional()
                        .describe("The new number of hours"),
                    date: z
                        .string()
                        .optional()
                        .describe("The date in YYYY-MM-DD format (if logId is missing)"),
                    projectId: z
                        .string()
                        .optional()
                        .describe("The ID or Name of the project (if logId is missing)"),
                }),
                execute: async ({
                    logId,
                    hours,
                    date,
                    projectId,
                }: {
                    logId?: string;
                    hours?: number;
                    date?: string;
                    projectId?: string;
                }) => {
                    try {
                        let targetLogId = logId;

                        if (!targetLogId && date && projectId) {
                            let targetProjectId = projectId;
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetProjectId = availableProjectMap[lowerInput];
                            }

                            const workLog = await prisma.timeLog.findFirst({
                                where: {
                                    userId: employeeId,
                                    projectId: targetProjectId,
                                    date: new Date(date),
                                },
                            });

                            if (!workLog) {
                                return {
                                    success: false,
                                    message: `No work log found for ${date} on that project.`,
                                };
                            }
                            targetLogId = workLog.id;
                        }

                        if (!targetLogId) {
                            return {
                                success: false,
                                message:
                                    "Please provide either a log ID or both date and project.",
                            };
                        }

                        await updateWorkLog(targetLogId, employeeId, {
                            hours,
                            date: date ? new Date(date) : undefined,
                        });
                        return {
                            success: true,
                            message: `Updated work log successfully.`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            updateBulkWorkLogs: {
                description:
                    "Update work hours for multiple days or a project. Requires either a date range or a project.",
                inputSchema: z.object({
                    projectId: z
                        .string()
                        .optional()
                        .describe("The ID or Name of the project"),
                    startDate: z
                        .string()
                        .optional()
                        .describe("Start date in YYYY-MM-DD format"),
                    endDate: z
                        .string()
                        .optional()
                        .describe("End date in YYYY-MM-DD format"),
                    hours: z.coerce
                        .number()
                        .describe("The new number of hours per day"),
                }),
                execute: async ({
                    projectId,
                    startDate,
                    endDate,
                    hours,
                }: {
                    projectId?: string;
                    startDate?: string;
                    endDate?: string;
                    hours: number;
                }) => {
                    try {
                        let targetProjectId = projectId;
                        if (projectId) {
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetProjectId = availableProjectMap[lowerInput];
                            }
                        }

                        await updateBulkWorkLogs(employeeId, {
                            projectId: targetProjectId,
                            startDate: startDate ? new Date(startDate) : undefined,
                            endDate: endDate ? new Date(endDate) : undefined,
                            hours,
                        });

                        let msg = `Updated hours to ${hours}h`;
                        if (startDate && endDate)
                            msg += ` from ${startDate} to ${endDate}`;
                        if (projectId) {
                            const projectName =
                                availableProjects.find((p: any) => p.id === targetProjectId)
                                    ?.project.name || projectId;
                            msg += ` for project ${projectName}`;
                        }

                        return { success: true, message: msg };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            deleteWorkLog: {
                description: "Delete a work log by ID, or by date and project",
                inputSchema: z.object({
                    logId: z
                        .string()
                        .optional()
                        .describe("The ID of the work log to delete"),
                    date: z
                        .string()
                        .optional()
                        .describe("The date in YYYY-MM-DD format"),
                    projectId: z
                        .string()
                        .optional()
                        .describe("The ID or Name of the project"),
                }),
                execute: async ({
                    logId,
                    date,
                    projectId,
                }: {
                    logId?: string;
                    date?: string;
                    projectId?: string;
                }) => {
                    try {
                        let targetLogId = logId;

                        // If no logId provided, look up by date and project
                        if (!targetLogId && date && projectId) {
                            // Match project name to ID
                            let targetProjectId = projectId;
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetProjectId = availableProjectMap[lowerInput];
                            }

                            // Find the work log
                            const workLog = await prisma.timeLog.findFirst({
                                where: {
                                    userId: employeeId,
                                    projectId: targetProjectId,
                                    date: new Date(date),
                                },
                            });

                            if (!workLog) {
                                return {
                                    success: false,
                                    message: `No work log found for ${date} on that project.`,
                                };
                            }

                            targetLogId = workLog.id;
                        }

                        if (!targetLogId) {
                            return {
                                success: false,
                                message:
                                    "Please provide either a log ID or both date and project.",
                            };
                        }

                        await deleteWorkLog(targetLogId, employeeId);
                        return {
                            success: true,
                            message: `Deleted work log successfully.`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            logVacation: {
                description: "Log vacation for a specific day",
                inputSchema: z.object({
                    date: z.string().describe("The date in YYYY-MM-DD format"),
                    confirmed: z
                        .boolean()
                        .optional()
                        .describe("True if logging on a weekend"),
                    conflictAction: z
                        .enum(["ignore", "add"])
                        .optional()
                        .describe("Action to take if vacation already exists"),
                }),
                execute: async ({
                    date,
                    confirmed,
                    conflictAction,
                }: {
                    date: string;
                    confirmed?: boolean;
                    conflictAction?: "ignore" | "add";
                }) => {
                    try {
                        const d = new Date(date);
                        const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

                        if (isWeekend && !confirmed) {
                            return {
                                success: false,
                                message: `${date} is a weekend. Ask user for confirmation.`,
                                requiresConfirmation: true,
                            };
                        }

                        const result = await logVacation({
                            userId: employeeId,
                            date: d,
                            conflictAction,
                        });

                        if ((result as any).conflict) {
                            return {
                                success: false,
                                conflict: true,
                                message: (result as any).message,
                            };
                        }

                        return { success: true, message: `Logged vacation for ${date}.` };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            deleteVacation: {
                description: "Delete a vacation log by date",
                inputSchema: z.object({
                    date: z.string().describe("The date in YYYY-MM-DD format"),
                }),
                execute: async ({ date }: { date: string }) => {
                    try {
                        const vacationLog = await prisma.timeLog.findFirst({
                            where: {
                                userId: employeeId,
                                date: new Date(date),
                                type: TimeLogType.VACATION,
                            },
                        });

                        if (!vacationLog) {
                            return {
                                success: false,
                                message: `No vacation found for ${date}.`,
                            };
                        }

                        await prisma.timeLog.delete({
                            where: { id: vacationLog.id, type: TimeLogType.VACATION },
                        });

                        // Refund vacation day
                        await prisma.user.update({
                            where: { id: employeeId },
                            data: { remainingVacationDays: { increment: 1 } },
                        });

                        return {
                            success: true,
                            message: `Deleted vacation for ${date}.`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            deleteBulkWorkLogs: {
                description:
                    "Delete multiple work logs by date range, month, or month range. Requires confirmation.",
                inputSchema: z.object({
                    projectId: z
                        .string()
                        .optional()
                        .describe(
                            "The ID or Name of the project (optional, if not provided deletes for all projects)",
                        ),
                    startDate: z
                        .string()
                        .optional()
                        .describe("Start date in YYYY-MM-DD format"),
                    endDate: z
                        .string()
                        .optional()
                        .describe("End date in YYYY-MM-DD format"),
                    month: z
                        .string()
                        .optional()
                        .describe("Month in YYYY-MM format (e.g., 2026-02)"),
                    startMonth: z
                        .string()
                        .optional()
                        .describe("Start month in YYYY-MM format"),
                    endMonth: z
                        .string()
                        .optional()
                        .describe("End month in YYYY-MM format"),
                    confirmed: z
                        .boolean()
                        .optional()
                        .describe("Must be true to proceed with deletion"),
                    skipWeekends: z
                        .boolean()
                        .optional()
                        .describe("If true (default), skip Saturday and Sunday. Pass false only if user explicitly requests weekends."),
                }),
                execute: async ({
                    projectId,
                    startDate,
                    endDate,
                    month,
                    startMonth,
                    endMonth,
                    confirmed,
                    skipWeekends = true,
                }: {
                    projectId?: string;
                    startDate?: string;
                    endDate?: string;
                    month?: string;
                    startMonth?: string;
                    endMonth?: string;
                    confirmed?: boolean;
                    skipWeekends?: boolean;
                }) => {
                    try {
                        if (!confirmed) {
                            // Build description of what will be deleted
                            let description = "";
                            if (month) {
                                description = `all work logs for ${month}`;
                            } else if (startDate && endDate) {
                                description = `work logs from ${startDate} to ${endDate}`;
                            } else if (startMonth && endMonth) {
                                description = `work logs from ${startMonth} to ${endMonth}`;
                            }
                            if (projectId) {
                                const projectName =
                                    availableProjects.find(
                                        (p: any) =>
                                            p.id === projectId ||
                                            p.name.toLowerCase() === projectId.toLowerCase(),
                                    )?.project.name || projectId;
                                description += ` for project ${projectName}`;
                            }

                            return {
                                success: false,
                                message: `CONFIRMATION REQUIRED: This will delete ${description}. User said yes? Call this tool again with the EXACT same parameters plus confirmed=true.`,
                                requiresConfirmation: true,
                            };
                        }

                        const whereClause: any = { userId: employeeId };

                        // Handle project filtering
                        if (projectId) {
                            let targetProjectId = projectId;
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetProjectId = availableProjectMap[lowerInput];
                            }
                            whereClause.projectId = targetProjectId;
                        }

                        // Handle date range
                        if (startDate && endDate) {
                            whereClause.date = {
                                gte: new Date(startDate),
                                lte: new Date(endDate),
                            };
                        } else if (month) {
                            // Single month (e.g., "2026-02")
                            const [year, monthNum] = month.split("-");
                            const startOfMonth = new Date(
                                parseInt(year),
                                parseInt(monthNum) - 1,
                                1,
                            );
                            const endOfMonth = new Date(
                                parseInt(year),
                                parseInt(monthNum),
                                0,
                            );
                            whereClause.date = {
                                gte: startOfMonth,
                                lte: endOfMonth,
                            };
                        } else if (startMonth && endMonth) {
                            // Month range
                            const [startYear, startMonthNum] = startMonth.split("-");
                            const [endYear, endMonthNum] = endMonth.split("-");
                            const startOfRange = new Date(
                                parseInt(startYear),
                                parseInt(startMonthNum) - 1,
                                1,
                            );
                            const endOfRange = new Date(
                                parseInt(endYear),
                                parseInt(endMonthNum),
                                0,
                            );
                            whereClause.date = {
                                gte: startOfRange,
                                lte: endOfRange,
                            };
                        } else {
                            return {
                                success: false,
                                message:
                                    "Please provide either a date range, month, or month range.",
                            };
                        }

                        let deletedCount = 0;
                        if (skipWeekends) {
                            // Fetch matching logs and delete only weekday ones
                            const logsToDelete = await prisma.timeLog.findMany({
                                where: { ...whereClause, type: TimeLogType.WORK },
                                select: { id: true, date: true },
                            });
                            const weekdayIds = logsToDelete
                                .filter(l => { const d = l.date.getUTCDay(); return d !== 0 && d !== 6; })
                                .map(l => l.id);
                            const result = await prisma.timeLog.deleteMany({
                                where: { id: { in: weekdayIds } },
                            });
                            deletedCount = result.count;
                        } else {
                            const result = await prisma.timeLog.deleteMany({
                                where: { ...whereClause, type: TimeLogType.WORK },
                            });
                            deletedCount = result.count;
                        }

                        const projectName = projectId
                            ? availableProjects.find(
                                (p: any) =>
                                    p.id === projectId ||
                                    p.name.toLowerCase() === projectId.toLowerCase(),
                            )?.project.name || "specified project"
                            : "all projects";
                        return {
                            success: true,
                            message: `Deleted ${deletedCount} work log(s) for ${projectName}${skipWeekends ? ' (weekends skipped)' : ''}.`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            deleteBulkVacations: {
                description:
                    "Delete multiple vacation logs by date range, month, or month range. Requires confirmation.",
                inputSchema: z.object({
                    startDate: z
                        .string()
                        .optional()
                        .describe("Start date in YYYY-MM-DD format"),
                    endDate: z
                        .string()
                        .optional()
                        .describe("End date in YYYY-MM-DD format"),
                    month: z
                        .string()
                        .optional()
                        .describe("Month in YYYY-MM format (e.g., 2026-02)"),
                    startMonth: z
                        .string()
                        .optional()
                        .describe("Start month in YYYY-MM format"),
                    endMonth: z
                        .string()
                        .optional()
                        .describe("End month in YYYY-MM format"),
                    confirmed: z
                        .boolean()
                        .optional()
                        .describe("Must be true to proceed with deletion"),
                    skipWeekends: z
                        .boolean()
                        .optional()
                        .describe("If true (default), skip Saturday and Sunday. Pass false only if user explicitly requests weekends."),
                }),
                execute: async ({
                    startDate,
                    endDate,
                    month,
                    startMonth,
                    endMonth,
                    confirmed,
                    skipWeekends = true,
                }: {
                    startDate?: string;
                    endDate?: string;
                    month?: string;
                    startMonth?: string;
                    endMonth?: string;
                    confirmed?: boolean;
                    skipWeekends?: boolean;
                }) => {
                    try {
                        if (!confirmed) {
                            let description = "";
                            if (month) {
                                description = `all vacations for ${month}`;
                            } else if (startDate && endDate) {
                                description = `vacations from ${startDate} to ${endDate}`;
                            } else if (startMonth && endMonth) {
                                description = `vacations from ${startMonth} to ${endMonth}`;
                            }

                            return {
                                success: false,
                                message: `CONFIRMATION REQUIRED: This will delete ${description}. User said yes? Call this tool again with the EXACT same parameters plus confirmed=true.`,
                                requiresConfirmation: true,
                            };
                        }

                        const whereClause: any = { userId: employeeId };

                        // Handle date range
                        if (startDate && endDate) {
                            whereClause.date = {
                                gte: new Date(startDate),
                                lte: new Date(endDate),
                            };
                        } else if (month) {
                            const [year, monthNum] = month.split("-");
                            const startOfMonth = new Date(
                                parseInt(year),
                                parseInt(monthNum) - 1,
                                1,
                            );
                            const endOfMonth = new Date(
                                parseInt(year),
                                parseInt(monthNum),
                                0,
                            );
                            whereClause.date = {
                                gte: startOfMonth,
                                lte: endOfMonth,
                            };
                        } else if (startMonth && endMonth) {
                            const [startYear, startMonthNum] = startMonth.split("-");
                            const [endYear, endMonthNum] = endMonth.split("-");
                            const startOfRange = new Date(
                                parseInt(startYear),
                                parseInt(startMonthNum) - 1,
                                1,
                            );
                            const endOfRange = new Date(
                                parseInt(endYear),
                                parseInt(endMonthNum),
                                0,
                            );
                            whereClause.date = {
                                gte: startOfRange,
                                lte: endOfRange,
                            };
                        } else {
                            return {
                                success: false,
                                message:
                                    "Please provide either a date range, month, or month range.",
                            };
                        }

                        let vacationCount = 0;
                        if (skipWeekends) {
                            // Fetch and delete only weekday vacations
                            const logsToDelete = await prisma.timeLog.findMany({
                                where: { ...whereClause, type: TimeLogType.VACATION },
                                select: { id: true, date: true },
                            });
                            const weekdayLogs = logsToDelete.filter(l => {
                                const d = l.date.getUTCDay();
                                return d !== 0 && d !== 6;
                            });
                            vacationCount = weekdayLogs.length;
                            if (vacationCount > 0) {
                                await prisma.timeLog.deleteMany({
                                    where: { id: { in: weekdayLogs.map(l => l.id) } },
                                });
                            }
                        } else {
                            vacationCount = await prisma.timeLog.count({
                                where: { ...whereClause, type: TimeLogType.VACATION },
                            });
                            await prisma.timeLog.deleteMany({
                                where: { ...whereClause, type: TimeLogType.VACATION },
                            });
                        }

                        // Refund vacation days
                        if (vacationCount > 0) {
                            await prisma.user.update({
                                where: { id: employeeId },
                                data: { remainingVacationDays: { increment: vacationCount } },
                            });
                        }

                        return {
                            success: true,
                            message: `Deleted ${vacationCount} vacation log(s) and refunded ${vacationCount} day(s)${skipWeekends ? ' (weekends skipped)' : ''}.`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            addBulkVacationLogs: {
                description: "Add vacation logs for a date range, month, or specific dates. Skips weekends by default.",
                inputSchema: z.object({
                    startDate: z.string().optional().describe("Start date YYYY-MM-DD"),
                    endDate: z.string().optional().describe("End date YYYY-MM-DD"),
                    month: z.string().optional().describe("Month in YYYY-MM format"),
                    skipWeekends: z.boolean().optional().describe("Default true — skip Sat/Sun unless user explicitly says include weekends."),
                    confirmed: z.boolean().optional().describe("Must be true to proceed"),
                }),
                execute: async ({
                    startDate,
                    endDate,
                    month,
                    skipWeekends = true,
                    confirmed,
                }: {
                    startDate?: string;
                    endDate?: string;
                    month?: string;
                    skipWeekends?: boolean;
                    confirmed?: boolean;
                }) => {
                    try {
                        // Resolve date range
                        let start: Date, end: Date;
                        if (month) {
                            const [y, m] = month.split('-').map(Number);
                            start = new Date(y, m - 1, 1);
                            end = new Date(y, m, 0);
                        } else if (startDate && endDate) {
                            start = new Date(startDate);
                            end = new Date(endDate);
                        } else {
                            return { success: false, message: 'Provide startDate+endDate or month.' };
                        }

                        // Build list of dates, skipping weekends if needed
                        const dates: Date[] = [];
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            const day = new Date(d);
                            if (skipWeekends && (day.getDay() === 0 || day.getDay() === 6)) continue;
                            dates.push(new Date(day));
                        }

                        if (!confirmed) {
                            return {
                                success: false,
                                requiresConfirmation: true,
                                message: `CONFIRMATION REQUIRED: This will add ${dates.length} vacation day(s)${skipWeekends ? ' (weekends skipped)' : ''}. User said yes? Call this tool again with the EXACT same parameters plus confirmed=true.`,
                            };
                        }

                        // Check remaining vacation days
                        const userRecord = await prisma.user.findUnique({ where: { id: employeeId } });
                        if ((userRecord?.remainingVacationDays ?? 0) < dates.length) {
                            return {
                                success: false,
                                message: `Not enough vacation days. Remaining: ${userRecord?.remainingVacationDays ?? 0}, Requested: ${dates.length}.`,
                            };
                        }

                        let added = 0;
                        let skipped = 0;
                        for (const date of dates) {
                            const existing = await prisma.timeLog.findFirst({
                                where: { userId: employeeId, date, type: TimeLogType.VACATION },
                            });
                            if (existing) { skipped++; continue; }
                            await prisma.timeLog.create({
                                data: { userId: employeeId, date, type: TimeLogType.VACATION, hours: 0 },
                            });
                            added++;
                        }

                        if (added > 0) {
                            await prisma.user.update({
                                where: { id: employeeId },
                                data: { remainingVacationDays: { decrement: added } },
                            });
                        }

                        return {
                            success: true,
                            message: `Added ${added} vacation day(s)${skipped > 0 ? `, skipped ${skipped} already-existing` : ''}${skipWeekends ? ' (weekends excluded)' : ''}.`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
            clearAllLogs: {
                description: "Clear all logs for the employee. Dangerous.",
                inputSchema: z.object({
                    confirm: z.boolean().describe("Must be true to proceed"),
                }),
                execute: async ({ confirm }: { confirm: boolean }) => {
                    if (!confirm)
                        return { success: false, message: "Action cancelled." };
                    await clearAllLogs(employeeId);
                    return { success: true, message: "All logs cleared." };
                },
            },
            deleteDuplicateWorkLogs: {
                description:
                    "Search for and delete redundant work logs in a date range, leaving only one copy per project per day.",
                inputSchema: z.object({
                    startDate: z
                        .string()
                        .optional()
                        .describe("Start date in YYYY-MM-DD format"),
                    endDate: z
                        .string()
                        .optional()
                        .describe("End date in YYYY-MM-DD format"),
                }),
                execute: async ({
                    startDate,
                    endDate,
                }: {
                    startDate?: string;
                    endDate?: string;
                }) => {
                    try {
                        const result = await deleteDuplicateWorkLogs(
                            employeeId,
                            startDate ? new Date(startDate) : undefined,
                            endDate ? new Date(endDate) : undefined,
                        );
                        return {
                            success: true,
                            message: `Found and deleted ${result.deletedCount} redundant work log(s).`,
                        };
                    } catch (err: any) {
                        return { success: false, message: `Error: ${err.message}` };
                    }
                },
            },
        },
        stopWhen: stepCountIs(15),

    });

    return result.toUIMessageStreamResponse();
}
