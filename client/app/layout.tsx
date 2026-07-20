import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { KeyboardShortcutProvider } from '@/hooks/useKeyboardShortcuts';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SQA Ticket Tracker',
  description: 'Personal ticket management dashboard for SQA engineers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <KeyboardShortcutProvider>
            {children}
          </KeyboardShortcutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
