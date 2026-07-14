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
  title: 'LuxeShake - Premium Milkshakes & Parfaits',
  description: 'Experience the finest handcrafted milkshakes, smoothies, and parfaits. Luxury in every sip.',
  openGraph: {
    title: 'LuxeShake',
    description: 'Experience the finest handcrafted milkshakes, smoothies, and parfaits. Luxury in every sip.',
    url: 'https://luxeshake.com',
    siteName: 'LuxeShake',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LuxeShake Premium Milkshakes',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LuxeShake',
    description: 'Experience the finest handcrafted milkshakes, smoothies, and parfaits.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'LuxeShake',
  image: 'https://luxeshake.com/og-image.jpg',
  description: 'Premium milkshakes, smoothies, and parfaits.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'LuxeShake Lounge',
    addressLocality: 'Enugu',
    addressRegion: 'EN',
    addressCountry: 'NG'
  },
  servesCuisine: 'Desserts, Milkshakes, Smoothies',
  priceRange: '$$',
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
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </ToastProvider>
      </body>
    </html>
  );
}
