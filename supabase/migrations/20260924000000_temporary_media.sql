-- Private metadata for media artifacts. The actual video/audio bytes live in Storage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'allrounder-temp',
  'allrounder-temp',
  false,
  52428800,
  array['video/mp4', 'video/webm', 'audio/mp4', 'audio/mpeg', 'audio/webm']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.temporary_media (
  job_id text primary key,
  object_path text not null unique,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 52428800),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

alter table public.temporary_media enable row level security;
revoke all on public.temporary_media from anon, authenticated;
grant select, insert, delete on public.temporary_media to service_role;

create index if not exists temporary_media_expires_at_idx
  on public.temporary_media (expires_at);
