// lib/config.ts
// ============================================================================
// CENTRALE BEDRIJFSCONFIGURATIE  —  TEMPLATE
// ----------------------------------------------------------------------------
// Dit is het ENIGE bestand met klantgegevens. Vul het volledig in voor een
// nieuwe site. Hardcodeer deze waarden NOOIT ergens anders in de codebase.
//
//   NIEUWE SITE = dit bestand invullen + globals.css kleuren + .env + SQL.
//   Zie NIEUWE_SITE.md voor de volledige volgorde.
// ============================================================================
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  INVULLIJST — loop dit af, verwijder een regel zodra 'ie klaar is:    │
// │                                                                       │
// │  [ ] naam / naamKort / naamJuridisch                                  │
// │  [ ] tagline + hero (titel, ondertitel, 2 knoppen)                    │
// │  [ ] contact (email, telefoon, telefoonLink)                          │
// │  [ ] adres (incl. gemeente)                                           │
// │  [ ] juridisch (kvk, btw, iban)  ← nodig vóór de eerste factuur       │
// │  [ ] mail (afzender + antwoordadres)                                  │
// │  [ ] order.prefix / factuurPrefix                                     │
// │  [ ] opbouw.categorieen (welke attracties opbouw nodig hebben)        │
// │  [ ] bezorging.eigenGemeentePlaatsen                                  │
// │  [ ] kleuren.primairHex / accentHex  (+ globals.css!)                 │
// │  [ ] seo (titelSuffix, beschrijving, ogImage)                         │
// │  [ ] social (leeg laten = knop verschijnt niet)                       │
// └─────────────────────────────────────────────────────────────────────┘

export const BEDRIJF = {
  // --- Identiteit ---------------------------------------------------------
  naam: 'VUL IN: Bedrijfsnaam',
  naamKort: 'VUL IN: Korte naam',
  naamJuridisch: 'VUL IN: Tenaamstelling bankrekening',
  tagline: 'VUL IN: korte pakkende zin over wat je verhuurt en waar',
  domein: 'https://www.VULIN.nl',

  // --- Homepage hero ------------------------------------------------------
  // De grote kop, ondertitel en twee knoppen bovenaan de homepage.
  // knop.cat verwijst naar een categorienaam (/assortiment?cat=...).
  hero: {
    titel: 'VUL IN: hoofdkop van de homepage',
    ondertitel: 'VUL IN: ondertitel — waar sta je voor, voor wie',
    knop1: { label: 'VUL IN', cat: 'springkussen' },
    knop2: { label: 'VUL IN', cat: 'stormbaan' },
  },

  // --- Contact ------------------------------------------------------------
  contact: {
    email: 'VUL IN: info@bedrijf.nl',
    telefoon: 'VUL IN: 06-00000000',
    telefoonLink: 'VUL IN: +31600000000',   // internationaal, geen spaties
  },

  // --- Vestigingsadres ----------------------------------------------------
  adres: {
    straat: 'VUL IN: Straatnaam 1',
    postcode: 'VUL IN: 0000 XX',
    plaats: 'VUL IN: Plaats',
    gemeente: 'VUL IN: Gemeente',
    provincie: 'VUL IN: Provincie',
    land: 'Nederland',
  },

  // --- Juridisch / financieel --------------------------------------------
  juridisch: {
    kvk: '00000000',                    // TODO: KvK-nummer
    btw: 'NL000000000B00',              // TODO: btw-nummer
    iban: 'NL00BANK0000000000',         // TODO: IBAN
    btwTarief: 0.21,
  },

  // --- E-mail (Resend) ----------------------------------------------------
  // LET OP: afzenderdomein moet geverifieerd zijn in Resend.
  mail: {
    afzenderNaam: 'VUL IN: Bedrijfsnaam',
    afzenderAdres: 'VUL IN: info@bedrijf.nl',
    antwoordAdres: 'VUL IN: info@bedrijf.nl',
    // BCC per mailsoort. Leeg laten = geen BCC.
    bccBestelling: [] as string[],
    bccDagstart: [] as string[],
    bccFactuur: [] as string[],
  },

  // --- Orders & facturen --------------------------------------------------
  order: {
    prefix: 'VUL IN: XXX-',             // bijv. PVH-, KVE-
    factuurPrefix: 'VUL IN: XXX',
    factuurStartNummer: 1,
  },

  // --- Opbouwcategorieën --------------------------------------------------
  // Categorieën waarvoor de klant een ondergrond en haspel kiest, waarvoor
  // het laadprofiel meetelt in de planning, waarvoor het opbouwtarief geldt,
  // en waarvoor de veiligheidsregels in de bevestigingsmail komen.
  //
  // Voeg hier een categorie toe en alles verspreid door de app volgt vanzelf.
  // Standaard: springkussen + stormbaan. Pas aan naar het aanbod van de klant.
  opbouw: {
    categorieen: ['springkussen', 'stormbaan'] as string[],
    // Hoe we het artikel benoemen in mails. Sleutel = categorienaam.
    termen: {
      springkussen: 'het springkussen',
      stormbaan: 'de stormbaan',
    } as Record<string, string>,
    // Gebruikt wanneer een order meerdere opbouwcategorieën bevat.
    termAlgemeen: 'de attractie',
  },

  // --- Bezorging ----------------------------------------------------------
  // TODO: tarieven en kernen afstemmen met de klant.
  bezorging: {
    afhalenGratis: true,
    tariefBinnenGemeente: 10,
    tariefBuitenGemeente: 20,
    // Hoger tarief zodra er een opbouwcategorie in de winkelwagen zit.
    tariefOpbouwBinnenGemeente: 15,
    tariefOpbouwBuitenGemeente: 25,
    // Woonplaatsen (kleine letters) die als "binnen gemeente" gelden.
    eigenGemeentePlaatsen: [
      // 'plaats1', 'plaats2',
    ] as string[],
    gratisAfhaalTekst: 'VUL IN: Zelf ophalen in <plaats>? Dat kan ook, en is gratis.',
  },

  // --- Huisstijl ----------------------------------------------------------
  // LET OP: de kleuren zelf staan in app/globals.css (:root-blok). Pas daar
  // de --color-primary-* en --color-accent-* schalen aan. Deze hex-waarden
  // zijn alleen voor inline styles, meta-theme-color en PDF's — NOOIT als
  // `bg-${BEDRIJF.kleuren.primair}-600`, want dat wordt weggepurged.
  kleuren: {
    primair: 'orange',                  // niet wijzigen (zie globals.css)
    accent: 'sky',                      // niet wijzigen (zie globals.css)
    primairHex: '#000000',              // VUL IN: primaire kleur (hex)
    accentHex: '#000000',               // VUL IN: accentkleur (hex)
  },

  // --- SEO ----------------------------------------------------------------
  seo: {
    titelSuffix: ' | VUL IN: Bedrijfsnaam',
    standaardBeschrijving:
      'VUL IN: SEO-beschrijving — wat verhuur je, in welke plaatsen, ' +
      'wat maakt je uniek. 1 à 2 zinnen.',
    ogImage: '/og-VULIN.jpg',           // TODO: afbeelding uploaden naar public/
  },

  // --- Externe kanalen (leeg = knop/link wordt niet getoond) --------------
  social: {
    facebook: '',
    instagram: '',
    whatsapp: '',                       // internationaal zonder +, bijv. 31600000000
    googleReview: '',
  },
}

// ============================================================================
// AFGELEIDE WAARDEN — niet handmatig aanpassen
// ============================================================================

/** Volledig adres op één regel: "Straatnaam 1, 0000 XX Plaats" */
export const ADRES_REGEL =
  `${BEDRIJF.adres.straat}, ${BEDRIJF.adres.postcode} ${BEDRIJF.adres.plaats}`

/** Adres + telefoon, voor mailfooters */
export const ADRES_MET_TELEFOON =
  `${ADRES_REGEL} - ${BEDRIJF.contact.telefoon}`

/** Adres + KvK, voor factuurvoetteksten */
export const ADRES_MET_KVK =
  `${ADRES_REGEL} · KvK ${BEDRIJF.juridisch.kvk}`

/** URL-safe adres voor Google Maps-links */
export const MAPS_QUERY = encodeURIComponent(ADRES_REGEL)

/** Google Maps-link naar de vestiging */
export const MAPS_URL =
  `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`

/** Resend from-header: "Naam <info@bedrijf.nl>" */
export const MAIL_FROM =
  `${BEDRIJF.mail.afzenderNaam} <${BEDRIJF.mail.afzenderAdres}>`

/** Domein zonder protocol en www, voor weergave in mails */
export const DOMEIN_LABEL =
  BEDRIJF.domein.replace('https://www.', '').replace('https://', '')

/**
 * Backwards compatible.
 * Bestaande imports van HOOFDDOMEIN blijven werken.
 */
export const HOOFDDOMEIN = BEDRIJF.domein

// ============================================================================
// OPBOUW — hulpfuncties
// ============================================================================

/** Heeft dit product opbouw nodig (ondergrond, haspel, laadprofiel)? */
export function heeftOpbouw(categorie?: string | null): boolean {
  if (!categorie) return false
  return BEDRIJF.opbouw.categorieen.includes(categorie.trim().toLowerCase())
}

/**
 * Mailcategorieën die de opbouw-blokken (huisregels, onweerinstructies)
 * in de bevestigingsmail krijgen. 'opbouw' = order met meerdere soorten.
 */
export function isOpbouwMailCategorie(categorie: string): boolean {
  return categorie === 'opbouw' || heeftOpbouw(categorie)
}

/** "het springkussen", "de stormbaan" of "de attractie" — voor mailteksten. */
export function opbouwTerm(categorie: string): string {
  return BEDRIJF.opbouw.termen[categorie] ?? BEDRIJF.opbouw.termAlgemeen
}

/**
 * Bepaalt welke tekstvariant de bevestigingsmail krijgt, op basis van de
 * categorieën van alle artikelen in de order.
 *
 *   'springkussen' / 'stormbaan' — order bevat alleen dat type
 *   'opbouw'                     — meerdere opbouwcategorieën door elkaar
 *   'opblaas'                    — opblaasfiguren
 *   'overig'                     — de rest
 */
export function bepaalMailCategorie(
  categorieen: (string | null | undefined)[]
): string {
  const schoon = categorieen
    .map(c => (c ?? '').trim().toLowerCase())
    .filter(Boolean)
  if (schoon.length === 0) return 'overig'

  const opbouwCategorieen = Array.from(new Set(schoon.filter(c => heeftOpbouw(c))))
  if (opbouwCategorieen.length === 1) return opbouwCategorieen[0]
  if (opbouwCategorieen.length > 1) return 'opbouw'

  if (schoon[0].includes('opblaas')) return 'opblaas'
  return 'overig'
}

/** Valt deze woonplaats binnen de eigen gemeente (goedkoper bezorgtarief)? */
export function valtBinnenGemeente(plaats?: string | null): boolean {
  if (!plaats) return false
  return BEDRIJF.bezorging.eigenGemeentePlaatsen.includes(
    plaats.trim().toLowerCase()
  )
}

// ============================================================================
// CROSS-SELL
// Welke categorieën toon je onder een product als "Maak je feest compleet".
// Pas gerust aan — geen code nodig, alleen deze lijst.
// ============================================================================

export const CROSS_SELL: Record<string, string[]> = {
  springkussen: ['stormbaan', 'opblaasfiguren'],
  stormbaan: ['springkussen', 'opblaasfiguren'],
  opblaasfiguren: ['springkussen', 'stormbaan'],
}
