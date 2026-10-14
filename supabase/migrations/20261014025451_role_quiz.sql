-- Preserve old answers, results, attempt counters and cached clients.
alter table public.quiz_results drop constraint quiz_results_answers_check;
alter table public.quiz_results add constraint quiz_results_answers_check check(coalesce((result->>'version'='1' and jsonb_array_length(answers)=30) or (result->>'version' in ('2','3') and jsonb_array_length(answers)=12),false));
alter table public.quiz_sessions drop constraint quiz_sessions_quiz_version_check;
alter table public.quiz_sessions add constraint quiz_sessions_quiz_version_check check(quiz_version in (1,2,3));
alter table public.quiz_sessions drop constraint quiz_sessions_version_progress_check;
alter table public.quiz_sessions add constraint quiz_sessions_version_progress_check check(answered_count<=case when quiz_version=1 then 30 else 12 end);

create or replace function public.quiz_submit(p_token_hash text,p_request_id uuid,p_answers jsonb,p_result jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare person uuid; used integer; saved uuid; bank_version integer; question_count integer;
begin
 select participant_id into person from public.quiz_sessions where token_hash=p_token_hash and expires_at>now();
 if person is null then raise exception 'SESSION_EXPIRED'; end if;
 perform id from public.quiz_participants where id=person for update;
 select count(*) into used from public.quiz_results where participant_id=person;
 select id into saved from public.quiz_results where participant_id=person and request_id=p_request_id;
 if saved is not null then return jsonb_build_object('id',saved,'used',used,'remaining',greatest(0,3-used)); end if;
 if used>=3 then raise exception 'LIMIT_REACHED'; end if;
 bank_version=(p_result->>'version')::integer;
 if bank_version is null or bank_version not in (1,2,3) then raise exception 'INVALID_QUIZ_VERSION'; end if;
 question_count=case when bank_version=1 then 30 else 12 end;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>question_count then raise exception 'INVALID_ANSWERS'; end if;
 insert into public.quiz_results(participant_id,request_id,answers,result,source)
 values(person,p_request_id,p_answers,p_result,case when bank_version=3 then 'v1.4' when bank_version=2 then 'v1.3' else 'v1.2' end) returning id into saved;
 update public.quiz_sessions set answered_count=question_count,quiz_version=bank_version,last_seen=now() where token_hash=p_token_hash;
 return jsonb_build_object('id',saved,'used',used+1,'remaining',2-used);
end $$;
revoke all on function public.quiz_submit(text,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.quiz_submit(text,uuid,jsonb,jsonb) to service_role;
