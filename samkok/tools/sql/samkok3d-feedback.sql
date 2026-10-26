create table public.samkok3d_feedback (
 id bigint generated always as identity primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 message text not null check(char_length(message) between 1 and 1000),
 name text not null default '' check(char_length(name)<=24),
 stage integer not null default 1 check(stage>0),created_at timestamptz not null default now()
);
alter table public.samkok3d_feedback enable row level security;
create policy "3d players submit own feedback" on public.samkok3d_feedback for insert to authenticated with check(user_id=(select auth.uid()));
revoke all on public.samkok3d_feedback from public,anon,authenticated;
grant insert on public.samkok3d_feedback to authenticated;
grant usage on sequence public.samkok3d_feedback_id_seq to authenticated;
