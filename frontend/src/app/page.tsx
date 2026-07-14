import HomePageClient from './HomePageClient';

export const revalidate = 60; // Revalidate at most every 60 seconds

async function getSiteContent() {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    // By default, this will run on the server
    const res = await fetch(`${url}/site-content`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function Page() {
  const content = await getSiteContent();
  return <HomePageClient initialSiteContent={content} />;
}
