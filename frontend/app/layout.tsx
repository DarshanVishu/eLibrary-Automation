import './globals.css';
import { AppProviders } from '@/components/providers/app-providers';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { getPlatformName } from '@/lib/actions/settings';
import '@/lib/polyfills/promise-with-resolvers';
import type { Metadata } from 'next';
import localFont from 'next/font/local';

// Font files are committed to /public/fonts so the Docker build succeeds on
// the intranet server without any outbound internet access. Previously these
// were loaded via next/font/google which contacts fonts.googleapis.com at
// build time — breaking offline builds.
const fontSans = localFont({
  src: '../public/fonts/nunito/nunito-latin-variable.woff2',
  variable: '--font-sans',
  // Nunito variable font covers weight 200–900; declare the full range.
  style: 'normal',
  weight: '200 900',
});

const fontSerif = localFont({
  src: '../public/fonts/nunito/nunito-latin-variable.woff2',
  variable: '--font-serif',
  style: 'normal',
  weight: '200 900',
});

const fontMono = localFont({
  src: [
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2',          weight: '400', style: 'normal' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Italic.woff2',           weight: '400', style: 'italic' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Medium.woff2',           weight: '500', style: 'normal' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Medium-Italic.woff2',    weight: '500', style: 'italic' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Bold.woff2',             weight: '700', style: 'normal' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-Bold-Italic.woff2',      weight: '700', style: 'italic' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-ExtraBold.woff2',        weight: '800', style: 'normal' },
    { path: '../public/fonts/jetbrains-mono/JetBrainsMono-ExtraBold-Italic.woff2', weight: '800', style: 'italic' },
  ],
  variable: '--font-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  const platformName = await getPlatformName();
  return {
    title: platformName,
    description: 'eLibrary management system for students and teachers',
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={['light', 'dark', 'student']}
        >
          <AppProviders>{children}</AppProviders>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
