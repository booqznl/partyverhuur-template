// app/layout.tsx
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { BEDRIJF, HOOFDDOMEIN } from '@/lib/config'
import PageviewTracker from '@/components/PageviewTracker'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
})

const LOGO = `${BEDRIJF.domein}${BEDRIJF.seo.ogImage}`
// Titel = naam + tagline uit de config. Vul de tagline per klant in.
const TITEL = `${BEDRIJF.naam} – ${BEDRIJF.tagline}`

export const metadata: Metadata = {
  metadataBase: new URL(HOOFDDOMEIN),
  title: TITEL,
  description: BEDRIJF.seo.standaardBeschrijving,
  openGraph: {
    title: TITEL,
    description: BEDRIJF.seo.standaardBeschrijving,
    url: HOOFDDOMEIN,
    siteName: BEDRIJF.naam,
    images: [{ url: LOGO, width: 1200, height: 630, alt: BEDRIJF.naam }],
    locale: 'nl_NL',
    type: 'website',
  },
}

const bedrijfsSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: BEDRIJF.naam,
  description: BEDRIJF.seo.standaardBeschrijving,
  image: LOGO,
  '@id': BEDRIJF.domein,
  url: BEDRIJF.domein,
  telephone: BEDRIJF.contact.telefoonLink,
  email: BEDRIJF.contact.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: BEDRIJF.adres.straat,
    postalCode: BEDRIJF.adres.postcode,
    addressLocality: BEDRIJF.adres.plaats,
    addressRegion: BEDRIJF.adres.provincie,
    addressCountry: 'NL',
  },
  // Bediende plaatsen: eigen plaats + gemeente + de werkgebied-kernen
  // uit de config. Geen hardcoded plaatsnamen meer.
  areaServed: Array.from(new Set([
    BEDRIJF.adres.plaats,
    BEDRIJF.adres.gemeente,
    ...BEDRIJF.bezorging.eigenGemeentePlaatsen.map(
      p => p.charAt(0).toUpperCase() + p.slice(1)
    ),
  ])),
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '08:00',
    closes: '22:00',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={plusJakartaSans.variable}>
      <head>
        <meta name="theme-color" content={BEDRIJF.kleuren.primairHex} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bedrijfsSchema) }}
        />
      </head>
      <body>
        <PageviewTracker />
        {children}
      </body>
    </html>
  )
}
