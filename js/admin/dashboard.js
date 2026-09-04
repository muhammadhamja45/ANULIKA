import { initAdminShell } from './shared.js';
import { supabase } from '../supabase.js';
import { escapeHtml } from '../utils.js';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  completed: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  cancelled: 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500',
};

function statCard(label, value, sub) {
  return `
    <div class="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
      <p class="text-xs uppercase tracking-widest text-neutral-400">${label}</p>
      <p class="mt-2 text-3xl font-semibold text-neutral-900 dark:text-white">${value}</p>
      ${sub ? `<p class="mt-1 text-xs text-neutral-400">${sub}</p>` : ''}
    </div>`;
}

function skeletonCards(n) {
  return Array.from({ length: n }).map(() => `<div class="h-28 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-900"></div>`).join('');
}

function bookingRow(b) {
  return `
    <div class="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
      <div class="min-w-0">
        <p class="truncate font-medium text-neutral-900 dark:text-white">${escapeHtml(b.name)}</p>
        <p class="truncate text-xs text-neutral-400">${b.booking_date} · ${escapeHtml(b.category?.name ?? 'Tanpa Kategori')}</p>
      </div>
      <span class="shrink-0 rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_COLORS[b.status] ?? ''}">${b.status}</span>
    </div>`;
}

function emptyRow(msg) {
  return `<p class="px-5 py-8 text-center text-sm text-neutral-400">${msg}</p>`;
}

async function loadStats() {
  const el = document.getElementById('stat-cards');
  el.innerHTML = skeletonCards(4);
  try {
    const [totalPortfolio, publishedPortfolio, activeCategories, pendingBookings, totalBookings] = await Promise.all([
      supabase.from('portfolios').select('id', { count: 'exact', head: true }),
      supabase.from('portfolios').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
    ]);
    el.innerHTML = [
      statCard('Total Portfolio', totalPortfolio.count ?? 0, `${publishedPortfolio.count ?? 0} dipublikasikan`),
      statCard('Kategori Aktif', activeCategories.count ?? 0),
      statCard('Booking Pending', pendingBookings.count ?? 0),
      statCard('Total Booking', totalBookings.count ?? 0),
    ].join('');
  } catch (err) {
    el.innerHTML = `<p class="col-span-full text-sm text-red-500">Gagal memuat statistik.</p>`;
    console.error(err);
  }
}

async function loadRecentBookings() {
  const el = document.getElementById('recent-bookings');
  const { data, error } = await supabase.from('bookings').select('*, category:categories(name)').order('created_at', { ascending: false }).limit(5);
  el.innerHTML = error ? emptyRow('Gagal memuat data.') : (data.length ? data.map(bookingRow).join('') : emptyRow('Belum ada booking.'));
}

async function loadPendingBookings() {
  const el = document.getElementById('pending-bookings');
  const { data, error } = await supabase.from('bookings').select('*, category:categories(name)').eq('status', 'pending').order('booking_date', { ascending: true }).limit(5);
  el.innerHTML = error ? emptyRow('Gagal memuat data.') : (data.length ? data.map(bookingRow).join('') : emptyRow('Tidak ada booking pending.'));
}

async function init() {
  const shell = await initAdminShell({ activePage: 'dashboard.html' });
  if (!shell) return;
  loadStats();
  loadRecentBookings();
  loadPendingBookings();
}

init();
