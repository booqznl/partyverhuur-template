-- db/schema.sql
-- ============================================================================
-- DATABASESCHEMA — TEMPLATE
-- ----------------------------------------------------------------------------
-- Draai dit als EERSTE in de SQL Editor van een nieuw Supabase-project.
-- Zie NIEUWE_SITE.md fase 2.
--
-- Alle prijzen zijn INCLUSIEF BTW. Volgorde: tabellen -> indexen -> functies
-- -> RLS -> seed. Idempotent: opnieuw draaien is veilig.
-- ============================================================================


-- ============================================================================
-- 1. TABELLEN
-- ============================================================================

-- LET OP: categorieen.naam is wat in producten.categorie komt te staan en
-- waar de code op matcht. De opbouw-categorieen (zie lib/config.ts, standaard
-- 'springkussen' en 'stormbaan') krijgen ondergrond-, haspel- en laadprofiel-
-- logica.
create table if not exists categorieen (
  id                serial primary key,
  naam              text not null unique,
  emoji             text default '🎉',
  omschrijving      text default '',
  volgorde          integer not null default 100,
  actief            boolean not null default true,
  tonen_op_website  boolean not null default true,
  aangemaakt_op     timestamptz not null default now()
);

create table if not exists producten (
  id                    serial primary key,
  naam                  text not null,
  slug                  text unique,
  categorie             text not null,
  beschrijving          text default '',
  beschrijving_lang     text default '',
  emoji                 text default '🏰',
  foto_url              text,
  voorraad              integer not null default 1,
  actief                boolean not null default true,
  -- prijs_type 'per_dag'    : dag 1 vol, elke volgende dag 50%
  -- prijs_type 'vast_basis' : vaste prijs voor basis_dagen, daarna
  --                           extra_prijs_per_dag per extra dag
  prijs                 numeric(10,2) not null,
  prijs_type            text not null default 'per_dag',
  basis_prijs           numeric(10,2),
  basis_dagen           integer,
  extra_prijs_per_dag   numeric(10,2),
  -- Laadprofiel (wat gaat er mee in de bus)
  type_blower           text default '',
  onderzeil             boolean not null default false,
  aantal_valmatten      integer not null default 0,
  aantal_haringen       integer not null default 0,
  aantal_waterzakken    integer not null default 0,
  aangemaakt_op         timestamptz not null default now(),
  constraint producten_prijs_type_check
    check (prijs_type in ('per_dag', 'vast_basis'))
);

-- producten.foto_url = hoofdfoto. Deze tabel is de galerij.
-- BELANGRIJK: de klantkant (homepage + assortiment) leest de foto's HIERUIT,
-- niet uit producten.foto_url. Vul na een import dus altijd product_fotos
-- (zie NIEUWE_SITE.md fase 7.4).
create table if not exists product_fotos (
  id            serial primary key,
  product_id    integer not null references producten(id) on delete cascade,
  foto_url      text not null,
  volgorde      integer not null default 0,
  aangemaakt_op timestamptz not null default now()
);

-- id wordt clientside gezet met crypto.randomUUID(), zodat er na de insert
-- niet teruggelezen hoeft te worden (anonieme bezoekers hebben geen SELECT).
create table if not exists boekingen (
  id                          uuid primary key,
  referentie                  text not null unique,
  voornaam                    text not null,
  achternaam                  text not null,
  email                       text not null,
  telefoon                    text,
  straat                      text,
  postcode                    text,
  plaats                      text,
  start_datum                 date not null,
  eind_datum                  date not null,
  evenement_type              text default 'Overig',
  opmerkingen                 text default '',
  bezorg_wijze                text not null default 'ophalen',
  betaal_wijze                text,
  bezorg_kosten               numeric(10,2) not null default 0,
  artikel_totaal              numeric(10,2) not null default 0,
  btw                         numeric(10,2) not null default 0,
  totaal_incl                 numeric(10,2) not null default 0,
  -- status         : bevestigd | onderweg | afgerond | geannuleerd
  -- factuur_status : concept | wacht_op_betaling | betaling_mislukt
  --                  | openstaand | betaald
  status                      text not null default 'bevestigd',
  factuur_status              text not null default 'concept',
  factuurnummer               text,
  ontvangen_via               text,
  mollie_payment_id           text,
  geboortedatum               date,
  verjaardag_mail_opt_out     boolean not null default false,
  verjaardag_kortingscode     text,
  pop_klaar_mail_verstuurd    boolean not null default false,
  aangemaakt_op               timestamptz not null default now(),
  constraint boekingen_datums_check check (eind_datum >= start_datum)
);

-- product_naam en slug worden meegeschreven zodat een oude factuur klopt
-- als het product later hernoemd of verwijderd wordt.
create table if not exists boeking_items (
  id                     serial primary key,
  boeking_id             uuid not null references boekingen(id) on delete cascade,
  product_id             integer,
  product_naam           text not null,
  slug                   text,
  aantal                 integer not null default 1,
  prijs_per_dag          numeric(10,2) not null default 0,
  subtotaal              numeric(10,2) not null default 0,
  ondergrond             text,
  ondergrond_meerprijs   numeric(10,2) not null default 0,
  haspel                 text,
  haspel_meerprijs       numeric(10,2) not null default 0
);

-- Losse tellers voor order- en factuurnummers. Alleen via de functies
-- hieronder aanspreken, nooit rechtstreeks vanuit de app.
create table if not exists nummering (
  soort    text primary key,
  laatste  integer not null default 0
);

create table if not exists pageviews (
  id             bigserial primary key,
  pad            text not null,
  bezoeker_id    text,
  referrer       text,
  plaats         text,
  aangemaakt_op  timestamptz not null default now()
);

create table if not exists zoekopdrachten (
  id                bigserial primary key,
  term              text not null,
  aantal_resultaten integer not null default 0,
  aangemaakt_op     timestamptz not null default now()
);

create table if not exists gebruiker_rollen (
  user_id  uuid not null references auth.users(id) on delete cascade,
  rol      text not null,
  primary key (user_id, rol)
);


-- ============================================================================
-- 2. INDEXEN
-- ============================================================================

create index if not exists idx_producten_categorie   on producten(categorie);
create index if not exists idx_producten_actief      on producten(actief);
create index if not exists idx_producten_slug        on producten(slug);
create index if not exists idx_product_fotos_product on product_fotos(product_id, volgorde);
create index if not exists idx_boekingen_email       on boekingen(email);
create index if not exists idx_boekingen_datums      on boekingen(start_datum, eind_datum);
create index if not exists idx_boekingen_status      on boekingen(status);
create index if not exists idx_boekingen_aangemaakt  on boekingen(aangemaakt_op desc);
create index if not exists idx_boeking_items_boeking on boeking_items(boeking_id);
create index if not exists idx_boeking_items_product on boeking_items(product_id);
create index if not exists idx_pageviews_aangemaakt  on pageviews(aangemaakt_op desc);
create index if not exists idx_zoek_aangemaakt       on zoekopdrachten(aangemaakt_op desc);


-- ============================================================================
-- 3. FUNCTIES
-- ============================================================================

create or replace function is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from gebruiker_rollen
    where user_id = auth.uid() and rol = 'admin'
  );
$$;

-- Geeft alleen het NUMMER terug ('0001'). De app plakt er de order-prefix
-- uit lib/config.ts voor.
create or replace function volgend_ordernummer()
returns text language plpgsql security definer
set search_path = public as $$
declare nieuw integer;
begin
  insert into nummering (soort, laatste) values ('order', 0)
    on conflict (soort) do nothing;
  update nummering set laatste = laatste + 1
   where soort = 'order' returning laatste into nieuw;
  return lpad(nieuw::text, 4, '0');
end;
$$;

-- Jaar + volgnummer, per jaar opnieuw beginnend: 20260001, 20260002, ...
create or replace function volgend_factuurnummer()
returns text language plpgsql security definer
set search_path = public as $$
declare
  jaar    text := to_char(now() at time zone 'Europe/Amsterdam', 'YYYY');
  sleutel text;
  nieuw   integer;
begin
  sleutel := 'factuur-' || jaar;
  insert into nummering (soort, laatste) values (sleutel, 0)
    on conflict (soort) do nothing;
  update nummering set laatste = laatste + 1
   where soort = sleutel returning laatste into nieuw;
  return jaar || lpad(nieuw::text, 4, '0');
end;
$$;

-- Dagen waarop dit product volledig vergeven is (voor de datumkiezer).
create or replace function bezette_datums(p_product_id integer)
returns table (datum date) language sql stable security definer
set search_path = public as $$
  with voorraad as (
    select coalesce(voorraad, 1) as aantal
      from producten where id = p_product_id
  ),
  per_dag as (
    select gs.dag::date as dag, sum(bi.aantal) as bezet
      from boeking_items bi
      join boekingen b on b.id = bi.boeking_id
      cross join lateral generate_series(
        b.start_datum, b.eind_datum, interval '1 day'
      ) gs(dag)
     where bi.product_id = p_product_id
       and b.status <> 'geannuleerd'
     group by 1
  )
  select pd.dag from per_dag pd cross join voorraad v
   where pd.bezet >= v.aantal order by 1;
$$;

-- Hoeveel stuks nog vrij over de hele gevraagde periode. 0 = niet beschikbaar.
create or replace function check_beschikbaarheid(
  product_id_param integer, start_datum_param date, eind_datum_param date
) returns integer language sql stable security definer
set search_path = public as $$
  select greatest(0,
    coalesce((select voorraad from producten where id = product_id_param), 0)
    - coalesce((
        select max(t.bezet) from (
          select sum(bi.aantal) as bezet
            from boeking_items bi
            join boekingen b on b.id = bi.boeking_id
            cross join lateral generate_series(
              b.start_datum, b.eind_datum, interval '1 day'
            ) gs(dag)
           where bi.product_id = product_id_param
             and b.status <> 'geannuleerd'
             and gs.dag::date between start_datum_param and eind_datum_param
           group by gs.dag
        ) t
      ), 0)
  );
$$;

-- Willekeurige producten voor de homepage. Alleen actieve producten uit
-- categorieen die op de website getoond worden.
create or replace function random_producten(aantal integer default 16)
returns setof producten language sql stable security definer
set search_path = public as $$
  select p.* from producten p
   where p.actief = true
     and p.categorie in (
       select c.naam from categorieen c
        where c.actief = true and c.tonen_op_website = true
     )
   order by random() limit aantal;
$$;


-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

alter table producten        enable row level security;
alter table product_fotos    enable row level security;
alter table categorieen      enable row level security;
alter table boekingen        enable row level security;
alter table boeking_items    enable row level security;
alter table pageviews        enable row level security;
alter table zoekopdrachten   enable row level security;
alter table gebruiker_rollen enable row level security;
alter table nummering        enable row level security;

-- Catalogus: iedereen leest, alleen admin schrijft.
drop policy if exists producten_select_publiek on producten;
create policy producten_select_publiek on producten for select using (true);
drop policy if exists producten_admin_alles on producten;
create policy producten_admin_alles on producten for all using (is_admin()) with check (is_admin());

drop policy if exists product_fotos_select_publiek on product_fotos;
create policy product_fotos_select_publiek on product_fotos for select using (true);
drop policy if exists product_fotos_admin_alles on product_fotos;
create policy product_fotos_admin_alles on product_fotos for all using (is_admin()) with check (is_admin());

drop policy if exists categorieen_select_publiek on categorieen;
create policy categorieen_select_publiek on categorieen for select using (true);
drop policy if exists categorieen_admin_alles on categorieen;
create policy categorieen_admin_alles on categorieen for all using (is_admin()) with check (is_admin());

-- Boekingen: anoniem mag AANMAKEN, niet lezen. Daarom zet de app het uuid zelf.
drop policy if exists boekingen_insert_publiek on boekingen;
create policy boekingen_insert_publiek on boekingen for insert with check (true);
drop policy if exists boekingen_admin_alles on boekingen;
create policy boekingen_admin_alles on boekingen for all using (is_admin()) with check (is_admin());

drop policy if exists boeking_items_insert_publiek on boeking_items;
create policy boeking_items_insert_publiek on boeking_items for insert with check (true);
drop policy if exists boeking_items_admin_alles on boeking_items;
create policy boeking_items_admin_alles on boeking_items for all using (is_admin()) with check (is_admin());

-- Analytics: iedereen schrijft, alleen admin leest.
drop policy if exists pageviews_insert_publiek on pageviews;
create policy pageviews_insert_publiek on pageviews for insert with check (true);
drop policy if exists pageviews_admin_select on pageviews;
create policy pageviews_admin_select on pageviews for select using (is_admin());

drop policy if exists zoek_insert_publiek on zoekopdrachten;
create policy zoek_insert_publiek on zoekopdrachten for insert with check (true);
drop policy if exists zoek_admin_select on zoekopdrachten;
create policy zoek_admin_select on zoekopdrachten for select using (is_admin());

-- Rollen: je mag alleen je eigen rol zien.
drop policy if exists rollen_eigen_select on gebruiker_rollen;
create policy rollen_eigen_select on gebruiker_rollen for select using (user_id = auth.uid());

-- Nummering: geen enkele policy = geen directe toegang. Dat is de bedoeling
-- (alleen de security-definer functies komen erbij).


-- ============================================================================
-- 5. SEED — basiscategorieën
-- ============================================================================
-- Dit is een MINIMALE start met de drie meest voorkomende categorieen.
-- De volledige categorielijst + producten komen uit een apart importbestand
-- (zie db/import_producten_voorbeeld.sql). 'springkussen' moet exact zo heten:
-- de code checkt daarop voor ondergrond/haspel/mailteksten.

insert into categorieen (naam, emoji, omschrijving, volgorde, actief, tonen_op_website)
values
  ('springkussen',   '🏰', 'Springkussens in verschillende maten en thema''s', 10, true, true),
  ('stormbaan',      '🏃', 'Stormbanen',                                        20, true, true),
  ('opblaasfiguren', '🎈', 'Opblaasfiguren',                                    30, true, true)
on conflict (naam) do nothing;


-- ============================================================================
-- 6. NA HET DRAAIEN — handmatig (zie NIEUWE_SITE.md)
-- ============================================================================
-- 1. Storage bucket 'producten' aanmaken (public).
-- 2. Producten importeren.
-- 3. Adminaccount + rol toevoegen.
-- 4. NOOIT "Disable legacy API keys" aanzetten in dit project.
-- ============================================================================
