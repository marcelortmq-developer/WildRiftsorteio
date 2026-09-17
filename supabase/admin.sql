-- Depois de criar sua conta em Authentication > Users, substitua o UUID.
-- Não execute este exemplo sem substituir o valor.
insert into public.wr_admins(user_id)
values ('COLE_O_USER_UID_AQUI'::uuid)
on conflict do nothing;
