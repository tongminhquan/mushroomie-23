import { BRAND } from '@/lib/local-seo'

export interface GeoImageSchemaOptions {
  name: string
  caption?: string | null
  description?: string | null
  width?: number
  height?: number
}

export function storeContentLocationSchema() {
  return {
    '@type': 'Place',
    name: BRAND.legalName,
    url: BRAND.mapUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.streetAddress,
      addressLocality: BRAND.addressLocality,
      addressRegion: BRAND.addressRegion,
      addressCountry: BRAND.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BRAND.geo.latitude,
      longitude: BRAND.geo.longitude,
    },
  }
}

export function geoImageObject(url: string, options: GeoImageSchemaOptions) {
  return {
    '@type': 'ImageObject',
    '@id': url + '#imageobject',
    url,
    contentUrl: url,
    name: options.name,
    ...(options.caption ? { caption: options.caption } : {}),
    ...(options.description ? { description: options.description } : {}),
    ...(options.width ? { width: options.width } : {}),
    ...(options.height ? { height: options.height } : {}),
    contentLocation: storeContentLocationSchema(),
    creator: {
      '@type': 'Organization',
      name: BRAND.name,
      url: 'https://mushroomie.io.vn',
    },
    copyrightHolder: {
      '@type': 'Organization',
      name: BRAND.legalName,
    },
  }
}

export function geoImageGraph(
  images: Array<{ url: string; name: string; caption?: string | null }>,
) {
  const uniqueImages = [...new Map(images.map((image) => [image.url, image])).values()]

  return {
    '@context': 'https://schema.org',
    '@graph': uniqueImages.map((image) => geoImageObject(image.url, image)),
  }
}
