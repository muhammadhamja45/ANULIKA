// Reusable portfolio data + rendering, used by index.html, portfolio.html and
// portfolio-detail.html. Also self-initializes the full portfolio.html grid
// (guarded by checking for #portfolio-grid, so importing this elsewhere is a no-op).
import { supabase } from './supabase.js';
import { escapeHtml } from './utils.js';

const NO_IMAGE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" class="h-8 w-8 text-neutral-300 dark:text-neutral-700"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 4.5h18M3.75 4.5v15a.75.75 0 0 0 .75.75h15a.75.75 0 0 0 .75-.75v-15M9 9.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>`;

export async function fetchActiveCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchPublishedPortfolios({ categorySlug, limit } = {}) {
  let query = supabase
    .from('portfolios')
    .select('id, title, slug, cover_image, shoot_date, description, category:categories!inner(id, name, slug, is_active)')
    .eq('is_published', true)
    .eq('category.is_active', true)
    .order('created_at', { ascending: false });

  if (categorySlug) query = query.eq('category.slug', categorySlug);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchPortfolioBySlug(slug) {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*, category:categories(id, name, slug, is_active), images:portfolio_images(id, image_url, sort_order)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error) return null;
  if (data.category && data.category.is_active === false) return null; // deactivated categories stay hidden publicly
  data.images?.sort((a, b) => a.sort_order - b.sort_order);
  return data;
}

function coverImageHtml(url, alt) {
  if (url) {
    return `<img src="${url}" alt="${escapeHtml(alt)}" loading="lazy" class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105">`;
  }
  return `<div class="flex h-full w-full items-center justify-center bg-neutral-100 dark:bg-neutral-900">${NO_IMAGE_ICON}</div>`;
}

export function renderPortfolioCard(item, index = 0) {
  const categoryName = item.category?.name ?? 'Tanpa Kategori';
  return `
    <a href="portfolio-detail.html?slug=${encodeURIComponent(item.slug)}" class="group block" data-aos="fade-up" data-aos-delay="${(index % 3) * 80}">
      <div class="aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        ${coverImageHtml(item.cover_image, item.title)}
      </div>
      <div class="mt-4 flex items-baseline justify-between gap-3">
        <h3 class="font-display text-xl text-neutral-900 dark:text-white">${escapeHtml(item.title)}</h3>
        <span class="shrink-0 text-xs uppercase tracking-widest text-neutral-400">${escapeHtml(categoryName)}</span>
      </div>
    </a>`;
}

export function skeletonGrid(count = 6) {
  return Array.from({ length: count })
    .map(() => `<div class="animate-pulse"><div class="aspect-[4/5] bg-neutral-100 dark:bg-neutral-900"></div><div class="mt-4 h-4 w-2/3 bg-neutral-100 dark:bg-neutral-900"></div></div>`)
    .join('');
}

export function emptyState(message) {
  return `<div class="col-span-full py-24 text-center text-neutral-400">
    <p class="text-sm uppercase tracking-widest">${message}</p>
  </div>`;
}

export function errorState(message) {
  return `<div class="col-span-full py-24 text-center text-red-500">
    <p class="text-sm">${message}</p>
  </div>`;
}

// ---------------------------------------------------------------------------
// portfolio.html specific wiring (category filter pills + grid)
// ---------------------------------------------------------------------------
async function initPortfolioPage() {
  const grid = document.getElementById('portfolio-grid');
  const filterBar = document.getElementById('category-filters');
  if (!grid) return;

  grid.innerHTML = skeletonGrid(6);

  let categories = [];
  try {
    categories = await fetchActiveCategories();
  } catch {
    // filters are non-critical; grid load below reports the real error
  }

  const params = new URLSearchParams(window.location.search);
  let activeSlug = params.get('category') || '';

  function renderFilters() {
    if (!filterBar) return;
    const pill = (label, slug) => `
      <button data-slug="${escapeHtml(slug)}" class="filter-pill border px-4 py-1.5 text-xs uppercase tracking-widest transition-colors ${activeSlug === slug ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900' : 'border-neutral-300 text-neutral-500 hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-white dark:hover:text-white'}">${escapeHtml(label)}</button>`;
    filterBar.innerHTML = pill('Semua', '') + categories.map((c) => pill(c.name, c.slug)).join('');
    filterBar.querySelectorAll('.filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeSlug = btn.dataset.slug;
        const url = new URL(window.location.href);
        if (activeSlug) url.searchParams.set('category', activeSlug);
        else url.searchParams.delete('category');
        window.history.replaceState({}, '', url);
        renderFilters();
        loadGrid();
      });
    });
  }

  async function loadGrid() {
    grid.innerHTML = skeletonGrid(6);
    try {
      const items = await fetchPublishedPortfolios({ categorySlug: activeSlug || undefined });
      grid.innerHTML = items.length ? items.map((item, i) => renderPortfolioCard(item, i)).join('') : emptyState('Belum ada portfolio pada kategori ini.');
      if (window.AOS) AOS.refreshHard();
    } catch (err) {
      grid.innerHTML = errorState('Gagal memuat portfolio. Silakan muat ulang halaman.');
      console.error(err);
    }
  }

  renderFilters();
  await loadGrid();
}

initPortfolioPage();
