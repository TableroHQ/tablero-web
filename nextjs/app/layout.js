import './globals.css';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { StoreProvider } from '@/lib/store';
import { Toaster } from 'sonner';
import RoleSwitcher from '@/components/RoleSwitcher';
import LiveSimulator from '@/components/LiveSimulator';
import ErrorBoundary from '@/components/ErrorBoundary';
import ThemeApplier from '@/components/ThemeApplier';
import AccessToast from '@/components/AccessToast';

export const metadata = {
  title: 'Tablero — Restaurant Operating System',
  description: 'A full-stack platform connecting every actor in the restaurant lifecycle.',
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreProvider>
            <ThemeApplier />
            <Suspense fallback={null}><AccessToast /></Suspense>
            <LiveSimulator />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <RoleSwitcher />
            <Toaster
              position="top-right"
              theme="light"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: '#fff',
                  border: '1px solid #E8E4DF',
                  borderRadius: '16px',
                  fontFamily: 'Figtree, sans-serif',
                },
              }}
            />
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
