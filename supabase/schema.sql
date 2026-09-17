-- Execute uma vez no SQL Editor do projeto Supabase destinado ao Sorteio WR.
-- Lista original permanece no JSON. Banco guarda somente alterações e IDs válidos.
create table public.wr_champion_catalog (champion_id text primary key);
create table public.wr_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create function public.wr_valid_routes(routes text[]) returns boolean
language sql immutable strict security invoker set search_path = '' as $$
 select cardinality(routes) between 1 and 5
 and routes <@ array['TOP','JUNGLE','MID','ADC','SUPPORT']::text[]
 and array_position(routes,null) is null
 and cardinality(routes)=(select count(distinct r) from unnest(routes) r);
$$;
create table public.wr_champion_overrides (
 champion_id text primary key references public.wr_champion_catalog(champion_id),
 rotas text[] not null check (public.wr_valid_routes(rotas)),
 image_path text,
 version integer not null default 1 check (version > 0),
 updated_at timestamptz not null default now(),
 constraint wr_image_path check (image_path is null or image_path = '' or
  (split_part(image_path,'/',1)=champion_id and image_path ~ '^[a-z0-9-]+/[a-f0-9-]{36}\.webp$'))
);
create function public.wr_stamp_version() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
 new.version := case when TG_OP='INSERT' then 1 else old.version+1 end;
 new.updated_at := now();
 return new;
end;
$$;
create trigger wr_stamp_version before insert or update on public.wr_champion_overrides
for each row execute function public.wr_stamp_version();
alter table public.wr_champion_catalog enable row level security;
alter table public.wr_admins enable row level security;
alter table public.wr_champion_overrides enable row level security;
revoke all on public.wr_champion_catalog, public.wr_admins, public.wr_champion_overrides from anon, authenticated;
grant select on public.wr_champion_catalog, public.wr_champion_overrides to anon, authenticated;
grant select on public.wr_admins to authenticated;
grant insert(champion_id,rotas,image_path), update(rotas,image_path) on public.wr_champion_overrides to authenticated;
create policy wr_catalog_read on public.wr_champion_catalog for select to anon,authenticated using (true);
create policy wr_admin_self_read on public.wr_admins for select to authenticated using (user_id=(select auth.uid()));
create policy wr_champions_read on public.wr_champion_overrides for select to anon,authenticated using (true);
create policy wr_champions_insert on public.wr_champion_overrides for insert to authenticated
with check (exists(select 1 from public.wr_admins where user_id=(select auth.uid())));
create policy wr_champions_update on public.wr_champion_overrides for update to authenticated
using (exists(select 1 from public.wr_admins where user_id=(select auth.uid())))
with check (exists(select 1 from public.wr_admins where user_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('wr-champion-images','wr-champion-images',true,5242880,array['image/webp']);
create policy wr_images_admin_insert on storage.objects for insert to authenticated
with check(bucket_id='wr-champion-images'
 and exists(select 1 from public.wr_admins where user_id=(select auth.uid()))
 and exists(select 1 from public.wr_champion_catalog where champion_id=(storage.foldername(name))[1])
 and name ~ '^[a-z0-9-]+/[a-f0-9-]{36}\.webp$');
-- URLs públicas permitem exibir as imagens; somente o administrador pode criar arquivos.
-- Substituições usam nomes únicos. Não se permite sobrescrever ou excluir imagens em uso.
