-- Migration 013: media
-- Central media library for images and videos.
-- storage_path: the path within the Supabase Storage bucket (e.g. 'images/abc.jpg')
-- public_url: the resolved CDN URL for direct use in <img> and <video> tags
-- entity_type / entity_id: optional link to the content item this media belongs to

create table public.media (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  storage_path    text not null,
  public_url      text not null,
  media_type      text not null check (media_type in ('image', 'video')),
  alt_text        text,
  entity_type     text,   -- e.g. 'post', 'tournament', 'team' (optional tagging)
  entity_id       uuid,   -- FK-less reference to the related entity
  created_at      timestamptz not null default now()
);

comment on table  public.media              is 'Central media library. Tracks all uploaded images and videos.';
comment on column public.media.storage_path is 'Path inside the Supabase Storage bucket (not a full URL).';
comment on column public.media.public_url   is 'Full CDN URL for use in img/video tags.';
comment on column public.media.entity_type  is 'Optional: the type of entity this media is attached to.';
comment on column public.media.entity_id    is 'Optional: the id of the entity this media is attached to.';
