'use client'

import { useState } from 'react'

type Language = 'EN' | 'IT'

export default function SidebarLanguageSwitcher() {
    const [active, setActive] = useState<Language>('EN')

    return (
        <div
            className="flex items-center justify-center p-[7px] w-full rounded-2xl border border-solid"
            style={{
                backgroundColor: 'rgba(29, 41, 61, 0.5)',
                borderColor: 'rgba(49, 65, 88, 0.3)',
            }}
            data-component="SidebarLanguageSwitcher"
        >
            {(['EN', 'IT'] as Language[]).map((lang) => {
                const isSelected = active === lang
                return (
                    <button
                        key={lang}
                        onClick={() => setActive(lang)}
                        className="relative flex-1 flex items-center justify-center py-1.5 rounded-xl transition-colors"
                        style={
                            isSelected
                                ? { backgroundColor: '#314158' }
                                : undefined
                        }
                    >
                        {isSelected && (
                            <div
                                className="absolute inset-0 rounded-xl pointer-events-none"
                                style={{
                                    boxShadow:
                                        '0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)',
                                }}
                            />
                        )}
                        <span
                            className={`relative text-xs font-bold leading-4 ${isSelected ? 'text-white' : 'text-[#62748E]'
                                }`}
                            style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                            {lang}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
