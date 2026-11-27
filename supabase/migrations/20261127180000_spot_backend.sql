-- =============================================================================
-- Spot : base de données Supabase (PostgreSQL)
--
-- Règle d'or : TOUTE table du schéma public a la sécurité ligne par ligne (RLS)
-- activée. La clé publique de l'app est lisible par tous : seules ces règles
-- décident qui voit et modifie quoi.
--
--   - un spot privé n'est visible que par son créateur ;
--   - les spots et messages des personnes que j'ai bloquées me sont masqués ;
--   - une personne que j'ai bloquée ne peut plus écrire sur mes spots ni me répondre ;
--   - le nom de l'auteur est rempli par le serveur (impossible de se faire passer pour un autre) ;
--   - des limites horaires freinent le spam.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profils (un par compte Supabase Auth)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  photo_url    text check (photo_url is null or char_length(photo_url) <= 2000),
  created_at   timestamptz not null default now()
);

-- Création automatique du profil à l'inscription (nom et photo fournis par Facebook, Apple ou Google).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, photo_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. Spots
-- -----------------------------------------------------------------------------
create table public.spots (
  id           text primary key check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  -- Null quand le créateur a supprimé son compte en gardant ses spots publics (anonymes).
  owner_id     uuid references public.profiles (id) on delete set null default auth.uid(),
  owner_name   text not null default '',
  owner_photo  text,
  name         text not null default '' check (char_length(name) <= 120),
  latitude     double precision not null check (latitude between -90 and 90),
  longitude    double precision not null check (longitude between -180 and 180),
  species_ids  text[] not null default '{}' check (cardinality(species_ids) <= 50),
  bait_ids     text[] not null default '{}' check (cardinality(bait_ids) <= 50),
  activity     text check (activity in ('good', 'medium', 'none')),
  visibility   text not null default 'private' check (visibility in ('private', 'public')),
  description  text not null default '' check (char_length(description) <= 500),
  -- Chemins dans le stockage « spot-photos » (pas d'URL : elles sont signées à la lecture).
  photos       text[] not null default '{}' check (cardinality(photos) <= 6),
  -- Date choisie par l'app (création hors connexion possible), jamais dans le futur.
  created_at   timestamptz not null default now(),
  -- Date réelle d'arrivée sur le serveur : sert aux limites anti-spam, non modifiable par l'app.
  inserted_at  timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index spots_owner_idx on public.spots (owner_id);
create index spots_position_idx on public.spots (latitude, longitude);
create index spots_public_idx on public.spots (visibility) where visibility = 'public';

-- -----------------------------------------------------------------------------
-- 3. Discussion des spots, réactions et avis « ça mord ? »
-- -----------------------------------------------------------------------------
create table public.spot_messages (
  id            text primary key check (id ~ '^[A-Za-z0-9_#-]{1,120}$'),
  spot_id       text not null references public.spots (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null default auth.uid(),
  author_name   text not null default '',
  author_photo  text,
  text          text not null default '' check (char_length(text) <= 500),
  photos        text[] not null default '{}' check (cardinality(photos) <= 4),
  -- Réponse à un message (ou à la publication du créateur : « <spot>#post »).
  reply_to_id   text,
  reply_author  text,
  reply_excerpt text,
  created_at    timestamptz not null default now(),
  inserted_at   timestamptz not null default now(),
  check (char_length(text) > 0 or cardinality(photos) > 0)
);

create index spot_messages_spot_idx on public.spot_messages (spot_id, created_at);
create index spot_messages_author_idx on public.spot_messages (author_id);

create table public.message_reactions (
  message_id text not null,
  user_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  emoji      text not null check (emoji in ('👍', '❤️', '😆', '😮', '🎣', '🐟')),
  primary key (message_id, user_id)
);

create table public.spot_activity_votes (
  spot_id    text not null references public.spots (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  activity   text not null check (activity in ('good', 'medium', 'none')),
  updated_at timestamptz not null default now(),
  primary key (spot_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 4. Modération : blocages et signalements
-- -----------------------------------------------------------------------------
create table public.user_blocks (
  blocker_id   uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  blocked_id   uuid not null references public.profiles (id) on delete cascade,
  blocked_name text not null default '' check (char_length(blocked_name) <= 80),
  created_at   timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.reports (
  id          text primary key check (id ~ '^[A-Za-z0-9_-]{1,100}$'),
  reporter_id uuid references public.profiles (id) on delete set null default auth.uid(),
  target_kind text not null check (target_kind in ('spot', 'message')),
  spot_id     text not null,
  message_id  text,
  reason      text not null check (reason in ('forbidden', 'inappropriate', 'spam', 'false', 'other')),
  details     text not null default '' check (char_length(details) <= 500),
  -- Suivi par l'équipe de modération (non modifiable par les utilisateurs).
  status      text not null default 'open' check (status in ('open', 'reviewed', 'actioned', 'dismissed')),
  created_at  timestamptz not null default now(),
  check ((target_kind = 'message') = (message_id is not null)),
  check (reason <> 'other' or char_length(details) > 0)
);

create index reports_reporter_idx on public.reports (reporter_id);
create index reports_open_idx on public.reports (status, created_at) where status = 'open';
-- Pas deux signalements de la même chose par la même personne.
create unique index reports_unique_target_idx on public.reports (reporter_id, target_kind, spot_id, coalesce(message_id, ''));

-- -----------------------------------------------------------------------------
-- 5. Fonctions utilitaires des règles de sécurité
-- -----------------------------------------------------------------------------

-- Ai-je bloqué cette personne ? (lit mes propres blocages : pas besoin de droits particuliers)
create function public.is_blocked_by_me(target uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select target is not null and exists (
    select 1 from public.user_blocks b where b.blocker_id = auth.uid() and b.blocked_id = target
  );
$$;

-- Cette personne m'a-t-elle bloqué ? (lit les blocages des AUTRES : security definer,
-- mais ne renvoie qu'un oui/non et seulement pour l'utilisateur connecté)
create function public.has_blocked_me(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target is not null and exists (
    select 1 from public.user_blocks b where b.blocker_id = target and b.blocked_id = auth.uid()
  );
$$;

-- L'auteur du message cité m'a-t-il bloqué ? (même principe : un simple oui/non pour moi)
create function public.reply_author_blocked_me(p_message_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.spot_messages m
    join public.user_blocks b on b.blocker_id = m.author_id and b.blocked_id = auth.uid()
    where m.id = p_message_id
  );
$$;

-- -----------------------------------------------------------------------------
-- 6. Triggers : données remplies par le serveur, immuables, limites anti-spam
-- -----------------------------------------------------------------------------

-- Spots : le créateur et son nom viennent du compte connecté, jamais de l'app.
create function public.spots_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
begin
  if tg_op = 'INSERT' then
    select * into p from public.profiles where id = auth.uid();
    if p.id is null then
      raise exception 'Profil introuvable' using errcode = '42501';
    end if;
    new.owner_id := p.id;
    new.owner_name := p.display_name;
    new.owner_photo := p.photo_url;
    new.inserted_at := now();
  elsif coalesce(current_setting('spot.trusted_write', true), '') = 'on' then
    -- Écriture faite par une fonction du serveur (suppression de compte) : on la laisse passer.
    null;
  elsif new.owner_id is null and old.owner_id is not null
        and not exists (select 1 from public.profiles where id = old.owner_id) then
    -- Le compte du créateur vient d'être supprimé (clé étrangère « on delete set null »).
    null;
  else
    -- Le créateur, sa date d'arrivée et sa date de création ne changent jamais.
    new.owner_id := old.owner_id;
    new.owner_name := old.owner_name;
    new.owner_photo := old.owner_photo;
    new.inserted_at := old.inserted_at;
    new.created_at := old.created_at;
  end if;
  new.created_at := least(coalesce(new.created_at, now()), now());
  new.updated_at := now();
  return new;
end;
$$;

create trigger spots_before_write
  before insert or update on public.spots
  for each row execute function public.spots_before_write();

-- Messages : auteur, nom et citation remplis par le serveur.
create function public.spot_messages_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p public.profiles;
  quoted public.spot_messages;
  quoted_spot public.spots;
begin
  select * into p from public.profiles where id = auth.uid();
  if p.id is null then
    raise exception 'Profil introuvable' using errcode = '42501';
  end if;
  new.author_id := p.id;
  new.author_name := p.display_name;
  new.author_photo := p.photo_url;
  new.inserted_at := now();
  new.created_at := least(coalesce(new.created_at, now()), now());

  -- La citation est recopiée depuis le message cité (ou la publication du créateur).
  if new.reply_to_id is not null then
    if new.reply_to_id = new.spot_id || '#post' then
      select * into quoted_spot from public.spots where id = new.spot_id;
      new.reply_author := coalesce(quoted_spot.owner_name, '');
      new.reply_excerpt := left(coalesce(quoted_spot.description, ''), 80);
    else
      select * into quoted from public.spot_messages where id = new.reply_to_id and spot_id = new.spot_id;
      if quoted.id is null then
        raise exception 'Message cité introuvable' using errcode = '23503';
      end if;
      new.reply_author := quoted.author_name;
      new.reply_excerpt := left(quoted.text, 80);
    end if;
  else
    new.reply_author := null;
    new.reply_excerpt := null;
  end if;
  return new;
end;
$$;

create trigger spot_messages_before_insert
  before insert on public.spot_messages
  for each row execute function public.spot_messages_before_insert();

-- Limite anti-spam : au plus N lignes par personne et par heure.
-- Arguments : colonne de l'auteur, nombre maximum, colonne de date.
create function public.enforce_hourly_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  execute format(
    'select count(*) from %I.%I where %I = $1 and %I > now() - interval ''1 hour''',
    tg_table_schema, tg_table_name, tg_argv[0], tg_argv[2]
  ) into recent using auth.uid();
  if recent >= tg_argv[1]::integer then
    raise exception 'Trop d''actions en peu de temps, réessayez plus tard' using errcode = 'P0429';
  end if;
  return new;
end;
$$;

create trigger spots_hourly_limit
  before insert on public.spots
  for each row execute function public.enforce_hourly_limit('owner_id', '30', 'inserted_at');

create trigger spot_messages_hourly_limit
  before insert on public.spot_messages
  for each row execute function public.enforce_hourly_limit('author_id', '60', 'inserted_at');

create trigger reports_hourly_limit
  before insert on public.reports
  for each row execute function public.enforce_hourly_limit('reporter_id', '20', 'created_at');

-- Signalements et blocages : l'auteur est toujours l'utilisateur connecté.
create function public.set_reporter()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reporter_id := auth.uid();
  new.status := 'open';
  new.created_at := now();
  return new;
end;
$$;

create trigger reports_set_reporter
  before insert on public.reports
  for each row execute function public.set_reporter();

-- -----------------------------------------------------------------------------
-- 7. Sécurité ligne par ligne (RLS)
-- -----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.spots               enable row level security;
alter table public.spot_messages       enable row level security;
alter table public.message_reactions   enable row level security;
alter table public.spot_activity_votes enable row level security;
alter table public.user_blocks         enable row level security;
alter table public.reports             enable row level security;

-- Profils : les noms sont visibles par les membres connectés ; chacun modifie le sien.
create policy "profils lisibles par les membres" on public.profiles
  for select to authenticated using (true);
create policy "modifier mon profil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Spots : publics (sauf personnes bloquées) ou les miens.
create policy "voir les spots publics ou les miens" on public.spots
  for select to authenticated
  using (owner_id = auth.uid() or (visibility = 'public' and not public.is_blocked_by_me(owner_id)));
create policy "créer mes spots" on public.spots
  for insert to authenticated with check (owner_id = auth.uid());
create policy "modifier mes spots" on public.spots
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "supprimer mes spots" on public.spots
  for delete to authenticated using (owner_id = auth.uid());

-- Messages : seulement sur un spot que je vois, pas ceux des personnes bloquées.
create policy "voir les messages des spots visibles" on public.spot_messages
  for select to authenticated
  using (
    exists (select 1 from public.spots s where s.id = spot_id)
    and not public.is_blocked_by_me(author_id)
  );
-- Écrire : spot visible, et ni le créateur du spot ni l'auteur cité ne m'ont bloqué.
create policy "écrire sur un spot visible" on public.spot_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.spots s where s.id = spot_id and not public.has_blocked_me(s.owner_id))
    and (
      reply_to_id is null
      or reply_to_id = spot_id || '#post'
      or not public.reply_author_blocked_me(reply_to_id)
    )
  );
create policy "supprimer mes messages" on public.spot_messages
  for delete to authenticated using (author_id = auth.uid());

-- Réactions : sur un message (ou une publication de créateur) que je vois.
create policy "voir les réactions des messages visibles" on public.message_reactions
  for select to authenticated
  using (
    exists (select 1 from public.spot_messages m where m.id = message_id)
    or exists (select 1 from public.spots s where s.id || '#post' = message_id)
  );
create policy "réagir à un message visible" on public.message_reactions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (
      exists (select 1 from public.spot_messages m where m.id = message_id)
      or exists (select 1 from public.spots s where s.id || '#post' = message_id)
    )
  );
create policy "changer ma réaction" on public.message_reactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "retirer ma réaction" on public.message_reactions
  for delete to authenticated using (user_id = auth.uid());

-- Avis « ça mord ? » : sur un spot visible, un seul par personne.
create policy "voir les avis des spots visibles" on public.spot_activity_votes
  for select to authenticated using (exists (select 1 from public.spots s where s.id = spot_id));
create policy "donner mon avis" on public.spot_activity_votes
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.spots s where s.id = spot_id));
create policy "changer mon avis" on public.spot_activity_votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "retirer mon avis" on public.spot_activity_votes
  for delete to authenticated using (user_id = auth.uid());

-- Blocages : chacun ne voit et ne gère que les siens.
create policy "mes blocages" on public.user_blocks
  for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Signalements : on peut en envoyer et relire les siens ; jamais modifier ni voir ceux des autres.
create policy "envoyer un signalement" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "voir mes signalements" on public.reports
  for select to authenticated using (reporter_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8. Droits : rien pour les visiteurs non connectés, le nécessaire pour les membres
-- -----------------------------------------------------------------------------
revoke all on public.profiles, public.spots, public.spot_messages, public.message_reactions,
  public.spot_activity_votes, public.user_blocks, public.reports from anon;
grant select, update (display_name, photo_url) on public.profiles to authenticated;
grant select, insert, update, delete on public.spots, public.message_reactions,
  public.spot_activity_votes, public.user_blocks to authenticated;
grant select, insert, delete on public.spot_messages to authenticated;
grant select, insert on public.reports to authenticated;

revoke execute on function public.has_blocked_me(uuid), public.reply_author_blocked_me(text) from public, anon;
grant execute on function public.has_blocked_me(uuid), public.is_blocked_by_me(uuid),
  public.reply_author_blocked_me(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Fonctions appelées par l'app (RPC)
-- -----------------------------------------------------------------------------

-- Compléter les espèces ou appâts d'un spot que je vois (public ou le mien) : on ajoute, on n'efface jamais.
create function public.add_spot_items(p_spot_id text, p_species text[] default '{}', p_baits text[] default '{}')
returns public.spots
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.spots;
  bad text;
begin
  select * into s from public.spots where id = p_spot_id;
  if s.id is null
     or not (s.owner_id = auth.uid() or (s.visibility = 'public' and not public.is_blocked_by_me(s.owner_id)))
  then
    raise exception 'Spot introuvable' using errcode = 'P0002';
  end if;
  if public.has_blocked_me(s.owner_id) then
    raise exception 'Action impossible sur ce spot' using errcode = '42501';
  end if;
  select x into bad from unnest(coalesce(p_species, '{}') || coalesce(p_baits, '{}')) as x
    where x !~ '^[a-z0-9-]{1,40}$' limit 1;
  if bad is not null then
    raise exception 'Élément inconnu : %', bad using errcode = '22023';
  end if;

  update public.spots set
    species_ids = (select coalesce(array_agg(distinct x), '{}') from unnest(species_ids || coalesce(p_species, '{}')) as x),
    bait_ids    = (select coalesce(array_agg(distinct x), '{}') from unnest(bait_ids || coalesce(p_baits, '{}')) as x)
  where id = p_spot_id
  returning * into s;
  return s;
end;
$$;

revoke execute on function public.add_spot_items(text, text[], text[]) from public, anon;
grant execute on function public.add_spot_items(text, text[], text[]) to authenticated;

-- Effacer mes données (suppression du compte). Renvoie les chemins des photos à supprimer du stockage.
-- Appelée par la fonction serveur « delete-account », qui supprime ensuite les fichiers et le compte Auth.
create function public.delete_my_data(p_public_content text)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  removed_photos text[];
begin
  if me is null then
    raise exception 'Non connecté' using errcode = '42501';
  end if;
  if p_public_content not in ('delete', 'anonymize') then
    raise exception 'Choix inconnu : %', p_public_content using errcode = '22023';
  end if;
  -- Autorise les modifications du créateur dans spots_before_write, pour cette transaction seulement.
  perform set_config('spot.trusted_write', 'on', true);

  -- Spots supprimés : tous les miens, ou seulement les privés si le contenu public est gardé.
  create temporary table doomed_spots on commit drop as
    select id, photos from public.spots
    where owner_id = me and (p_public_content = 'delete' or visibility = 'private');

  -- Messages supprimés : ceux de ces spots, plus tous les miens si « tout supprimer ».
  create temporary table doomed_messages on commit drop as
    select id, photos from public.spot_messages
    where spot_id in (select id from doomed_spots)
       or (p_public_content = 'delete' and author_id = me);

  select coalesce(array_agg(distinct p), '{}') into removed_photos
  from (
    select unnest(photos) as p from doomed_spots
    union
    select unnest(photos) from doomed_messages
  ) all_photos;

  delete from public.message_reactions
  where message_id in (select id from doomed_messages)
     or message_id in (select id || '#post' from doomed_spots);
  delete from public.spot_messages where id in (select id from doomed_messages);
  delete from public.spots where id in (select id from doomed_spots);

  if p_public_content = 'anonymize' then
    -- Contenu public gardé, sans nom ni photo de profil (le lien avec le compte disparaît avec lui).
    update public.spots set owner_name = '', owner_photo = null where owner_id = me;
    update public.spot_messages m set reply_author = ''
      where m.reply_to_id in (select id from public.spot_messages where author_id = me);
    update public.spot_messages set author_name = '', author_photo = null where author_id = me;
  end if;

  delete from public.message_reactions where user_id = me;
  delete from public.spot_activity_votes where user_id = me;
  delete from public.user_blocks where blocker_id = me or blocked_id = me;
  delete from public.reports where reporter_id = me;

  return removed_photos;
end;
$$;

revoke execute on function public.delete_my_data(text) from public, anon;
grant execute on function public.delete_my_data(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 10. Photos : stockage privé « spot-photos », un dossier par utilisateur (<uid>/<fichier>)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('spot-photos', 'spot-photos', false)
on conflict (id) do nothing;

create policy "envoyer mes photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'spot-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Lire : mes fichiers, ou ceux d'un spot / message que je vois (les règles des spots s'appliquent).
create policy "voir les photos des spots visibles" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'spot-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.spots s where objects.name = any (s.photos))
      or exists (select 1 from public.spot_messages m where objects.name = any (m.photos))
    )
  );

create policy "supprimer mes photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'spot-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- -----------------------------------------------------------------------------
-- 11. Temps réel : la discussion des spots se met à jour sans recharger
--     (les règles RLS ci-dessus s'appliquent aussi aux messages diffusés)
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.spot_messages, public.message_reactions;
  end if;
end;
$$;
