'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/app/i18n';
import {
    X,
    Send,
    Bot,
    User,
    Loader2,
    Sparkles,
    ChevronDown,
    Zap
} from 'lucide-react';
import clsx from 'clsx';

interface Project {
    id: string;
    name: string;
}


export function AIChat({ onRefresh, userId }: { onRefresh?: () => void, userId: string }) {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [localInput, setLocalInput] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [autocompletePosition, setAutocompletePosition] = useState({ start: 0, end: 0 });
    // Tracks the radio-button selection per project-picker message (keyed by message id)
    const [selectedProjects, setSelectedProjects] = useState<Record<string, string>>({});
    // Fallback picker state — used when AI writes text asking for project instead of calling tool
    const [fallbackSelectedProject, setFallbackSelectedProject] = useState('');

    const {
        messages,
        status,
        error: chatError,
        sendMessage
    } = useChat({
        id: 'ollama-chat-v13',
        api: '/api/chat',
    } as any) as any;

    const isLoading = status === 'submitted' || status === 'streaming';

    // Call onRefresh whenever the AI finishes a turn (status goes from
    // loading → 'ready'). We track the previous status in a ref so we
    // only fire on the exact transition edge, not on every render.
    const prevStatusRef = useRef<string>(status);
    useEffect(() => {
        const wasLoading = prevStatusRef.current === 'submitted' || prevStatusRef.current === 'streaming';
        const isNowReady = status === 'ready';
        if (wasLoading && isNowReady && onRefresh) {
            onRefresh();
        }
        prevStatusRef.current = status;
    }, [status, onRefresh]);

    const isPerformingTask = isLoading && (
        messages.some((m: any) => (m.toolInvocations || []).some((ti: any) => ti.state === 'call'))
    );

    // Fetch employee projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch(`/api/employee/projects?userId=${userId}`);
                if (response.ok) {
                    const data = await response.json();
                    // API may return a flat array or { projects: [...] }
                    setProjects(Array.isArray(data) ? data : (data.projects || []));
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };
        fetchProjects();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalInput(value);

        // Detect autocomplete triggers: "for " or "project "
        const triggers = ['for ', 'project '];
        let triggerFound = false;
        let triggerPos = { start: 0, end: 0 };

        for (const trigger of triggers) {
            const lastIndex = value.toLowerCase().lastIndexOf(trigger);
            if (lastIndex !== -1) {
                const afterTrigger = value.slice(lastIndex + trigger.length);
                // Only show autocomplete if there's text after the trigger or it just ends with the trigger
                if (afterTrigger.length >= 0) {
                    triggerFound = true;
                    triggerPos = {
                        start: lastIndex + trigger.length,
                        end: value.length
                    };

                    // Filter projects based on text after trigger
                    const searchTerm = afterTrigger.toLowerCase();
                    const filtered = projects.filter(p =>
                        p.name.toLowerCase().includes(searchTerm)
                    );

                    setFilteredProjects(filtered);
                    setAutocompletePosition(triggerPos);
                    setSelectedIndex(0);
                    break;
                }
            }
        }

        setShowAutocomplete(triggerFound && filteredProjects.length > 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showAutocomplete) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredProjects.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredProjects.length) % filteredProjects.length);
        } else if (e.key === 'Enter' && filteredProjects.length > 0) {
            e.preventDefault();
            selectProject(filteredProjects[selectedIndex]);
        } else if (e.key === 'Escape') {
            setShowAutocomplete(false);
        }
    };

    const selectProject = (project: Project) => {
        // Replace the text after the trigger with the project name
        const beforeTrigger = localInput.slice(0, autocompletePosition.start);
        const newInput = beforeTrigger + project.name;
        setLocalInput(newInput);
        setShowAutocomplete(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!localInput.trim() || isLoading) return;

        const currentInput = localInput;
        setLocalInput('');

        try {
            await sendMessage({
                role: 'user',
                content: currentInput,
            });
        } catch (err: any) {
            console.error('[AIChat] Send error:', err);
        }
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset fallback picker selection when AI starts a new response
    useEffect(() => {
        if (status === 'submitted') setFallbackSelectedProject('');
    }, [status]);

    // Detect when the AI replied with text asking for project selection,
    // but did NOT call requestProjectSelection tool (the common failure case).
    const needsFallbackPicker = useMemo(() => {
        if (isLoading || !projects.length || !messages.length) return false;

        // Find the last assistant message
        const lastAsstMsg = [...messages].reverse().find((m: any) => m.role === 'assistant');
        if (!lastAsstMsg) return false;

        // Extract text content regardless of SDK format
        const text: string = typeof lastAsstMsg.content === 'string'
            ? lastAsstMsg.content
            : (lastAsstMsg.parts ?? [])
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join(' ');

        // Does the text ask to select a project?
        const asksForProject = /select.*project|which project|for which project|choose.*project|pick.*project|what project|please.*project|project.*please/i.test(text);
        if (!asksForProject) return false;

        // Don't show if the tool-based picker is already rendered
        const hasToolPicker = messages.some((m: any) =>
            (m.toolInvocations ?? []).some((ti: any) =>
                ti.toolName === 'requestProjectSelection' && ti.state === 'result' && ti.result?.requiresProjectSelection
            ) ||
            (m.parts ?? []).some((p: any) =>
                p.type === 'tool-invocation' &&
                p.toolInvocation?.toolName === 'requestProjectSelection' &&
                p.toolInvocation?.state === 'result' &&
                p.toolInvocation?.result?.requiresProjectSelection
            )
        );

        return !hasToolPicker;
    }, [messages, isLoading, projects]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* ... Floating Action Button code ... */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 group",
                    isOpen
                        ? "bg-slate-900 text-white rotate-90"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/40"
                )}
            >
                {isOpen ? <X size={28} /> : <Zap size={28} className="fill-current" />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[400px] h-[600px] bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Bot size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase tracking-widest text-[10px] text-blue-400 mb-0.5">Assistant</h3>
                                <p className="font-bold text-sm tracking-tight">{t('aiChat.title')}</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-relaxed max-w-[200px]">
                                    {t('aiChat.welcomeMessage')}
                                </p>
                            </div>
                        )}

                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={clsx(
                                    "flex items-start gap-3",
                                    m.role === 'user' ? "flex-row-reverse" : ""
                                )}
                            >
                                <div className={clsx(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                    m.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-blue-100 text-blue-600"
                                )}>
                                    {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={clsx(
                                    "max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                                    m.role === 'user'
                                        ? "bg-slate-900 text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                )}>
                                    {/* Robust Content Rendering */}
                                    {typeof m.content === 'string' ? (
                                        <p>{m.content}</p>
                                    ) : Array.isArray(m.parts) ? (
                                        m.parts.map((part: any, i: number) => {
                                            if (part.type === 'text') return <p key={i}>{part.text}</p>;
                                            if (part.type === 'tool-invocation') {
                                                const { toolName, state } = part.toolInvocation;
                                                return (
                                                    <div key={i} className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                                        {state === 'call' ? (
                                                            <>
                                                                <Loader2 size={12} className="animate-spin" />
                                                                {toolName === 'logWork' ? t('common.logging') : 'Processing activity'}...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                                Task complete
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })
                                    ) : (
                                        <p className="italic text-slate-400">Unsupported message format</p>
                                    )}

                                    {/* Tool Invocations (Alternative structure used by some SDK versions) */}
                                    {m.toolInvocations?.map((toolInvocation: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                            {toolInvocation.state === 'call' ? (
                                                <>
                                                    <Loader2 size={12} className="animate-spin" />
                                                    {toolInvocation.toolName === 'logWork' ? t('common.logging') : 'Processing...'}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                    Task complete
                                                </>
                                            )}
                                        </div>
                                    ))}

                                    {/* Project Selection UI - Radio Buttons (both SDK formats) */}
                                    {(() => {
                                        // Extract selection data from either SDK message format
                                        let selectionData: { projects: any[]; pendingAction: any } | null = null;

                                        // Format 1: m.parts (newer AI SDK)
                                        if (Array.isArray(m.parts)) {
                                            for (const part of m.parts) {
                                                if (
                                                    part.type === 'tool-invocation' &&
                                                    part.toolInvocation?.toolName === 'requestProjectSelection' &&
                                                    part.toolInvocation?.state === 'result' &&
                                                    part.toolInvocation?.result?.requiresProjectSelection
                                                ) {
                                                    selectionData = part.toolInvocation.result;
                                                    break;
                                                }
                                            }
                                        }

                                        // Format 2: m.toolInvocations (older AI SDK)
                                        if (!selectionData && Array.isArray(m.toolInvocations)) {
                                            for (const ti of m.toolInvocations) {
                                                if (
                                                    ti.toolName === 'requestProjectSelection' &&
                                                    ti.state === 'result' &&
                                                    ti.result?.requiresProjectSelection
                                                ) {
                                                    selectionData = ti.result;
                                                    break;
                                                }
                                            }
                                        }

                                        if (!selectionData) return null;

                                        const { projects: pickerProjects, pendingAction } = selectionData;
                                        const currentSelection = selectedProjects[m.id] ?? '';

                                        const handleConfirm = () => {
                                            if (!currentSelection) return;
                                            const project = pickerProjects.find((p: any) => p.id === currentSelection);
                                            if (!project) return;
                                            let actionText = '';
                                            if (pendingAction.type === 'logWork') {
                                                actionText = `Log ${pendingAction.hours}h on ${pendingAction.date} for ${project.name}`;
                                            } else {
                                                if (pendingAction.month) {
                                                    const [yr, mo] = pendingAction.month.split('-');
                                                    const monthName = new Date(parseInt(yr), parseInt(mo) - 1)
                                                        .toLocaleString('default', { month: 'long', year: 'numeric' });
                                                    actionText = `Log ${pendingAction.hoursPerDay}h for ${monthName} for ${project.name}`;
                                                } else {
                                                    actionText = `Log ${pendingAction.hoursPerDay}h from ${pendingAction.startDate} to ${pendingAction.endDate} for ${project.name}`;
                                                }
                                            }
                                            if (pendingAction.skipWeekends) actionText += ' skipping weekends';
                                            sendMessage({ text: actionText });
                                        };

                                        return (
                                            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                                    Select a project
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    {pickerProjects.map((project: any) => {
                                                        const isSelected = currentSelection === project.id;
                                                        return (
                                                            <label
                                                                key={project.id}
                                                                className={clsx(
                                                                    'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                                                                    isSelected
                                                                        ? 'border-blue-500 bg-white shadow-sm'
                                                                        : 'border-transparent bg-white/70 hover:border-blue-200 hover:bg-white'
                                                                )}
                                                            >
                                                                <span className={clsx(
                                                                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                                                    isSelected ? 'border-blue-500' : 'border-slate-300'
                                                                )}>
                                                                    {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                                                </span>
                                                                <input
                                                                    type="radio"
                                                                    name={`proj-${m.id}`}
                                                                    value={project.id}
                                                                    checked={isSelected}
                                                                    onChange={() => setSelectedProjects(prev => ({ ...prev, [m.id]: project.id }))}
                                                                    className="sr-only"
                                                                />
                                                                <span className="font-semibold text-sm text-slate-700">{project.name}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <button
                                                    onClick={handleConfirm}
                                                    disabled={!currentSelection || isLoading}
                                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-200"
                                                >
                                                    Confirm selection
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}

                        {/* Fallback project picker — shown when AI asks for a project in text
                            but didn't call requestProjectSelection tool */}
                        {needsFallbackPicker && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Bot size={16} />
                                </div>
                                <div className="max-w-[85%] bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm p-4">
                                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                            Select a project
                                        </p>
                                        <div className="flex flex-col gap-2">
                                            {projects.map((project: Project) => {
                                                const isSelected = fallbackSelectedProject === project.id;
                                                return (
                                                    <label
                                                        key={project.id}
                                                        className={clsx(
                                                            'flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all',
                                                            isSelected
                                                                ? 'border-blue-500 bg-white shadow-sm'
                                                                : 'border-transparent bg-white/70 hover:border-blue-200 hover:bg-white'
                                                        )}
                                                    >
                                                        <span className={clsx(
                                                            'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                                            isSelected ? 'border-blue-500' : 'border-slate-300'
                                                        )}>
                                                            {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                                        </span>
                                                        <input
                                                            type="radio"
                                                            name="fallback-proj"
                                                            value={project.id}
                                                            checked={isSelected}
                                                            onChange={() => setFallbackSelectedProject(project.id)}
                                                            className="sr-only"
                                                        />
                                                        <span className="font-semibold text-sm text-slate-700">{project.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => {
                                                const proj = projects.find(p => p.id === fallbackSelectedProject);
                                                if (!proj) return;
                                                sendMessage({ role: 'user', content: `Use project: ${proj.name}` });
                                                setFallbackSelectedProject('');
                                            }}
                                            disabled={!fallbackSelectedProject || isLoading}
                                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm shadow-blue-200"
                                        >
                                            Confirm selection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isLoading && !isPerformingTask && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center animate-pulse">
                                    <Bot size={16} />
                                </div>
                                <div className="space-y-2 max-w-[80%]">
                                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1 w-fit">
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[10px] font-black uppercase tracking-tighter text-blue-600 animate-pulse w-fit">
                                        <Loader2 size={12} className="animate-spin" />
                                        Assistant is thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                        {chatError && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold uppercase tracking-widest">
                                Error: {chatError.message}
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-t border-slate-100">
                        <div className="relative">
                            {/* Autocomplete Dropdown */}
                            {showAutocomplete && filteredProjects.length > 0 && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-10">
                                    {filteredProjects.map((project, index) => (
                                        <button
                                            key={project.id}
                                            type="button"
                                            onClick={() => selectProject(project)}
                                            className={clsx(
                                                "w-full px-4 py-3 text-left transition-all font-bold text-sm",
                                                index === selectedIndex
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white text-slate-700 hover:bg-blue-50"
                                            )}
                                        >
                                            {project.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <input
                                value={localInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={t('aiChat.placeholder')}
                                className="w-full pl-4 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none font-bold text-xs uppercase tracking-widest text-slate-700 placeholder:text-slate-300 shadow-sm"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !localInput.trim()}
                                className="absolute right-2 top-2 w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 shadow-lg"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
