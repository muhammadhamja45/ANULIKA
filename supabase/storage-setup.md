# Supabase Storage Setup — `portfolio-images`

Run `schema.sql` first (it defines `public.is_staff()`, used by the policies below).

## 1. Create the bucket

Dashboard → **Storage** → **New bucket**

- Name: `portfolio-images`
- Public bucket: **ON** (cover/gallery images are shown on the public site)

Or via SQL:

```sql
insert into storage.buckets (id, name, public)
values ('portfolio-images', 'portfolio-images', true)
on conflict (id) do nothing;
```

## 2. RLS policies for the bucket

Storage objects live in `storage.objects`, scoped by `bucket_id`. Run in the SQL Editor:

```sql
create policy "portfolio_images_public_read"
on storage.objects for select
using (bucket_id = 'portfolio-images');

create policy "portfolio_images_staff_insert"
on storage.objects for insert
with check (bucket_id = 'portfolio-images' and public.is_staff());

create policy "portfolio_images_staff_update"
on storage.objects for update
using (bucket_id = 'portfolio-images' and public.is_staff());

create policy "portfolio_images_staff_delete"
on storage.objects for delete
using (bucket_id = 'portfolio-images' and public.is_staff());
```

Anyone can read (public portfolio images); only logged-in admin/editor accounts can upload/replace/delete.

## 3. How the app uses it

All of this is already implemented in [js/admin/portfolio.js](../js/admin/portfolio.js).

**Upload:**
```js
const path = `covers/${crypto.randomUUID()}.${ext}`;
await supabase.storage.from('portfolio-images').upload(path, file);
const { data } = supabase.storage.from('portfolio-images').getPublicUrl(path);
// data.publicUrl is what gets saved in portfolios.cover_image / portfolio_images.image_url
```

**Delete:**
```js
await supabase.storage.from('portfolio-images').remove([path]);
```

**Public URL shape:**
```
https://<project-ref>.supabase.co/storage/v1/object/public/portfolio-images/<path>
```

Cover images are stored under `covers/…`, gallery images under `gallery/<portfolio_id>/…` — this is just a folder convention for readability in the Storage browser, not a security boundary (the RLS policies above apply to the whole bucket).

## 4. Deleting a portfolio

Deleting a `portfolios` row cascades to `portfolio_images` rows (FK `on delete cascade`), but it does **not** delete the actual files in Storage — the admin UI removes the storage objects itself before/after deleting the DB rows (see `deletePortfolio()` in `js/admin/portfolio.js`).
