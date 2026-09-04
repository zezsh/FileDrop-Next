import type { Metadata, Viewport } from 'next';
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'File Drop | File Sharing Platform',
  description:
    'File Drop is a file sharing platform that allows you to share files with your friends and family.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased")}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
