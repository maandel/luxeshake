import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LuxeShake',
    short_name: 'LuxeShake',
    description: 'Premium milkshakes, smoothies, and parfaits crafted for connoisseurs.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1A0F0A',
    theme_color: '#d4af37',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
