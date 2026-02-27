import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from './i18n'

export const metadata: Metadata = {
    title: 'Project Cost Management',
    description: 'Internal project cost management system',
    icons: {
        icon: '/favicon.ico',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </body>
        </html>
    )
}
