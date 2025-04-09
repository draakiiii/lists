import type { Metadata } from 'next'
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
  title: 'ListTrack - Personal List Management Platform',
  description: 'Track and organize your lists',
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