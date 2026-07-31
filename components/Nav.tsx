// components/Nav.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BEDRIJF } from '@/lib/config'

type Categorie = {
  id: number
  naam: string
  emoji: string
  volgorde: number
}

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartAantal, setCartAantal] = useState(0)
  const [categorieen, setCategorieen] = useState<Categorie[]>([])

  useEffect(() => {
    function updateCart() {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '{}')
        const totaal = Object.values(cart).reduce((s: number, v) => {
          const num = Number(v)
          return s + (isNaN(num) ? 0 : num)
        }, 0)
        setCartAantal(totaal as number)
      } catch {
        setCartAantal(0)
      }
    }
    updateCart()
    window.addEventListener('storage', updateCart)
    const interval = setInterval(updateCart, 500)
    return () => {
      window.removeEventListener('storage', updateCart)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    async function laadCategorieen() {
      const { data } = await supabase
        .from('categorieen')
        .select('id, naam, emoji, volgorde')
        .eq('actief', true)
        .eq('tonen_op_website', true)
        .order('volgorde', { ascending: true })
      setCategorieen(data || [])
    }
    laadCategorieen()
  }, [])

  function zoeken(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = e.currentTarget.querySelector('input') as HTMLInputElement
    const q = input?.value?.trim()
    if (q) window.location.href = '/assortiment?zoek=' + encodeURIComponent(q)
  }

  const telHref = `tel:${BEDRIJF.contact.telefoonLink}`
  const mailHref = `mailto:${BEDRIJF.contact.email}`
  const adresKort = `${BEDRIJF.adres.straat}, ${BEDRIJF.adres.postcode} ${BEDRIJF.adres.plaats}`

  return (
    <>
      <div className="bg-sky-50 py-2 px-4 hidden md:block">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-gray-600 font-medium flex-wrap gap-2">
          <a href={telHref} className="hover:text-sky-600">📞 {BEDRIJF.contact.telefoon}</a>
          <a href={mailHref} className="hover:text-sky-600">✉️ {BEDRIJF.contact.email}</a>
          <span>📍 {adresKort}</span>
        </div>
      </div>

      <nav className="bg-white border-b-2 border-sky-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            {menuOpen ? 'X Sluiten' : '☰ Menu'}
          </button>

          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt={BEDRIJF.naam}
              width={200}
              height={90}
              style={{ height: 'auto', width: 'auto', maxHeight: '64px' }}
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex-1 max-w-md hidden md:block">
            <form onSubmit={zoeken}>
              <div className="flex">
                <input
                  type="text"
                  placeholder="Zoeken..."
                  className="w-full border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:border-sky-400"
                />
                <button type="submit" className="bg-sky-500 text-white px-4 py-2 rounded-r-lg hover:bg-sky-600 transition text-sm">🔍</button>
              </div>
            </form>
          </div>

          <Link href="/winkelwagen" className="relative flex-shrink-0 flex items-center gap-1 text-sky-600 hover:text-sky-800 transition">
            <span className="text-2xl">🛒</span>
            {cartAantal > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartAantal}
              </span>
            )}
          </Link>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-3 border-t border-sky-200 pt-3 space-y-1">
            <div className="bg-sky-50 rounded-xl px-4 py-3 mb-2 space-y-1">
              <a href={telHref} className="block text-sm font-bold text-gray-700">📞 {BEDRIJF.contact.telefoon}</a>
              <a href={mailHref} className="block text-sm font-medium text-gray-600">✉️ {BEDRIJF.contact.email}</a>
              <span className="block text-sm font-medium text-gray-600">📍 {adresKort}</span>
            </div>
            <form onSubmit={zoeken} className="px-4 mb-2">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Zoeken..."
                  className="w-full border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400"
                />
                <button type="submit" className="bg-sky-500 text-white px-3 py-2 rounded-r-lg hover:bg-sky-600 transition text-sm">🔍</button>
              </div>
            </form>
            <Link href="/" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-sky-100 rounded-lg">🏠 Home</Link>
            <Link href="/assortiment" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-sky-100 rounded-lg">🎈 Assortiment</Link>
            {categorieen.map(c => (
              <Link key={c.id} href={'/assortiment?cat=' + c.naam} onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-sky-100 rounded-lg pl-8">
                {c.emoji} {c.naam.charAt(0).toUpperCase() + c.naam.slice(1)}
              </Link>
            ))}
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-sky-100 rounded-lg">✉️ Contact</Link>
            <Link href="/winkelwagen" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-bold text-sky-600 hover:bg-sky-100 rounded-lg">
              🛒 Winkelwagen {cartAantal > 0 ? `(${cartAantal})` : ''}
            </Link>
          </div>
        )}
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {BEDRIJF.social.whatsapp && (
        <a
          href={`https://wa.me/${BEDRIJF.social.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105"
        >
          <span className="text-xl">💬</span>
          <span className="text-sm">WhatsApp ons</span>
        </a>
      )}
    </>
  )
}
