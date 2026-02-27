'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import enTranslations from '../locales/en.json'
import itTranslations from '../locales/it.json'

// Create a basic dictionary type from the English translations
type Dictionary = typeof enTranslations

type Language = 'en' | 'it'

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const translations: Record<Language, any> = {
    en: enTranslations,
    it: itTranslations,
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Load preference from localStorage on mount
        const saved = localStorage.getItem('language') as Language
        if (saved === 'it' || saved === 'en') {
            setLanguageState(saved)
        }
        setMounted(true)
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem('language', lang)
    }

    // Nested deeply accessed properties helper "dashboard.title" -> dict["dashboard"]["title"]
    const t = (key: string): string => {
        if (!mounted) {
            // Return the english key by default during SSR to avoid mismatch
            // Or return the key itself
            return getNested(enTranslations, key) || key
        }
        const currentDict = translations[language]
        const value = getNested(currentDict, key)
        return value || key
    }

    const getNested = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
