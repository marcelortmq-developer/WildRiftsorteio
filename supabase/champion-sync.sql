create table public.wr_champion_additions(
 champion_id text primary key references public.wr_champion_catalog(champion_id),
 nome text not null check(length(trim(nome))>0),
 rotas text[] not null check(public.wr_valid_routes(rotas)),
 link text not null check(link='https://wildriftcore.com/champions/'||champion_id||'/'),
 image_path text not null check(split_part(image_path,'/',1)=champion_id and image_path ~ '^[a-z0-9-]+/[a-f0-9-]{36}\.webp$'),
 source_image_url text not null,
 created_at timestamptz not null default now()
);
alter table public.wr_champion_additions enable row level security;
revoke all on public.wr_champion_additions from anon,authenticated;
grant select on public.wr_champion_additions to anon,authenticated;
grant all on public.wr_champion_additions to service_role;
create policy wr_additions_read on public.wr_champion_additions for select to anon,authenticated using(true);
create table public.wr_champion_sync_config(id integer primary key check(id=1),token_hash text not null);
create table public.wr_champion_sync_runs(id bigint generated always as identity primary key,created_at timestamptz not null default now(),success boolean not null,discovered integer not null,added integer not null,error text);
alter table public.wr_champion_sync_config enable row level security;
alter table public.wr_champion_sync_runs enable row level security;
revoke all on public.wr_champion_sync_config,public.wr_champion_sync_runs from anon,authenticated;
grant all on public.wr_champion_sync_config,public.wr_champion_sync_runs to service_role;
grant usage,select on sequence public.wr_champion_sync_runs_id_seq to service_role;
grant insert,select on public.wr_champion_catalog to service_role;
create function public.wr_add_discovered_champion(record jsonb) returns boolean language plpgsql security invoker set search_path='' as $$
declare inserted integer;
begin
 perform pg_advisory_xact_lock(87641053);
 if exists(select 1 from public.wr_champion_catalog where replace(champion_id,'-','')=replace(record->>'champion_id','-','')) then return false; end if;
 insert into public.wr_champion_catalog(champion_id) values(record->>'champion_id') on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return false; end if;
 insert into public.wr_champion_additions(champion_id,nome,rotas,link,image_path,source_image_url)
 select champion_id,nome,rotas,link,image_path,source_image_url from jsonb_populate_record(null::public.wr_champion_additions,record);
 return true;
end $$;
revoke all on function public.wr_add_discovered_champion(jsonb) from public,anon,authenticated;
grant execute on function public.wr_add_discovered_champion(jsonb) to service_role;
