-- =============================================================================
-- ANULIKA PHOTOGRAPHY — SAMPLE DATA (optional)
-- Run in Supabase SQL Editor AFTER schema.sql. Safe to skip entirely.
--
-- Populates the 8 example categories from the spec + one published portfolio
-- per category (cover + 4 gallery images each) so the site has something to
-- show immediately. Images are placeholder photos from picsum.photos — swap
-- them for real photos any time via /admin/portfolio.html (upload replaces
-- the URL automatically).
--
-- To remove all of this later, easiest is the admin panel itself
-- (Kategori / Portfolio pages already have delete buttons) — or run the
-- delete statements at the bottom of this file.
--
-- Note: categories and portfolios use ON CONFLICT so re-running this file is
-- safe; the gallery image inserts are not deduplicated, so running it twice
-- will duplicate gallery photos (just delete the portfolio via the admin
-- panel and re-run if that happens).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Categories (the 8 examples from the spec)
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, is_active, sort_order) values
  ('Wedding',     'wedding',     'Merayakan pernikahan tradisional yang berpadu dengan sentuhan modern, dari prosesi adat hingga resepsi malam hari.', true, 0),
  ('Graduation',  'graduation',  'Momen kelulusan yang layak dikenang, dari toga pertama hingga pelukan keluarga.', true, 1),
  ('Pre-Wedding', 'pre-wedding', 'Sesi foto sebelum hari pernikahan, menangkap kedekatan dan kisah cinta setiap pasangan.', true, 2),
  ('Portrait',    'portrait',    'Potret personal yang menonjolkan karakter dan kepribadian setiap individu.', true, 3),
  ('Event',       'event',       'Dokumentasi acara dan perayaan, dari gala dinner hingga peluncuran produk.', true, 4),
  ('Family',      'family',      'Potret keluarga hangat yang mengabadikan kebersamaan lintas generasi.', true, 5),
  ('Corporate',   'corporate',   'Foto profesional untuk kebutuhan korporat, dari headshot hingga dokumentasi kantor.', true, 6),
  ('Other',       'other',       'Proyek fotografi di luar kategori umum, dari produk hingga eksperimen visual.', true, 7)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Portfolios (one per category, fixed ids so gallery images below can reference them)
-- ---------------------------------------------------------------------------
insert into public.portfolios (id, category_id, title, slug, cover_image, description, shoot_date, is_published) values
  ('a0000001-0000-4000-8000-000000000001', (select id from public.categories where slug = 'wedding'),
   'Pernikahan Amara & Bagas', 'pernikahan-amara-bagas',
   'https://picsum.photos/seed/anulika-wedding-cover/1000/1250',
   'Prosesi adat Jawa yang khidmat bertemu resepsi modern di Jakarta. Anulika mengabadikan setiap detail, dari akad hingga tarian pertama.',
   '2026-06-14', true),

  ('a0000001-0000-4000-8000-000000000002', (select id from public.categories where slug = 'graduation'),
   'Wisuda Angkatan 2026', 'wisuda-angkatan-2026',
   'https://picsum.photos/seed/anulika-graduation-cover/1000/1250',
   'Sesi foto wisuda bersama keluarga dan sahabat di kampus Universitas Indonesia, merayakan pencapaian setelah bertahun-tahun berjuang.',
   '2026-07-20', true),

  ('a0000001-0000-4000-8000-000000000003', (select id from public.categories where slug = 'pre-wedding'),
   'Pre-Wedding Dinda & Reza', 'pre-wedding-dinda-reza',
   'https://picsum.photos/seed/anulika-prewedding-cover/1000/1250',
   'Golden hour di kaki Gunung Bromo menjadi latar kisah cinta Dinda dan Reza menjelang hari pernikahan mereka.',
   '2026-05-02', true),

  ('a0000001-0000-4000-8000-000000000004', (select id from public.categories where slug = 'portrait'),
   'Sesi Potret Personal', 'sesi-potret-personal',
   'https://picsum.photos/seed/anulika-portrait-cover/1000/1250',
   'Seri potret studio dengan pencahayaan minimalis, berfokus pada ekspresi dan karakter natural setiap subjek.',
   '2026-08-10', true),

  ('a0000001-0000-4000-8000-000000000005', (select id from public.categories where slug = 'event'),
   'Anniversary Gala Dinner', 'anniversary-gala-dinner',
   'https://picsum.photos/seed/anulika-event-cover/1000/1250',
   'Malam perayaan ulang tahun perusahaan di Hotel Mulia, lengkap dengan momen kandid tamu undangan dan panggung utama.',
   '2026-03-28', true),

  ('a0000001-0000-4000-8000-000000000006', (select id from public.categories where slug = 'family'),
   'Family Portrait — Keluarga Wijaya', 'family-portrait-keluarga-wijaya',
   'https://picsum.photos/seed/anulika-family-cover/1000/1250',
   'Sesi potret tiga generasi keluarga Wijaya di kediaman mereka, menangkap kehangatan dan tawa yang jujur.',
   '2026-04-15', true),

  ('a0000001-0000-4000-8000-000000000007', (select id from public.categories where slug = 'corporate'),
   'Corporate Headshot — Nusantara Digital', 'corporate-headshot-nusantara-digital',
   'https://picsum.photos/seed/anulika-corporate-cover/1000/1250',
   'Sesi headshot profesional untuk seluruh tim PT Nusantara Digital, konsisten dan siap pakai untuk kebutuhan korporat.',
   '2026-02-11', true),

  ('a0000001-0000-4000-8000-000000000008', (select id from public.categories where slug = 'other'),
   'Product Photography — Kopi Kenangan', 'product-photography-kopi-kenangan',
   'https://picsum.photos/seed/anulika-other-cover/1000/1250',
   'Sesi foto produk untuk rebranding kemasan baru, menonjolkan tekstur dan warna dengan pencahayaan studio.',
   '2026-08-25', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Gallery images (4 per portfolio)
-- ---------------------------------------------------------------------------
insert into public.portfolio_images (portfolio_id, image_url, sort_order) values
  ('a0000001-0000-4000-8000-000000000001', 'https://picsum.photos/seed/anulika-wedding-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000001', 'https://picsum.photos/seed/anulika-wedding-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000001', 'https://picsum.photos/seed/anulika-wedding-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000001', 'https://picsum.photos/seed/anulika-wedding-4/1000/1000', 3),

  ('a0000001-0000-4000-8000-000000000002', 'https://picsum.photos/seed/anulika-graduation-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000002', 'https://picsum.photos/seed/anulika-graduation-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000002', 'https://picsum.photos/seed/anulika-graduation-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000002', 'https://picsum.photos/seed/anulika-graduation-4/1000/1000', 3),

  ('a0000001-0000-4000-8000-000000000003', 'https://picsum.photos/seed/anulika-prewedding-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000003', 'https://picsum.photos/seed/anulika-prewedding-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000003', 'https://picsum.photos/seed/anulika-prewedding-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000003', 'https://picsum.photos/seed/anulika-prewedding-4/1000/1000', 3),

  ('a0000001-0000-4000-8000-000000000004', 'https://picsum.photos/seed/anulika-portrait-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000004', 'https://picsum.photos/seed/anulika-portrait-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000004', 'https://picsum.photos/seed/anulika-portrait-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000004', 'https://picsum.photos/seed/anulika-portrait-4/1000/1000', 3),

  ('a0000001-0000-4000-8000-000000000005', 'https://picsum.photos/seed/anulika-event-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000005', 'https://picsum.photos/seed/anulika-event-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000005', 'https://picsum.photos/seed/anulika-event-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000005', 'https://picsum.photos/seed/anulika-event-4/1000/1000', 3),

  ('a0000001-0000-4000-8000-000000000006', 'https://picsum.photos/seed/anulika-family-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000006', 'https://picsum.photos/seed/anulika-family-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000006', 'https://picsum.photos/seed/anulika-family-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000006', 'https://picsum.photos/seed/anulika-family-4/1000/1000', 3),

  ('a0000001-0000-4000-8000-000000000007', 'https://picsum.photos/seed/anulika-corporate-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000007', 'https://picsum.photos/seed/anulika-corporate-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000007', 'https://picsum.photos/seed/anulika-corporate-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000007', 'https://picsum.photos/seed/anulika-corporate-4/1000/1000', 3),

  ('a0000001-0000-4000-8000-000000000008', 'https://picsum.photos/seed/anulika-other-1/1000/1000', 0),
  ('a0000001-0000-4000-8000-000000000008', 'https://picsum.photos/seed/anulika-other-2/1000/1000', 1),
  ('a0000001-0000-4000-8000-000000000008', 'https://picsum.photos/seed/anulika-other-3/1000/1000', 2),
  ('a0000001-0000-4000-8000-000000000008', 'https://picsum.photos/seed/anulika-other-4/1000/1000', 3);

-- ---------------------------------------------------------------------------
-- To remove all sample data later, run:
-- ---------------------------------------------------------------------------
-- delete from public.portfolios where id::text like 'a0000001-0000-4000-8000-%'; -- cascades to portfolio_images
-- delete from public.categories where slug in
--   ('wedding','graduation','pre-wedding','portrait','event','family','corporate','other');
