-- Handy queries for the Supabase SQL Editor.

-- Where do players stop? best stage reached per player
select best_stage, count(*) players from private.funnel group by best_stage order by best_stage;

-- Stages that beat players most often (last 7 days)
select stage, count(*) losses from public.play_events
where kind = 'stage_loss' and created_at > now() - interval '7 days'
group by stage order by losses desc limit 15;

-- Daily active players
select date_trunc('day', created_at) day, count(distinct user_id) players
from public.play_events where kind = 'session' group by 1 order by 1 desc limit 30;

-- Latest feedback
select created_at, name, stage, message from public.feedback order by created_at desc limit 50;

-- Clean up anonymous accounts idle for 60 days (run occasionally)
-- delete from auth.users u where is_anonymous and not exists (
--   select 1 from public.players p where p.id = u.id and p.updated_at > now() - interval '60 days');
