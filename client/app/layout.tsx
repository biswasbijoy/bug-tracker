import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono-face' });

export const metadata: Metadata = {
  title: { default: 'Tracker', template: '%s · Tracker' },
  description: 'A focused ticket tracker for QA and dev teams',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f8' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d10' },
  ],
};

// Runs before hydration so the page never flashes the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.add(d?'dark':'light')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--panel)',
                color: 'var(--fg)',
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-md)',
                fontSize: '13px',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--panel)' } },
              error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--panel)' } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
