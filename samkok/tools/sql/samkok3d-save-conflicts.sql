-- A business conflict is a result, not a retryable SQL serialization exception.
create or replace function public.save_3d_game(p_data jsonb,p_revision bigint) returns jsonb language plpgsql security invoker set search_path='' as $$
declare who uuid:=auth.uid();result public.samkok3d_saves; current_revision bigint;
begin
 if who is null then raise exception 'authentication required' using errcode='42501';end if;
 if p_revision=0 then
  insert into public.samkok3d_saves(user_id,data) values(who,p_data) on conflict do nothing returning * into result;
 else
  update public.samkok3d_saves set data=p_data,revision=revision+1,updated_at=now() where user_id=who and revision=p_revision returning * into result;
 end if;
 if result.user_id is null then
  select revision into current_revision from public.samkok3d_saves where user_id=who;
  return jsonb_build_object('conflict',true,'revision',coalesce(current_revision,0));
 end if;
 return jsonb_build_object('revision',result.revision,'updated_at',result.updated_at);
end $$;
