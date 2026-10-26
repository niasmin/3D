create table public.samkok3d_messages (
 id bigint generated always as identity primary key,
 sender_id uuid not null references auth.users(id) on delete cascade,
 channel text not null check(channel in ('w','g')),
 guild_id integer,
 body text not null check(char_length(body) between 1 and 140),
 created_at timestamptz not null default now(),
 check((channel='w' and guild_id is null) or (channel='g' and guild_id is not null))
);
create index samkok3d_messages_recent on public.samkok3d_messages(created_at desc);
alter table public.samkok3d_messages enable row level security;
create policy "3d readers see world or own guild messages" on public.samkok3d_messages for select to authenticated using(channel='w' or exists(select 1 from public.samkok3d_players p where p.id=(select auth.uid()) and p.doc->>'guild'=guild_id::text));
create policy "3d senders write world or own guild messages" on public.samkok3d_messages for insert to authenticated with check(sender_id=(select auth.uid()) and (channel='w' or exists(select 1 from public.samkok3d_players p where p.id=(select auth.uid()) and p.doc->>'guild'=guild_id::text)));
revoke all on public.samkok3d_messages from public,anon;
grant select,insert on public.samkok3d_messages to authenticated;
grant usage on sequence public.samkok3d_messages_id_seq to authenticated;
