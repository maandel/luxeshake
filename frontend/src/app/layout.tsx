import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../context/ToastContext';
import { Libre_Caslon_Text, DM_Sans } from 'next/font/google';

const libreCaslon = Libre_Caslon_Text({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-libre-caslon'
});

const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans'
});

export const metadata: Metadata = {
  title: 'LuxeShake',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${libreCaslon.variable} ${dmSans.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
        <script src="https://js.paystack.co/v1/inline.js" async defer></script>
      </head>
      <body className="font-body-md selection:bg-gold-leaf selection:text-cacao-black antialiased" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
