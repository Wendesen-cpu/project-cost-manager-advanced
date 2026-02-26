import type { Metadata } from 'next'
import './globals.css'

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
            <body>{children}</body>
        </html>
    )
}
