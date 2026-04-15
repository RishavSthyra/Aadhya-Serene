import { flatsData } from '@/lib/flats';
import { SITE_URL, staticSitemapRoutes } from '@/lib/seo';

export const dynamic = 'force-dynamic';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createUrlEntry({ url, lastModified, changeFrequency, priority }) {
  return [
    '  <url>',
    `    <loc>${escapeXml(url)}</loc>`,
    `    <lastmod>${escapeXml(lastModified)}</lastmod>`,
    `    <changefreq>${escapeXml(changeFrequency)}</changefreq>`,
    `    <priority>${escapeXml(priority.toFixed(1))}</priority>`,
    '  </url>',
  ].join('\n');
}

function buildStaticEntries(timestamp) {
  return staticSitemapRoutes.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    lastModified: timestamp,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

function buildApartmentEntries(timestamp) {
  return flatsData.map((flat) => ({
    url: new URL(`/apartments/${flat.id}`, SITE_URL).toString(),
    lastModified: timestamp,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}

export function GET() {
  const timestamp = new Date().toISOString();
  const entries = [...buildStaticEntries(timestamp), ...buildApartmentEntries(timestamp)];
  const body = entries.map(createUrlEntry).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="${SITE_URL}/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
