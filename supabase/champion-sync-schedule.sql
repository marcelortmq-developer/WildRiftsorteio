create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
-- Vault stores the private scheduler token. It never enters the repository or browser.
do $$
declare token text;
begin
 select decrypted_secret into token from vault.decrypted_secrets where name='wr_champion_sync_token';
 if token is null then
  token:=gen_random_uuid()::text||gen_random_uuid()::text;
  perform vault.create_secret(token,'wr_champion_sync_token','Private hourly champion import');
 end if;
 insert into public.wr_champion_sync_config(id,token_hash) values(1,encode(sha256(convert_to(token,'UTF8')),'hex')) on conflict(id) do update set token_hash=excluded.token_hash;
end $$;
select cron.schedule('wr-sync-champions-hourly','17 * * * *',$job$
 select net.http_post(
 url:='https://ftpoxhofyprvxuhfxews.supabase.co/functions/v1/wr-sync-champions',
 headers:=jsonb_build_object('Content-Type','application/json','x-wr-sync-token',(select decrypted_secret from vault.decrypted_secrets where name='wr_champion_sync_token')),
 body:='{}'::jsonb,timeout_milliseconds:=120000);
$job$);
