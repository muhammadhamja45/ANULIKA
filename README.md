# Anulika — Photography Studio Website

Static HTML/CSS/JS (Tailwind CDN + vanilla ES modules) with Supabase as the backend. No build step, no frontend framework.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema.** SQL Editor → paste and run [supabase/schema.sql](supabase/schema.sql). This creates all tables, indexes, triggers, RLS policies, and a `booking_open` app setting.
3. **Set up Storage.** Follow [supabase/storage-setup.md](supabase/storage-setup.md) to create the `portfolio-images` bucket and its policies.
3b. **(Optional) Seed sample data.** SQL Editor → paste and run [supabase/seed.sql](supabase/seed.sql) to populate the 8 example categories, one demo portfolio each, and 3 sample photography packages (placeholder photos from picsum.photos, easy to delete or replace via the admin panel).
3c. **Already ran schema.sql before this version?** SQL Editor → paste and run [supabase/migration_002_time_range_and_packages.sql](supabase/migration_002_time_range_and_packages.sql) — adds the `end_time` column to `bookings` and the `packages` table. Skip this on a brand-new project; `schema.sql` already includes both.
4. **Deploy the admin-users Edge Function** (needed only for the "create user" / "delete user" actions in `/admin/users.html` — everything else works without it):
   ```
   supabase functions deploy admin-users
   ```
   Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project. No secrets to configure — Supabase injects the service role key automatically.
5. **Fill in your credentials** in [js/config.js](js/config.js):
   ```js
   export const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   export const SUPABASE_ANON_KEY = "eyJ...";       // anon/public key only, never service_role
   export const WHATSAPP_NUMBER = "628889275189";    // your studio's WhatsApp, digits only
   ```
6. **Create your first admin:**
   - Supabase Dashboard → Authentication → Users → Add user (email + password).
   - This auto-creates a `profiles` row via trigger, defaulted to role `editor`.
   - SQL Editor: `update public.profiles set role = 'admin' where email = 'you@example.com';`
7. **Serve the site with a local static server** — not by double-clicking `index.html`. The site uses ES modules (`<script type="module">`), which browsers block over `file://`. Any of these work:
   ```
   npx serve .
   python -m http.server 8000
   ```
   (or the VS Code "Live Server" extension)
8. Visit `/admin/login.html` and sign in with the admin account from step 6.

## Deploying

Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages, etc.) — just upload the files as-is. Use HTTPS in production: the admin image upload uses `crypto.randomUUID()`, which browsers only expose in secure contexts (HTTPS or localhost).

## Notes

- **Roles:** `admin` has full access. `editor` can manage portfolio/categories and view (not edit) bookings — enforced both in the UI and via Postgres RLS (see `is_admin()` / `is_staff()` in schema.sql), so it holds even if someone bypasses the UI.
- **WhatsApp:** there's no WhatsApp API integration by design — the "Confirmation" button just opens `wa.me` with a pre-filled message built from the booking data.
- **Sample data:** not seeded by default — `supabase/seed.sql` is opt-in (step 3b). Without it, add categories first (`/admin/categories.html`) so portfolios and the booking form have something to select.
