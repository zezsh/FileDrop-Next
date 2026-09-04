import type { Metadata, Viewport } from 'next';
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'ZEZ | Web Development Agency',
  description:
    'ZEZ is a web development agency that specializes in creating custom websites and web applications for businesses and organizations.',
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
