-- Ensure team logo uploads have the expected Supabase Storage bucket.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'team-logos',
  'team-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read team-logos" on storage.objects;
create policy "Public read team-logos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'team-logos');
