import { Poppins } from 'next/font/google'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import './globals.css'

import { ThemeProvider } from '@/components/theme-provider'
import { ResizePanel } from '@/components/layout/resize-panel'

const poppins = Poppins({
  subsets: ['latin-ext'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  fallback: ['system-ui', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'examor',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(poppins.className, 'min-h-screen')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem>
          <ResizePanel>{children}</ResizePanel>
        </ThemeProvider>
      </body>
    </html>
  )
}
