// app/admin/facturen/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BEDRIJF } from '@/lib/config'

type Boeking = {
  id: string
  referentie: string
  voornaam: string
  achternaam: string
  email: string
  telefoon: string
  start_datum: string
  eind_datum: string
  straat: string
  postcode: string
  plaats: string
  bezorg_wijze: string
  opmerkingen: string | null
  artikel_totaal: number
  bezorg_kosten: number
  btw: number
  totaal_incl: number
  betaal_wijze: string
  status: string
  factuur_status: string
  factuurnummer: number | null
  aangemaakt_op: string
}

type SortVeld = 'factuurnummer' | 'klant' | 'aanmaakdatum' | 'huurperiode'

function printFactuur(b: Boeking, items?: any[]) {
  const factuurNr = b.factuurnummer ? String(b.factuurnummer) : null
  const isConcept = !b.factuurnummer
  const exclBtw = ((b.totaal_incl || 0) - (b.btw || 0))
  const betaalDatum = new Date(b.aangemaakt_op)
  betaalDatum.setDate(betaalDatum.getDate() + 14)
  const betaalDatumStr = betaalDatum.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const huurperiode = `${new Date(b.start_datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'numeric', year: 'numeric' })} t/m ${new Date(b.eind_datum).toLocaleDateString('nl-NL', { day: 'numeric', month: 'numeric', year: 'numeric' })}`

  const bezorgRegel = b.bezorg_wijze === 'ophalen' ? '' : `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">
            Bezorging/Opzetten/Afbouwen/Ophalen ${b.bezorg_wijze === 'binnen' ? 'binnen' : 'buiten'} Gemeente ${BEDRIJF.adres.gemeente}
          </td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">1</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">21%</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;">€ ${((b.bezorg_kosten || 0) / 1.21).toFixed(2)}</td>
        </tr>`

  const artikelRijen = items && items.length > 0
    ? items.map(i => {
        const extraRegels: string[] = []
        if (i.ondergrond) {
          const bedrag = (Number(i.ondergrond_meerprijs) || 0) / 1.21
          extraRegels.push(`
        <tr>
          <td style="padding:8px 8px 8px 20px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Ondergrond: ${i.ondergrond}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">1</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">21%</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;color:#6b7280;">€ ${bedrag.toFixed(2)}</td>
        </tr>`)
        }
        if (i.haspel === 'ja') {
          const bedrag = (Number(i.haspel_meerprijs) || 0) / 1.21
          extraRegels.push(`
        <tr>
          <td style="padding:8px 8px 8px 20px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Stroomhaspel (25m)</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">1</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280;">21%</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:12px;color:#6b7280;">€ ${bedrag.toFixed(2)}</td>
        </tr>`)
        }
        return `
        <tr>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">${i.product_naam}${i.aantal > 1 ? ` (${i.aantal}x)` : ''}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">${i.aantal}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">21%</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;">€ ${(i.subtotaal / 1.21).toFixed(2)}</td>
        </tr>` + extraRegels.join('')
      }).join('') + bezorgRegel
    : `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:13px;">Verhuur artikelen</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">1</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;">21%</td>
        <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;">€ ${((b.artikel_totaal || 0) / 1.21).toFixed(2)}</td>
      </tr>` + bezorgRegel

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<title>Factuur ${factuurNr || 'CONCEPT'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: white; }
  .pagina { max-width: 794px; margin: 0 auto; padding: 48px 48px 0; min-height: 1123px; display: flex; flex-direction: column; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .factuur-titel { font-size: 22px; font-weight: 900; text-decoration: underline; margin-bottom: 20px; }
  .logo { text-align: right; }
  .logo img { height: 70px; }
  .klant-info { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .klant-links { font-size: 13px; line-height: 1.8; }
  .klant-links strong { display: block; }
  .factuur-meta { font-size: 13px; line-height: 1.8; }
  .factuur-meta table { border-collapse: collapse; }
  .factuur-meta td { padding: 1px 0; }
  .factuur-meta td:first-child { padding-right: 16px; color: #374151; }
  .referentie { margin-bottom: 8px; font-size: 13px; }
  .opmerkingen { margin-bottom: 20px; font-size: 13px; }
  .artikelen-tabel { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .artikelen-tabel thead tr { border-bottom: 1px solid #1a1a1a; }
  .artikelen-tabel th { padding: 8px; font-style: italic; font-weight: normal; font-size: 13px; text-align: left; }
  .artikelen-tabel th:nth-child(2), .artikelen-tabel th:nth-child(3) { text-align: center; }
  .artikelen-tabel th:nth-child(4) { text-align: right; }
  .totaal-sectie { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totaal-tabel { font-size: 13px; }
  .totaal-tabel tr td { padding: 3px 0; }
  .totaal-tabel tr td:first-child { padding-right: 24px; text-align: right; }
  .totaal-tabel tr td:last-child { text-align: right; min-width: 80px; }
  .totaal-tabel .totaal-incl td { font-weight: bold; border-top: 1px solid #1a1a1a; padding-top: 6px; }
  .betaling { font-size: 13px; text-align: center; margin-bottom: 32px; line-height: 1.8; }
  .betaling strong { display: block; margin-bottom: 8px; }
  .concept-banner { background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px; padding: 10px; text-align: center; font-weight: 700; color: #92400e; margin-bottom: 20px; font-size: 13px; }
  .footer-spacer { flex: 1; }
  .bedrijfsinfo { display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid #e5e7eb; font-size: 12px; color: #374151; margin-bottom: 12px; }
  .footer { background: #2563eb; color: white; padding: 14px 48px; margin: 0 -48px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: bold; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pagina { padding: 32px 48px 0; }
  }
</style>
</head>
<body>
<div class="pagina">

  <div class="header">
    <div class="factuur-titel">Factuur</div>
    <div class="logo">
      <img src="${BEDRIJF.domein}/logo.png" alt="${BEDRIJF.naam}" />
    </div>
  </div>

  ${isConcept ? '<div class="concept-banner">⚠️ CONCEPT — Deze factuur is nog niet definitief</div>' : ''}

  <div class="klant-info">
    <div class="klant-links">
      <strong>${b.voornaam} ${b.achternaam}</strong>
      ${b.straat ? b.straat + '<br>' : ''}
      ${b.postcode ? b.postcode + (b.plaats ? ' ' + b.plaats : '') : ''}
    </div>
    <div class="factuur-meta">
      <table>
        <tr><td>Factuurnummer:</td><td>${factuurNr || 'Concept (nog geen nummer)'}</td></tr>
        <tr><td>Factuurdatum:</td><td>${new Date(b.aangemaakt_op).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
        <tr><td>Huurperiode:</td><td>${huurperiode}</td></tr>
      </table>
    </div>
  </div>

  <div class="referentie">Referentie: ${b.referentie}</div>
  ${b.opmerkingen && b.opmerkingen.trim() ? `<div class="opmerkingen">Opmerkingen: ${b.opmerkingen.replace(/\n/g, '<br>')}</div>` : ''}

  <table class="artikelen-tabel">
    <thead>
      <tr>
        <th>Artikel</th>
        <th style="text-align:center">Aantal</th>
        <th style="text-align:center">BTW</th>
        <th style="text-align:right">Bedrag excl.</th>
      </tr>
    </thead>
    <tbody>
      ${artikelRijen}
    </tbody>
  </table>

  <div class="totaal-sectie">
    <table class="totaal-tabel">
      <tr>
        <td>Totaal bedrag excl. 21%: €</td>
        <td>${exclBtw.toFixed(2)}</td>
      </tr>
      <tr>
        <td>BTW 21%: €</td>
        <td>${(b.btw || 0).toFixed(2)}</td>
      </tr>
      <tr class="totaal-incl">
        <td>Totaal (incl. btw): €</td>
        <td>${(b.totaal_incl || 0).toFixed(2)}</td>
      </tr>
      <tr>
        <td>Borg: €</td>
        <td>0,00</td>
      </tr>
    </table>
  </div>

  <div class="betaling">
    <strong>De betalingstermijn is 14 dagen</strong>
    Gelieve uw betaling van €${(b.totaal_incl || 0).toFixed(2)} voor ${betaalDatumStr} over te maken op ${BEDRIJF.juridisch.iban}<br>
    ten name van ${BEDRIJF.naamJuridisch} onder vermelding van ${factuurNr ? 'het factuurnummer ' + factuurNr : 'referentie ' + b.referentie}.
  </div>

  <div class="footer-spacer"></div>

  <div class="bedrijfsinfo">
    <div><strong>${BEDRIJF.naam}</strong></div>
    <div style="text-align:center;">${BEDRIJF.adres.straat}<br>${BEDRIJF.adres.postcode} ${BEDRIJF.adres.plaats}<br>${BEDRIJF.adres.land}</div>
    <div style="text-align:right;">T: ${BEDRIJF.contact.telefoon}<br>${BEDRIJF.contact.email}<br>${BEDRIJF.domein.replace('https://www.','').replace('https://','')}</div>
  </div>

  <div class="footer">
    <div>BTW nr ${BEDRIJF.juridisch.btw}</div>
    <div>KvK ${BEDRIJF.juridisch.kvk}</div>
    <div>${BEDRIJF.juridisch.iban}</div>
  </div>

</div>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close(); win.print() }
}

export default function Facturen() {
  const [boekingen, setBoekingen] = useState<Boeking[]>([])
  const [laden, setLaden] = useState(true)
  const [actieveTab, setActieveTab] = useState<'concept' | 'openstaand' | 'betaald'>('concept')
  const [zoek, setZoek] = useState('')
  const [filterJaar, setFilterJaar] = useState('alle')
  const [geselecteerd, setGeselecteerd] = useState<Boeking | null>(null)
  const [sortVeld, setSortVeld] = useState<SortVeld>('aanmaakdatum')
  const [sortOplopend, setSortOplopend] = useState(false)

  useEffect(() => { laadBoekingen() }, [])

  async function laadBoekingen() {
    setLaden(true)
    try {
      const { data, error } = await supabase
        .from('boekingen')
        .select('*')
        .order('aangemaakt_op', { ascending: false })
      if (error) throw error
      setBoekingen(data || [])
    } catch (e) { console.error(e) }
    setLaden(false)
  }

  async function printFactuurMetItems(b: Boeking) {
    let items: any[] = []
    try {
      const { data } = await supabase
        .from('boeking_items')
        .select('product_naam, aantal, subtotaal, ondergrond, ondergrond_meerprijs, haspel, haspel_meerprijs')
        .eq('boeking_id', b.id)
      items = data || []
    } catch (e) { console.error(e) }
    printFactuur(b, items)
  }

  async function updateFactuurStatus(id: string, factuur_status: string) {
    const extra = factuur_status === 'betaald' ? { status: 'afgerond' } : {}
    await supabase.from('boekingen').update({ factuur_status, ...extra }).eq('id', id)
    laadBoekingen()
    setGeselecteerd(prev => prev?.id === id ? { ...prev, factuur_status } : prev)
  }

  async function maakDefinitief(b: Boeking) {
    if (b.factuurnummer) return
    if (!confirm('Factuur definitief maken? Er wordt nu een definitief factuurnummer toegekend uit de doorlopende reeks. Dit kan niet ongedaan worden gemaakt.')) return
    try {
      const { data: nr, error } = await supabase.rpc('volgend_factuurnummer')
      if (error || nr == null) throw error || new Error('Geen factuurnummer ontvangen')
      // Al betaalde orders (bijv. via iDEAL) blijven op 'betaald'; overige gaan naar 'openstaand'.
      const nieuweStatus = b.factuur_status === 'betaald' ? 'betaald' : 'openstaand'
      await supabase.from('boekingen').update({ factuurnummer: nr, factuur_status: nieuweStatus }).eq('id', b.id)
      laadBoekingen()
      setGeselecteerd(prev => prev?.id === b.id ? { ...prev, factuurnummer: nr as number, factuur_status: nieuweStatus } : prev)
    } catch (e) {
      console.error(e)
      alert('Definitief maken mislukt. Probeer opnieuw.')
    }
  }

  async function markeerBetaald(b: Boeking) { await updateFactuurStatus(b.id, 'betaald') }

  function sorteer(veld: SortVeld) {
    if (sortVeld === veld) {
      setSortOplopend(o => !o)
    } else {
      setSortVeld(veld)
      setSortOplopend(true)
    }
  }

  const jaren = [...new Set(boekingen.map(b => new Date(b.aangemaakt_op).getFullYear().toString()))].sort((a, b) => Number(b) - Number(a))

  const gefilterd = boekingen.filter(b => {
    const ruw = b.factuur_status || 'concept'
    // iDEAL-orders in afwachting of met mislukte betaling tonen we bij Concept
    const fs = (ruw === 'wacht_op_betaling' || ruw === 'betaling_mislukt') ? 'concept' : ruw
    const matchTab = fs === actieveTab
    const matchJaar = filterJaar === 'alle' || new Date(b.aangemaakt_op).getFullYear().toString() === filterJaar
    const matchZoek = !zoek ||
      (b.voornaam + ' ' + b.achternaam).toLowerCase().includes(zoek.toLowerCase()) ||
      b.referentie.toLowerCase().includes(zoek.toLowerCase()) ||
      (b.email || '').toLowerCase().includes(zoek.toLowerCase()) ||
      (b.plaats || '').toLowerCase().includes(zoek.toLowerCase())
    return matchTab && matchJaar && matchZoek
  })

  const gesorteerd = [...gefilterd].sort((a, b) => {
    const richting = sortOplopend ? 1 : -1
    let va: number | string = 0
    let vb: number | string = 0
    if (sortVeld === 'factuurnummer') {
      // concepten (geen nummer) altijd onderaan, ongeacht richting
      const na = a.factuurnummer
      const nb = b.factuurnummer
      if (na == null && nb == null) return 0
      if (na == null) return 1
      if (nb == null) return -1
      return (na - nb) * richting
    }
    if (sortVeld === 'klant') {
      va = (a.achternaam + ' ' + a.voornaam).toLowerCase().trim()
      vb = (b.achternaam + ' ' + b.voornaam).toLowerCase().trim()
      return va.localeCompare(vb, 'nl') * richting
    }
    if (sortVeld === 'aanmaakdatum') {
      va = new Date(a.aangemaakt_op).getTime() || 0
      vb = new Date(b.aangemaakt_op).getTime() || 0
      return (va - vb) * richting
    }
    if (sortVeld === 'huurperiode') {
      va = new Date(a.start_datum).getTime() || 0
      vb = new Date(b.start_datum).getTime() || 0
      return (va - vb) * richting
    }
    return 0
  })

  const totaalGefilterd = gesorteerd.reduce((s, b) => s + (b.totaal_incl || 0), 0)

  const counts = {
    concept: boekingen.filter(b => { const s = b.factuur_status || 'concept'; return s === 'concept' || s === 'wacht_op_betaling' || s === 'betaling_mislukt' }).length,
    openstaand: boekingen.filter(b => b.factuur_status === 'openstaand').length,
    betaald: boekingen.filter(b => b.factuur_status === 'betaald').length,
    totaalBetaald: boekingen.filter(b => b.factuur_status === 'betaald').reduce((s, b) => s + (b.totaal_incl || 0), 0),
  }

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const factuurNr = (b: Boeking) => b.factuurnummer ? String(b.factuurnummer) : null

  const sorteerKop = (veld: SortVeld, label: string) => (
    <th
      onClick={() => sorteer(veld)}
      className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-blue-600 transition"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={'text-[10px] ' + (sortVeld === veld ? 'text-blue-500' : 'text-gray-300')}>
          {sortVeld === veld ? (sortOplopend ? '▲' : '▼') : '↕'}
        </span>
      </span>
    </th>
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Facturen</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{boekingen.length} facturen totaal</p>
        </div>
        <button onClick={laadBoekingen} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition">Vernieuwen</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div onClick={() => setActieveTab('concept')} className={'bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition ' + (actieveTab === 'concept' ? 'border-yellow-400' : 'border-pink-100 hover:border-yellow-300')}>
          <div className="text-2xl mb-2">📝</div>
          <div className="text-2xl font-bold text-gray-800">{counts.concept}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Concepten</div>
        </div>
        <div onClick={() => setActieveTab('openstaand')} className={'bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition ' + (actieveTab === 'openstaand' ? 'border-orange-400' : 'border-pink-100 hover:border-orange-300')}>
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-2xl font-bold text-yellow-600">{counts.openstaand}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Openstaand</div>
        </div>
        <div onClick={() => setActieveTab('betaald')} className={'bg-white rounded-xl p-5 border shadow-sm cursor-pointer transition ' + (actieveTab === 'betaald' ? 'border-green-400' : 'border-pink-100 hover:border-green-300')}>
          <div className="text-2xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600">{counts.betaald}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Betaald</div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-pink-100 shadow-sm">
          <div className="text-2xl mb-2">💶</div>
          <div className="text-2xl font-bold text-gray-800">€{counts.totaalBetaald.toFixed(2)}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Totaal ontvangen</div>
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {(['concept', 'openstaand', 'betaald'] as const).map(tab => (
          <button key={tab} onClick={() => { setActieveTab(tab); setGeselecteerd(null) }}
            className={'px-5 py-2 rounded-lg text-sm font-bold transition ' + (actieveTab === tab ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {tab === 'concept' ? 'Concepten' : tab === 'openstaand' ? 'Openstaand' : 'Betaald'}
            <span className={'ml-2 text-xs px-1.5 py-0.5 rounded-full ' + (actieveTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500')}>{counts[tab]}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-pink-100 shadow-sm p-4 mb-5 flex gap-3 flex-wrap items-center">
        <input type="text" placeholder="Zoek op naam, referentie, email, plaats..." value={zoek} onChange={e => setZoek(e.target.value)} className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-400" />
        <select value={filterJaar} onChange={e => setFilterJaar(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-400">
          <option value="alle">Alle jaren</option>
          {jaren.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <span className="text-sm text-gray-500 font-medium whitespace-nowrap">{gesorteerd.length} facturen · €{totaalGefilterd.toFixed(2)}</span>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {laden ? (
            <div className="bg-white rounded-xl border border-pink-100 p-12 text-center text-gray-500 font-medium">⏳ Facturen laden...</div>
          ) : gesorteerd.length === 0 ? (
            <div className="bg-white rounded-xl border border-pink-100 p-12 text-center text-gray-500 font-medium">Geen facturen gevonden</div>
          ) : (
            <div className="bg-white rounded-xl border border-pink-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-pink-50 border-b border-pink-100">
                      {sorteerKop('factuurnummer', 'Factuurnummer')}
                      {sorteerKop('klant', 'Klant')}
                      {sorteerKop('aanmaakdatum', 'Aanmaakdatum')}
                      {sorteerKop('huurperiode', 'Huurperiode')}
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Bedrag</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Acties</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50">
                    {gesorteerd.map(b => (
                      <tr key={b.id} onClick={() => setGeselecteerd(b)} className={'hover:bg-pink-50 transition cursor-pointer ' + (geselecteerd?.id === b.id ? 'bg-blue-50' : '')}>
                        <td className="px-4 py-3">
                          {factuurNr(b)
                            ? <div className="text-sm font-bold text-blue-600">{factuurNr(b)}</div>
                            : <div className="text-sm font-bold text-gray-400">Concept</div>}
                          <div className="text-xs text-gray-400">{b.referentie}</div>
                          {b.factuur_status === 'wacht_op_betaling' && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">⏳ Wacht op iDEAL</span>
                          )}
                          {b.factuur_status === 'betaling_mislukt' && (
                            <span className="inline-block mt-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">✕ Betaling mislukt</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-gray-800">{b.voornaam} {b.achternaam}</div>
                          <div className="text-xs text-gray-500 font-medium">{b.plaats}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">{fmt(b.aangemaakt_op)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700 font-medium">{fmt(b.start_datum)}</div>
                          <div className="text-xs text-gray-500">t/m {fmt(b.eind_datum)}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-800">€{(b.totaal_incl || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={e => { e.stopPropagation(); printFactuurMetItems(b) }} className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition">🖨️ Print</button>
                            {actieveTab === 'concept' && (
                              <button onClick={e => { e.stopPropagation(); maakDefinitief(b) }} className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">Definitief →</button>
                            )}
                            {actieveTab === 'betaald' && !b.factuurnummer && (
                              <button onClick={e => { e.stopPropagation(); maakDefinitief(b) }} className="text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition">Definitief →</button>
                            )}
                            {actieveTab === 'openstaand' && (
                              <button onClick={e => { e.stopPropagation(); markeerBetaald(b) }} className="text-xs font-bold bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition">✓ Betaald</button>
                            )}
                            {actieveTab === 'betaald' && (
                              <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-lg">✓ Betaald</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-700">Totaal ({gesorteerd.length})</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-800">€{totaalGefilterd.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {geselecteerd && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-pink-100 shadow-sm overflow-hidden sticky top-24">
              <div className="bg-pink-100 border-b border-pink-200 px-5 py-4 flex items-center justify-between">
                <h2 className="font-bold text-gray-800">{factuurNr(geselecteerd) || 'Concept'}</h2>
                <button onClick={() => setGeselecteerd(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>
              <div className="p-5 space-y-4 text-sm overflow-y-auto" style={{maxHeight: '75vh'}}>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Referentie</p>
                  <p className="font-bold text-gray-700">{geselecteerd.referentie}</p>
                </div>
                <div className="border-t border-pink-100 pt-4">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-2">👤 Klant</p>
                  <p className="font-bold text-gray-800">{geselecteerd.voornaam} {geselecteerd.achternaam}</p>
                  <a href={'mailto:' + geselecteerd.email} className="text-blue-600 hover:underline block text-xs">{geselecteerd.email}</a>
                  <a href={'tel:' + geselecteerd.telefoon} className="text-blue-600 hover:underline block text-xs">{geselecteerd.telefoon}</a>
                  {geselecteerd.straat && <p className="text-gray-500 text-xs mt-1">{geselecteerd.straat}, {geselecteerd.postcode} {geselecteerd.plaats}</p>}
                </div>
                <div className="border-t border-pink-100 pt-4">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-2">📅 Huurperiode</p>
                  <p className="font-medium text-gray-700">{fmt(geselecteerd.start_datum)} t/m {fmt(geselecteerd.eind_datum)}</p>
                </div>
                <div className="border-t border-pink-100 pt-4">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-2">💶 Bedragen</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-gray-600"><span>Verhuur</span><span>€{(geselecteerd.artikel_totaal||0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Bezorging</span><span>€{(geselecteerd.bezorg_kosten||0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>BTW 21%</span><span>€{(geselecteerd.btw||0).toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-gray-800 border-t border-pink-100 pt-1"><span>Totaal</span><span>€{(geselecteerd.totaal_incl||0).toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-500 text-xs"><span>Betaalwijze</span><span>{geselecteerd.betaal_wijze}</span></div>
                  </div>
                </div>
                <div className="border-t border-pink-100 pt-4">
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-2">Status wijzigen</p>
                  <div className="space-y-2">
                    {actieveTab === 'concept' && (
                      <button onClick={() => maakDefinitief(geselecteerd)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition">Definitief maken →</button>
                    )}
                    {actieveTab === 'betaald' && !geselecteerd.factuurnummer && (
                      <button onClick={() => maakDefinitief(geselecteerd)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition">Definitief maken →</button>
                    )}
                    {actieveTab === 'openstaand' && (
                      <button onClick={() => markeerBetaald(geselecteerd)} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-xl text-sm transition">✓ Markeer als betaald</button>
                    )}
                    {actieveTab === 'betaald' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center text-sm font-bold text-green-700">✓ Betaald</div>
                    )}
                  </div>
                </div>
                <div className="border-t border-pink-100 pt-4">
                  <button onClick={() => printFactuurMetItems(geselecteerd)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition">🖨️ Factuur afdrukken</button>
                  <a href={'/admin/orders/' + geselecteerd.id} className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-sm transition mt-2">Order bekijken →</a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
