create table public.wr_items (
 id text primary key check (id ~ '^[0-9]+$'),
 name text not null check (length(trim(name)) > 0),
 price integer check (price >= 0),
 categories text[] not null check (cardinality(categories)>0),
 source_categories text[] not null,
 source_category_ids integer[] not null,
 source_url text not null,
 source_image_url text not null,
 image_path text not null check (image_path ~ '^[0-9]+/[a-f0-9]{64}\.(png|webp|jpg)$'),
 description text not null default '',
 recipe jsonb not null default '[]',
 source_updated_at timestamptz,
 is_boot boolean not null default false,
 active boolean not null default true,
 synced_at timestamptz not null default now()
);
alter table public.wr_items enable row level security;
revoke all on public.wr_items from anon, authenticated;
grant select on public.wr_items to anon, authenticated;
grant all on public.wr_items to service_role;
create policy "Items are publicly readable" on public.wr_items for select to anon, authenticated using(active);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('wr-item-images','wr-item-images',true,5242880,array['image/png','image/webp','image/jpeg']) on conflict(id) do nothing;
-- No browser write policies: imports only run on trusted servers.
create function public.wr_sync_items(payload jsonb) returns integer language plpgsql security invoker set search_path = '' as $$
declare total integer;
begin
 perform pg_advisory_xact_lock(87641052);
 if jsonb_typeof(payload)<>'array' or jsonb_array_length(payload)<100 then raise exception 'Incomplete import'; end if;
 select count(distinct x->>'id') into total from jsonb_array_elements(payload) x;
 if total<>jsonb_array_length(payload) then raise exception 'Duplicate source IDs'; end if;
 insert into public.wr_items(id,name,price,categories,source_categories,source_category_ids,source_url,source_image_url,image_path,description,recipe,source_updated_at,is_boot,active,synced_at)
 select id,name,price,categories,source_categories,source_category_ids,source_url,source_image_url,image_path,description,recipe,source_updated_at,is_boot,true,now()
 from jsonb_populate_recordset(null::public.wr_items,payload)
 on conflict(id) do update set name=excluded.name,price=excluded.price,categories=excluded.categories,source_categories=excluded.source_categories,source_category_ids=excluded.source_category_ids,source_url=excluded.source_url,source_image_url=excluded.source_image_url,image_path=excluded.image_path,description=excluded.description,recipe=excluded.recipe,source_updated_at=excluded.source_updated_at,is_boot=excluded.is_boot,active=true,synced_at=now();
 update public.wr_items set active=false,synced_at=now() where id not in(select x->>'id' from jsonb_array_elements(payload) x);
 return total;
end $$;
revoke all on function public.wr_sync_items(jsonb) from public,anon,authenticated;
grant execute on function public.wr_sync_items(jsonb) to service_role;
