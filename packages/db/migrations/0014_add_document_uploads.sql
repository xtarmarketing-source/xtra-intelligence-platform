-- Real file upload for company Documents (previously link-paste only).
-- Files live in a private Storage bucket, path-scoped by org so RLS can check it directly.
alter table documents
  add column if not exists storage_path text;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "org members can read documents"
on storage.objects for select
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1]::uuid = private.current_org_id()
);

create policy "org members can upload documents"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1]::uuid = private.current_org_id()
);
