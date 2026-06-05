const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mushroomie.io.vn';

export function toAbsoluteUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return `${SITE_URL}/mushroomie-og.jpg`; // Default OG image
  if (pathOrUrl.startsWith('http://localhost') || pathOrUrl.startsWith('http://127.0.0.1')) {
    try {
      const url = new URL(pathOrUrl);
      return `${SITE_URL}${url.pathname}${url.search}`;
    } catch {
      return SITE_URL;
    }
  }
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function sanitizeCallbackUrl(url?: string | null): string {
  if (!url) return '/'
  if (url.startsWith('http') || url.startsWith('//')) {
    // Only allow absolute URLs if they match our domain
    if (url.startsWith(SITE_URL)) return url
    return '/'
  }
  return url.startsWith('/') ? url : `/${url}`
}

export function toPublicImageUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl) return '/logo.png'; // Fallback Mushroomie placeholder

  if (pathOrUrl.startsWith('http://localhost') || pathOrUrl.startsWith('http://127.0.0.1')) {
    try {
      const url = new URL(pathOrUrl);
      return `${SITE_URL}${url.pathname}${url.search}`;
    } catch {
      return SITE_URL;
    }
  }

  if (pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('http://')) {
    return pathOrUrl;
  }

  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
