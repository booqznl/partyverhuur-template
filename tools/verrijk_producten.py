#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/verrijk_producten.py  —  TEMPLATE
====================================================================
Haalt prijs, beschrijving, SKU en foto van een bron-site (bijv. een
oude ShopFactory- of Rentpro-site) en koppelt alles aan de producten
die al in Supabase staan (gematcht op slug).

Dit is GEREEDSCHAP dat op een pc draait (niet mobiel — vereist Python
+ internet). Zie NIEUWE_SITE.md fase 7.

Wat het doet, in vier fases:
  1. LEZEN   - elke bron_url uit de CSV ophalen en de meta-tags
               (og:image, prijs, description, sku) eruit halen
  2. FOTO'S  - elke og:image downloaden naar ./fotos/
  3. UPLOAD  - de foto's naar de Supabase-bucket zetten
  4. SQL     - update_producten.sql schrijven: prijs, beschrijving,
               foto_url per product (gematcht op slug)

Veilig te hervatten: resultaten worden weggeschreven naar
verrijk_cache.json. Draai je het script opnieuw, dan slaat het over
wat al gelukt is.

--------------------------------------------------------------------
PER KLANT INVULLEN (hieronder bij INSTELLINGEN):
  - SUPABASE_URL         (uit Supabase -> Settings -> API)
  - SERVICE_ROLE_KEY     (geheim! zelfde plek)
  - CSV_BESTAND          (de export met kolom 'slug' en 'bron_url')

De CSV moet minimaal deze kolommen hebben:
  slug       - moet exact matchen met producten.slug in de database
  bron_url   - de productpagina op de oude site

BENODIGD (eenmalig):
    pip install requests beautifulsoup4 supabase

GEBRUIK:
    python verrijk_producten.py
====================================================================
"""

import csv
import json
import os
import re
import time
import sys

# ---------------------------------------------------------------
# INSTELLINGEN — per klant invullen
# ---------------------------------------------------------------
SUPABASE_URL = "https://PROJECTREF.supabase.co"        # <-- invullen
SERVICE_ROLE_KEY = "PLAK-HIER-JE-SERVICE-ROLE-KEY"     # <-- invullen
BUCKET = "producten"

CSV_BESTAND = "products_import.csv"
FOTO_MAP = "fotos"
CACHE = "verrijk_cache.json"
SQL_UIT = "update_producten.sql"

# upload naar Supabase aan/uit. Zet op False als je alleen de SQL en
# de gedownloade foto's wilt en later handmatig uploadt.
DOE_UPLOAD = True

# pauze tussen pagina-verzoeken (seconden). Beleefd tegen de server.
PAUZE = 0.4

# ---------------------------------------------------------------
try:
    import requests
except ImportError:
    print("Module 'requests' ontbreekt. Draai eerst:  pip install requests beautifulsoup4 supabase")
    sys.exit(1)

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("Module 'beautifulsoup4' ontbreekt. Draai eerst:  pip install requests beautifulsoup4 supabase")
    sys.exit(1)


# ---------------------------------------------------------------
# Hulpfuncties
# ---------------------------------------------------------------

def laad_cache():
    if os.path.exists(CACHE):
        try:
            return json.load(open(CACHE, encoding="utf-8"))
        except Exception:
            return {}
    return {}


def bewaar_cache(data):
    json.dump(data, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def sql_str(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def schoon_prijs(tekst):
    """'25.00' of '25,00' -> 25.00 (float) of None."""
    if not tekst:
        return None
    t = tekst.strip().replace(",", ".")
    m = re.search(r"\d+(?:\.\d+)?", t)
    if not m:
        return None
    try:
        p = float(m.group(0))
    except ValueError:
        return None
    # Placeholder-prijzen die geen echte prijs zijn hier negeren.
    # Vul aan met bekende dummywaarden van de bronsite indien nodig.
    if abs(p - 2099.12) < 0.01:
        return None
    return p


def haal_meta(html):
    """Trekt og:image, prijs, description en sku uit de metatags."""
    soup = BeautifulSoup(html, "html.parser")

    def meta(prop=None, name=None):
        if prop:
            tag = soup.find("meta", attrs={"property": prop})
            if tag and tag.get("content"):
                return tag["content"].strip()
        if name:
            tag = soup.find("meta", attrs={"name": name})
            if tag and tag.get("content"):
                return tag["content"].strip()
        return None

    foto = meta(prop="og:image")
    prijs = meta(prop="product:price:amount")
    sku = meta(prop="product:sku")
    besch = meta(prop="og:description") or meta(name="description")

    # foto-URL naar https en absoluut maken
    if foto:
        foto = foto.strip()
        if foto.startswith("http://"):
            foto = "https://" + foto[len("http://"):]

    return {
        "foto_url_bron": foto,
        "prijs": schoon_prijs(prijs),
        "sku": sku,
        "beschrijving": (besch or "").strip(),
    }


# ---------------------------------------------------------------
# FASE 1 + 2 — pagina's lezen en foto's downloaden
# ---------------------------------------------------------------

def fase_lezen_en_fotos(rows, cache):
    os.makedirs(FOTO_MAP, exist_ok=True)
    sess = requests.Session()
    sess.headers.update({
        "User-Agent": "Mozilla/5.0 (compatible; product-import/1.0)"
    })

    totaal = len(rows)
    for i, r in enumerate(rows, 1):
        slug = r["slug"].strip()
        url = r["bron_url"].strip()

        rec = cache.get(slug, {})
        if rec.get("gelezen") and rec.get("foto_lokaal") is not None:
            print(f"[{i}/{totaal}] overslaan (al gedaan): {slug}")
            continue

        # -- pagina lezen --
        if not rec.get("gelezen"):
            try:
                resp = sess.get(url, timeout=20)
                resp.encoding = resp.apparent_encoding or "utf-8"
                if resp.status_code == 200:
                    meta = haal_meta(resp.text)
                    rec.update(meta)
                    rec["gelezen"] = True
                    print(f"[{i}/{totaal}] gelezen: {slug}  "
                          f"prijs={rec.get('prijs')}  foto={'ja' if rec.get('foto_url_bron') else 'nee'}")
                else:
                    rec["gelezen"] = False
                    rec["fout"] = f"HTTP {resp.status_code}"
                    print(f"[{i}/{totaal}] FOUT {resp.status_code}: {slug}")
            except Exception as e:
                rec["fout"] = str(e)
                print(f"[{i}/{totaal}] FOUT: {slug} -> {e}")
            cache[slug] = rec
            bewaar_cache(cache)
            time.sleep(PAUZE)

        # -- foto downloaden --
        foto_bron = rec.get("foto_url_bron")
        if foto_bron and rec.get("foto_lokaal") is None:
            ext = os.path.splitext(foto_bron.split("?")[0])[1].lower()
            if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
                ext = ".jpg"
            bestandsnaam = f"{slug}{ext}"
            pad = os.path.join(FOTO_MAP, bestandsnaam)
            if os.path.exists(pad) and os.path.getsize(pad) > 0:
                rec["foto_lokaal"] = bestandsnaam
            else:
                try:
                    fr = sess.get(foto_bron, timeout=30)
                    if fr.status_code == 200 and len(fr.content) > 500:
                        with open(pad, "wb") as f:
                            f.write(fr.content)
                        rec["foto_lokaal"] = bestandsnaam
                        print(f"        foto opgeslagen: {bestandsnaam} ({len(fr.content)//1024} kB)")
                    else:
                        rec["foto_lokaal"] = ""
                        print(f"        geen foto (HTTP {fr.status_code})")
                except Exception as e:
                    rec["foto_lokaal"] = ""
                    print(f"        fotofout: {e}")
            cache[slug] = rec
            bewaar_cache(cache)
            time.sleep(PAUZE)
        elif not foto_bron:
            rec["foto_lokaal"] = ""
            cache[slug] = rec

    bewaar_cache(cache)


# ---------------------------------------------------------------
# FASE 3 — foto's uploaden naar Supabase
# ---------------------------------------------------------------

def fase_upload(cache):
    if not DOE_UPLOAD:
        print("Upload overgeslagen (DOE_UPLOAD = False).")
        return
    if SERVICE_ROLE_KEY.startswith("PLAK"):
        print("!! SERVICE_ROLE_KEY niet ingevuld — upload overgeslagen. "
              "Vul de key in bovenaan het script om te uploaden.")
        return
    if "PROJECTREF" in SUPABASE_URL:
        print("!! SUPABASE_URL niet ingevuld — upload overgeslagen.")
        return
    try:
        from supabase import create_client
    except ImportError:
        print("Module 'supabase' ontbreekt — upload overgeslagen. "
              "Installeer met:  pip install supabase")
        return

    sb = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)
    content_types = {
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif",
    }

    for slug, rec in cache.items():
        naam = rec.get("foto_lokaal")
        if not naam:
            continue
        if rec.get("foto_geupload"):
            continue
        pad = os.path.join(FOTO_MAP, naam)
        if not os.path.exists(pad):
            continue
        ext = os.path.splitext(naam)[1].lower()
        ct = content_types.get(ext, "image/jpeg")
        try:
            with open(pad, "rb") as f:
                data = f.read()
            sb.storage.from_(BUCKET).upload(
                path=naam,
                file=data,
                file_options={"content-type": ct, "upsert": "true"},
            )
            publiek = sb.storage.from_(BUCKET).get_public_url(naam)
            rec["foto_url"] = publiek
            rec["foto_geupload"] = True
            print(f"geupload: {naam}")
        except Exception as e:
            try:
                publiek = sb.storage.from_(BUCKET).get_public_url(naam)
                rec["foto_url"] = publiek
                rec["foto_geupload"] = True
                print(f"bestond al, url gezet: {naam}")
            except Exception:
                print(f"uploadfout {naam}: {e}")
        bewaar_cache(cache)


# ---------------------------------------------------------------
# FASE 4 — SQL schrijven
# ---------------------------------------------------------------

def fase_sql(cache):
    regels = []
    regels.append("-- update_producten.sql")
    regels.append("-- Verrijkt bestaande producten met prijs, beschrijving en foto_url.")
    regels.append("-- Gematcht op slug. Alleen niet-lege waarden worden gezet.")
    regels.append("begin;")
    regels.append("")

    n_prijs = n_besch = n_foto = 0
    for slug, rec in cache.items():
        sets = []
        prijs = rec.get("prijs")
        if prijs is not None:
            sets.append(f"prijs = {prijs:.2f}")
            n_prijs += 1
        besch = rec.get("beschrijving")
        if besch:
            sets.append(f"beschrijving = {sql_str(besch)}")
            n_besch += 1
        foto = rec.get("foto_url")
        if foto:
            sets.append(f"foto_url = {sql_str(foto)}")
            n_foto += 1
        if not sets:
            continue
        regels.append(
            f"update producten set {', '.join(sets)} where slug = {sql_str(slug)};"
        )

    regels.append("")
    # BELANGRIJK: de klantkant leest foto's uit product_fotos, niet uit
    # producten.foto_url. Vul die tabel daarom hier meteen mee.
    regels.append("-- Foto's ook naar product_fotos (dat leest de homepage/assortiment).")
    regels.append("insert into product_fotos (product_id, foto_url, volgorde)")
    regels.append("select id, foto_url, 0 from producten")
    regels.append("where foto_url is not null")
    regels.append("  and not exists (select 1 from product_fotos pf where pf.product_id = producten.id);")
    regels.append("")
    regels.append("commit;")
    regels.append("")
    regels.append(f"-- Samenvatting: {n_prijs} prijzen, {n_besch} beschrijvingen, {n_foto} fotos.")

    with open(SQL_UIT, "w", encoding="utf-8") as f:
        f.write("\n".join(regels))

    print()
    print(f"SQL geschreven naar {SQL_UIT}")
    print(f"  prijzen:        {n_prijs}")
    print(f"  beschrijvingen: {n_besch}")
    print(f"  fotos:          {n_foto}")


# ---------------------------------------------------------------
def main():
    if not os.path.exists(CSV_BESTAND):
        print(f"CSV '{CSV_BESTAND}' niet gevonden. Zet het script in dezelfde map als de CSV.")
        sys.exit(1)

    rows = list(csv.DictReader(open(CSV_BESTAND, encoding="utf-8-sig")))
    cache = laad_cache()

    print("=== FASE 1+2: pagina's lezen en foto's downloaden ===")
    fase_lezen_en_fotos(rows, cache)

    print()
    print("=== FASE 3: foto's uploaden naar Supabase ===")
    fase_upload(cache)

    print()
    print("=== FASE 4: SQL genereren ===")
    fase_sql(cache)

    print()
    print("Klaar. Draai update_producten.sql in de Supabase SQL Editor.")


if __name__ == "__main__":
    main()
