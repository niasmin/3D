-- Isolated 3D edition data. No writes to original players/saves tables.
create table public.samkok3d_players (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default 'ท่านเจ้าเมือง' check(char_length(name) between 1 and 24),
 doc jsonb not null default '{}' check(jsonb_typeof(doc)='object' and octet_length(doc::text)<=32768),
 updated_at timestamptz not null default now()
);
create index samkok3d_players_recent on public.samkok3d_players(updated_at desc);
create table public.samkok3d_saves (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null check(jsonb_typeof(data)='object' and data->>'v'='1' and octet_length(data::text)<=1048576),
 revision bigint not null default 1 check(revision>0), updated_at timestamptz not null default now()
);
alter table public.samkok3d_players enable row level security;
alter table public.samkok3d_saves enable row level security;
create policy "3d players read shared profiles" on public.samkok3d_players for select to authenticated using(true);
create policy "3d players insert own profile" on public.samkok3d_players for insert to authenticated with check(id=(select auth.uid()));
create policy "3d players update own profile" on public.samkok3d_players for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy "3d owners read saves" on public.samkok3d_saves for select to authenticated using(user_id=(select auth.uid()));
create policy "3d owners insert saves" on public.samkok3d_saves for insert to authenticated with check(user_id=(select auth.uid()));
create policy "3d owners update saves" on public.samkok3d_saves for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke all on public.samkok3d_players,public.samkok3d_saves from anon;
grant select,insert,update on public.samkok3d_players,public.samkok3d_saves to authenticated;
create function public.samkok3d_stamp_profile() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now();return new;end $$;
create trigger stamp_3d_profile before update on public.samkok3d_players for each row execute function public.samkok3d_stamp_profile();
create function public.save_3d_game(p_data jsonb,p_revision bigint) returns jsonb language plpgsql security invoker set search_path='' as $$
declare who uuid:=auth.uid();result public.samkok3d_saves;
begin
 if who is null then raise exception 'authentication required' using errcode='42501';end if;
 if p_revision=0 then
  insert into public.samkok3d_saves(user_id,data) values(who,p_data) on conflict do nothing returning * into result;
 else
  update public.samkok3d_saves set data=p_data,revision=revision+1,updated_at=now() where user_id=who and revision=p_revision returning * into result;
 end if;
 if result.user_id is null then raise exception 'cloud save conflict' using errcode='40001';end if;
 return jsonb_build_object('revision',result.revision,'updated_at',result.updated_at);
end $$;
create table private.samkok3d_transfers (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 code_hash text unique not null, snapshot jsonb not null, expires_at timestamptz not null
);
alter table private.samkok3d_transfers enable row level security;
revoke all on private.samkok3d_transfers from public,anon,authenticated;
create function private.make_3d_transfer_code() returns text language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid();token text:=upper(encode(extensions.gen_random_bytes(9),'hex'));snapshot jsonb;
begin
 if who is null then raise exception 'authentication required' using errcode='42501';end if;
 select data into snapshot from public.samkok3d_saves where user_id=who;
 if snapshot is null then raise exception 'save to cloud first' using errcode='P0002';end if;
 insert into private.samkok3d_transfers(owner_id,code_hash,snapshot,expires_at) values(who,encode(extensions.digest(token,'sha256'),'hex'),snapshot,now()+interval '20 minutes')
 on conflict(owner_id) do update set code_hash=excluded.code_hash,snapshot=excluded.snapshot,expires_at=excluded.expires_at;
 return token;
end $$;
create function private.claim_3d_transfer(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid();snapshot jsonb;rev bigint;
begin
 if who is null then raise exception 'authentication required' using errcode='42501';end if;
 if p_code !~ '^[A-Fa-f0-9]{18}$' then raise exception 'invalid transfer code' using errcode='P0002';end if;
 delete from private.samkok3d_transfers where code_hash=encode(extensions.digest(upper(p_code),'sha256'),'hex') and expires_at>now() returning private.samkok3d_transfers.snapshot into snapshot;
 if snapshot is null then raise exception 'invalid or expired transfer code' using errcode='P0002';end if;
 insert into public.samkok3d_saves(user_id,data) values(who,snapshot) on conflict(user_id) do update set data=excluded.data,revision=public.samkok3d_saves.revision+1,updated_at=now() returning revision into rev;
 return jsonb_build_object('data',snapshot,'revision',rev);
end $$;
create function public.make_3d_transfer_code() returns text language sql security invoker set search_path='' as $$select private.make_3d_transfer_code()$$;
create function public.claim_3d_transfer(p_code text) returns jsonb language sql security invoker set search_path='' as $$select private.claim_3d_transfer(p_code)$$;
revoke execute on function private.make_3d_transfer_code(),private.claim_3d_transfer(text),public.make_3d_transfer_code(),public.claim_3d_transfer(text),public.save_3d_game(jsonb,bigint) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.make_3d_transfer_code(),private.claim_3d_transfer(text),public.make_3d_transfer_code(),public.claim_3d_transfer(text),public.save_3d_game(jsonb,bigint) to authenticated;
