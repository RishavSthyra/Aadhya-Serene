const SITE_NAME = 'Aadhya Serene';
const SITE_URL = 'https://aadhyaserene.com';
const DEFAULT_OG_IMAGE =
  'https://cdn.sthyra.com/AADHYA%20SERENE/images/analog-landscape-city-with-buildings%20(1).jpg';

function stripExtraWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function ensureMaxDescriptionLength(description, maxLength = 160) {
  const normalized = stripExtraWhitespace(description);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const safeSlice = normalized.slice(0, maxLength + 1);
  const lastSpace = safeSlice.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return safeSlice.slice(0, lastSpace).trim();
  }

  return normalized.slice(0, maxLength).trim();
}

function formatTitle(title) {
  if (!title || title === SITE_NAME) {
    return SITE_NAME;
  }

  return `${title} | ${SITE_NAME}`;
}

function buildCanonicalUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return new URL(normalizedPath, SITE_URL).toString();
}

function normalizeKeywords(keywords = []) {
  return keywords.filter(Boolean);
}

export function createPageMetadata({
  title,
  description,
  path = '/',
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  robots,
  type = 'website',
}) {
  const resolvedDescription = ensureMaxDescriptionLength(description);
  const canonical = buildCanonicalUrl(path);
  const fullTitle = formatTitle(title);
  const resolvedKeywords = normalizeKeywords(keywords);

  return {
    title,
    description: resolvedDescription,
    keywords: resolvedKeywords,
    alternates: {
      canonical,
    },
    robots:
      robots ??
      {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
    openGraph: {
      type,
      locale: 'en_IN',
      url: canonical,
      siteName: SITE_NAME,
      title: fullTitle,
      description: resolvedDescription,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: resolvedDescription,
      images: [image],
    },
  };
}

export const rootMetadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: ensureMaxDescriptionLength(
    'Discover Aadhya Serene, premium 2 and 3 BHK apartments in Thanisandra, Bengaluru with curated amenities, walkthroughs, floor plans, and location insights.',
  ),
  applicationName: SITE_NAME,
  category: 'Real Estate',
  keywords: [
    'Aadhya Serene',
    'apartments in Thanisandra',
    '2 BHK apartments in Bengaluru',
    '3 BHK apartments in Bengaluru',
    'luxury apartments in North Bengaluru',
    'Thanisandra apartments',
    'Abhigna Constructions',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: ensureMaxDescriptionLength(
      'Discover Aadhya Serene, premium 2 and 3 BHK apartments in Thanisandra, Bengaluru with curated amenities, walkthroughs, floor plans, and location insights.',
    ),
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: ensureMaxDescriptionLength(
      'Discover Aadhya Serene, premium 2 and 3 BHK apartments in Thanisandra, Bengaluru with curated amenities, walkthroughs, floor plans, and location insights.',
    ),
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export const staticSitemapRoutes = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/apartments', changeFrequency: 'daily', priority: 0.95 },
  { path: '/amenities', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/walkthrough', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/location', changeFrequency: 'weekly', priority: 0.85 },
  { path: '/contact', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/interior-panos', changeFrequency: 'weekly', priority: 0.7 },
];

export {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  buildCanonicalUrl,
  ensureMaxDescriptionLength,
  formatTitle,
};
