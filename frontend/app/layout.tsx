import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Global Election & Political Stability Command Center',
  description: 'Bloomberg Terminal meets CIA command center - real-time political intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.add(t);})()`,
          }}
        />
      </head>
      <body className="bg-[#0a0e17] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
