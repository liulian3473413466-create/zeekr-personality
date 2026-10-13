-- All personal data is accessible only through the authenticated Edge API.
create table public.quiz_participants (
 id uuid primary key default gen_random_uuid(), name_key text not null unique,
 name text not null check(length(name) between 2 and 40), created_at timestamptz not null default now(),
 team smallint check(team between 1 and 4), note text not null default '' check(length(note)<=1000), selected_result_id uuid
);
create table public.quiz_sessions (
 token_hash text primary key, participant_id uuid not null references public.quiz_participants(id),
 expires_at timestamptz not null, answered_count smallint not null default 0 check(answered_count between 0 and 30),
 last_seen timestamptz not null default now()
);
create index quiz_sessions_participant_idx on public.quiz_sessions(participant_id);
create table public.quiz_results (
 id uuid primary key default gen_random_uuid(), participant_id uuid not null references public.quiz_participants(id),
 request_id uuid not null, answers jsonb not null, result jsonb not null,
 source text not null default 'v1.2', created_at timestamptz not null default now(),
 unique(participant_id,request_id), check(jsonb_array_length(answers)=30)
);
create index quiz_results_created_idx on public.quiz_results(created_at desc);
create table public.quiz_admins(user_id uuid primary key references auth.users(id), active boolean not null default true);
create table public.quiz_setup(token_hash text primary key, email text not null, expires_at timestamptz not null);
create table public.quiz_team_state(id boolean primary key default true check(id), version integer not null default 0);
insert into public.quiz_team_state(id) values(true);
alter table public.quiz_participants enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.quiz_results enable row level security;
alter table public.quiz_admins enable row level security;
alter table public.quiz_setup enable row level security;
alter table public.quiz_team_state enable row level security;
revoke all on public.quiz_participants,public.quiz_sessions,public.quiz_results,public.quiz_admins,public.quiz_setup,public.quiz_team_state from anon,authenticated;
grant all on public.quiz_participants,public.quiz_sessions,public.quiz_results,public.quiz_admins,public.quiz_setup,public.quiz_team_state to service_role;

create function public.quiz_start(p_name_key text,p_name text,p_token_hash text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare person uuid; used integer;
begin
 insert into public.quiz_participants(name_key,name) values(p_name_key,p_name)
 on conflict(name_key) do update set name_key=excluded.name_key returning id into person;
 insert into public.quiz_sessions(token_hash,participant_id,expires_at) values(p_token_hash,person,now()+interval '30 days');
 select count(*) into used from public.quiz_results where participant_id=person;
 return jsonb_build_object('identity',person,'used',used,'remaining',greatest(0,3-used));
end $$;

-- Serialize submissions per participant; retries return the first saved ID.
create function public.quiz_submit(p_token_hash text,p_request_id uuid,p_answers jsonb,p_result jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare person uuid; used integer; saved uuid;
begin
 select participant_id into person from public.quiz_sessions where token_hash=p_token_hash and expires_at>now();
 if person is null then raise exception 'SESSION_EXPIRED'; end if;
 perform id from public.quiz_participants where id=person for update;
 select count(*) into used from public.quiz_results where participant_id=person;
 select id into saved from public.quiz_results where participant_id=person and request_id=p_request_id;
 if saved is not null then return jsonb_build_object('id',saved,'used',used,'remaining',greatest(0,3-used)); end if;
 if used>=3 then raise exception 'LIMIT_REACHED'; end if;
 insert into public.quiz_results(participant_id,request_id,answers,result) values(person,p_request_id,p_answers,p_result) returning id into saved;
 update public.quiz_sessions set answered_count=30,last_seen=now() where token_hash=p_token_hash;
 return jsonb_build_object('id',saved,'used',used+1,'remaining',2-used);
end $$;

create function public.quiz_save_teams(p_version integer,p_assignments jsonb) returns integer
language plpgsql security invoker set search_path='' as $$
declare current_version integer; row jsonb; person uuid; team_number integer; result_id uuid;
begin
 select version into current_version from public.quiz_team_state where id=true for update;
 if current_version<>p_version then raise exception 'VERSION_CONFLICT'; end if;
 if jsonb_typeof(p_assignments)<>'array' then raise exception 'INVALID_ASSIGNMENTS'; end if;
 if exists(select 1 from jsonb_array_elements(p_assignments) x group by x->>'id' having count(*)>1) then raise exception 'DUPLICATE_PERSON'; end if;
 for row in select * from jsonb_array_elements(p_assignments) loop
  person=(row->>'id')::uuid; team_number=(row->>'team')::integer; result_id=(row->>'selectedResultId')::uuid;
  if not exists(select 1 from public.quiz_participants where id=person) then raise exception 'PERSON_NOT_FOUND'; end if;
  if result_id is not null and not exists(select 1 from public.quiz_results where id=result_id and participant_id=person) then raise exception 'INVALID_RESULT'; end if;
  update public.quiz_participants set team=team_number,note=coalesce(row->>'note',''),selected_result_id=result_id where id=person;
 end loop;
 if exists(select 1 from public.quiz_participants where team is not null group by team having count(*)>4) then raise exception 'TEAM_FULL'; end if;
 update public.quiz_team_state set version=version+1 where id=true returning version into current_version;
 return current_version;
end $$;
revoke all on function public.quiz_start(text,text,text),public.quiz_submit(text,uuid,jsonb,jsonb),public.quiz_save_teams(integer,jsonb) from public,anon,authenticated;
grant execute on function public.quiz_start(text,text,text),public.quiz_submit(text,uuid,jsonb,jsonb),public.quiz_save_teams(integer,jsonb) to service_role;
