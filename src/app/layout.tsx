import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/providers/AuthProvider'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { LanguageProvider } from '@/providers/LanguageProvider'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/toaster'
import { OnboardingTour, OnboardingTourProvider } from '@/components/OnboardingTour'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ListTrack',
  description: 'Track and organize your lists efficiently. Create, manage, and share your lists with ease.',
  applicationName: 'ListTrack',
  authors: [{ name: 'draakiiii', url: 'https://x.com/draakiiii' }],
  keywords: ['list', 'organization', 'productivity', 'task management', 'personal lists'],
  creator: 'draakiiii',
  publisher: 'draakiiii',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <OnboardingTourProvider>
                <Navbar />
                <OnboardingTour />
                <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
                  {children}
                </main>
                <Toaster />
              </OnboardingTourProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 