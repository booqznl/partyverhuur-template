# Nieuwe rental-site opzetten

Van lege repo naar werkende webshop. Volg de stappen op volgorde —
elke fase bouwt op de vorige. Reken op een halve dag voor een volledige site.

> **Gouden regel:** de repo-naam moet EXACT gelijk zijn aan het domein.
> Eén tikfout (bijv. enkele vs dubbele letter) kost je een uur bij het
> koppelen aan Vercel. Typ 'm over, gok niet.

---

## Fase 0 — Voorbereiden (klantgegevens verzamelen)

Verzamel dit vóór je begint, anders val je later stil:

- [ ] Bedrijfsnaam (exacte tenaamstelling bankrekening)
- [ ] Adres, telefoon, e-mailadres
- [ ] KvK-nummer, btw-nummer, IBAN
- [ ] Domeinnaam (bepaalt de repo-naam!)
- [ ] Logo (liefst als PNG én los icoon voor de favicon)
- [ ] Huisstijlkleuren (primair + accent)
- [ ] Order-prefix (bijv. PVH-, KVE-)
- [ ] Werkgebied: lijst met plaatsen
- [ ] Productlijst (liefst export/CSV met naam, prijs, foto)

---

## Fase 1 — Repo aanmaken

1. [ ] Nieuwe repo via **"Use this template"** op deze template-repo.
2. [ ] Repo-naam = domein, exact overgetypt.
3. [ ] Repo op **private** (klantwerk).

---

## Fase 2 — Supabase

1. [ ] Nieuw Supabase-project aanmaken. Noteer de project-ref (het deel
       vóór `.supabase.co`).
2. [ ] SQL Editor → `db/schema.sql` draaien. Verwacht: "Success, no rows".
3. [ ] **NOOIT "Disable legacy API keys" aanzetten** — de app gebruikt ze.
4. [ ] Storage → nieuwe bucket **`producten`** → **Public** aan.
5. [ ] Sleutels noteren (Settings → API):
       - Project URL
       - anon key
       - service_role key (geheim!)

---

## Fase 3 — Config invullen

Bewerk **`lib/config.ts`** — dit is het ENIGE bestand met klantgegevens.
Loop het `TODO`-blok bovenaan langs. Vul minimaal in:

- [ ] `naam`, `naamKort`, `naamJuridisch`
- [ ] `tagline` + het hele `hero`-blok (titel, ondertitel, 2 knoppen)
- [ ] `contact` (email, telefoon)
- [ ] `adres` (inclusief `gemeente`)
- [ ] `juridisch` (kvk, btw, iban) — **nodig vóór de eerste factuur**
- [ ] `order.prefix`
- [ ] `bezorging.eigenGemeentePlaatsen`
- [ ] `opbouw.categorieen` (meestal springkussen + stormbaan)

---

## Fase 4 — Kleuren

De huisstijl zit VOLLEDIG in **`app/globals.css`**, in het `:root`-blok.

- [ ] Vervang de 10 `--color-primary-*` regels met de primaire kleurschaal.
- [ ] Vervang de 10 `--color-accent-*` regels met de accentkleurschaal.
- [ ] Pas ook `kleuren.primairHex` / `accentHex` in `config.ts` aan
      (die worden gebruikt voor meta-theme-color en PDF's).

> **NIET DOEN:** een find-replace van `sky-`/`orange-` door de bestanden heen.
> De kleuren zijn al gecentraliseerd via CSS-variabelen. Alleen `globals.css`
> aanpassen. Tien tinten genereren kan via uicolors.app of tailwindcss.com.

---

## Fase 5 — Logo & favicon

- [ ] Logo als `public/logo.png` (vervangt het template-logo).
- [ ] Favicon als `app/icon.png` (512×512, wordt automatisch opgepikt).
- [ ] Controleer na deploy of het logo netjes in de nav past
      (verhouding); pas anders de width/height in `Nav.tsx` aan.

---

## Fase 6 — Vercel deployen

1. [ ] Add New → Project → importeer de repo (let op de EXACTE naam).
2. [ ] Framework: Next.js. Root Directory: leeg / `./`.
3. [ ] **Environment Variables** — plak alle waarden uit `.env.example`
       met de echte sleutels VÓÓR je Deploy indrukt:
       - `NEXT_PUBLIC_SUPABASE_URL`
       - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
       - `SUPABASE_SERVICE_ROLE_KEY`
       - `SUPABASE_SERVICE_KEY` (zelfde als service_role)
       - `RESEND_API_KEY`
       - `MOLLIE_API_KEY`
       - `CRON_SECRET` (nieuw, uniek per site — genereer een willekeurige)
       - `NEXT_PUBLIC_SITE_URL`
4. [ ] Deploy.

---

## Fase 7 — Producten importeren

1. [ ] Categorieën + producten samenstellen als SQL (zie
       `db/import_producten_voorbeeld.sql` als sjabloon).
2. [ ] In SQL Editor draaien.
3. [ ] Foto's/prijzen/beschrijvingen: draai `tools/verrijk_producten.py`
       op een pc (niet mobiel — vereist Python + internet).
4. [ ] **BELANGRIJK — foto's koppelen:** de klantkant (homepage +
       assortiment) leest foto's uit de tabel `product_fotos`, NIET uit
       `producten.foto_url`. Draai daarom na de import:

```sql
       insert into product_fotos (product_id, foto_url, volgorde)
       select id, foto_url, 0 from producten
       where foto_url is not null
         and not exists (select 1 from product_fotos pf where pf.product_id = producten.id);
```

---

## Fase 8 — Admin-account

1. [ ] Supabase → Authentication → Users → Add user (jouw e-mail + wachtwoord).
2. [ ] Kopieer de User UID.
3. [ ] In SQL Editor:
```sql
       insert into gebruiker_rollen (user_id, rol) values ('<UID-HIER>', 'admin');
```
4. [ ] Inloggen op `/admin` en controleren.

---

## Fase 9 — Smoke test (na deploy)

- [ ] Homepage laadt zonder errors
- [ ] Een productpagina toont de foto en prijs
- [ ] `/admin` werkt en toont de producten
- [ ] Een testboeking komt door tot de bevestigingspagina
- [ ] Bevestigingsmail komt aan (vereist echte Resend-key!)

---

## Fase 10 — Vóór livegang

- [ ] `RESEND_API_KEY` en `MOLLIE_API_KEY` van `dummy` naar echte
      klantsleutels → redeploy. (Zonder dit werken mail en iDEAL niet.)
- [ ] service_role key roteren als die ergens gelekt is (chat, screenshot).
- [ ] `og:image` uploaden naar `public/` (logo in mails + social preview).
- [ ] Domein koppelen in Vercel (let op: de oude site gaat dan offline).
- [ ] Werkgebied-landingspagina's bouwen (indien gewenst) en de
      `EIGEN_ROUTES` in `next.config.ts` uitbreiden zodat ze niet
      naar `/product/...` geredirect worden.

---

## Terugkerende valkuilen (uit ervaring)

- **Repo-naam ≠ domein** → Vercel "repository can't be found". Typ exact over.
- **Geen foto's op homepage** → `product_fotos` niet gevuld (zie Fase 7.4).
- **Kleuren-chaos** → find-replace gedaan i.p.v. alleen `globals.css`.
- **Live zonder mail/betaling** → dummy-keys niet vervangen (Fase 10).
- **Gelekte service_role key** → roteren, niet laten hangen.
- **Admin-restanten** → sommige admin-pagina's kunnen nog vorige-klant
  gegevens bevatten (logo, adres). Controleer `app/admin/`.
