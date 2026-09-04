import { initAdminShell, openModal, closeModal, toast, confirmAction } from './shared.js';
import { supabase } from '../supabase.js';
import { escapeHtml } from '../utils.js';

const STATUS_OPTIONS = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  completed: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  cancelled: 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500',
};

let currentRole = 'editor';
let bookingsCache = [];

function statusBadge(status) {
  return `<span class="rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_COLORS[status] ?? ''}">${status}</span>`;
}

function detailRow(label, value) {
  return `<div class="flex justify-between gap-4 border-b border-neutral-100 pb-2 dark:border-neutral-800"><dt class="text-neutral-400">${label}</dt><dd class="text-right text-neutral-900 dark:text-white">${value}</dd></div>`;
}

function row(b) {
  return `
    <tr>
      <td class="px-5 py-3.5">
        <p class="font-medium text-neutral-900 dark:text-white">${escapeHtml(b.name)}</p>
        <p class="text-xs text-neutral-400">${escapeHtml(b.email ?? '')}</p>
      </td>
      <td class="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">${escapeHtml(b.whatsapp)}</td>
      <td class="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">${escapeHtml(b.category?.name ?? 'Tanpa Kategori')}</td>
      <td class="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">${b.booking_date}</td>
      <td class="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">${b.booking_time}</td>
      <td class="px-5 py-3.5">${statusBadge(b.status)}</td>
      <td class="px-5 py-3.5 text-right">
        <button data-id="${b.id}" class="detail-btn text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Detail</button>
      </td>
    </tr>`;
}

async function loadBookings() {
  const tbody = document.getElementById('bookings-table-body');
  tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-sm text-neutral-400">Memuat...</td></tr>`;

  let query = supabase.from('bookings').select('*, category:categories(name)').order('booking_date', { ascending: false });
  const status = document.getElementById('filter-status').value;
  const date = document.getElementById('filter-date').value;
  if (status) query = query.eq('status', status);
  if (date) query = query.eq('booking_date', date);

  const { data, error } = await query;
  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-sm text-red-500">Gagal memuat booking.</td></tr>`;
    return;
  }
  bookingsCache = data;
  tbody.innerHTML = data.length ? data.map(row).join('') : `<tr><td colspan="7" class="px-5 py-10 text-center text-sm text-neutral-400">Tidak ada booking yang cocok dengan filter.</td></tr>`;
  tbody.querySelectorAll('.detail-btn').forEach((btn) => btn.addEventListener('click', () => openDetail(btn.dataset.id)));
}

function openDetail(id) {
  const b = bookingsCache.find((x) => x.id === id);
  if (!b) return;
  const canManage = currentRole === 'admin';

  openModal(`
    <div class="p-6">
      <div class="flex items-start justify-between gap-4">
        <h2 class="font-display text-xl text-neutral-900 dark:text-white">Detail Booking</h2>
        ${statusBadge(b.status)}
      </div>
      <dl class="mt-5 space-y-3 text-sm">
        ${detailRow('Nama', escapeHtml(b.name))}
        ${detailRow('WhatsApp', `<a href="https://wa.me/${b.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener" class="underline">${escapeHtml(b.whatsapp)}</a>`)}
        ${detailRow('Email', escapeHtml(b.email || '-'))}
        ${detailRow('Layanan', escapeHtml(b.category?.name ?? 'Tanpa Kategori'))}
        ${detailRow('Tanggal', b.booking_date)}
        ${detailRow('Jam', b.booking_time)}
        ${detailRow('Lokasi', escapeHtml(b.location || '-'))}
        ${detailRow('Catatan', escapeHtml(b.notes || '-'))}
      </dl>
      ${canManage ? `
        <div class="mt-5">
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Ubah Status</label>
          <select id="status-select" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
            ${STATUS_OPTIONS.map((s) => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="mt-6 flex items-center justify-between gap-3">
          <button type="button" id="delete-booking-btn" class="text-xs uppercase tracking-widest text-red-500 hover:text-red-700">Hapus Booking</button>
          <div class="flex gap-3">
            <button type="button" id="detail-close" class="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Tutup</button>
            <button type="button" id="save-status-btn" class="bg-neutral-900 px-5 py-2.5 text-sm text-white dark:bg-white dark:text-neutral-900">Simpan Status</button>
          </div>
        </div>` : `
        <div class="mt-6 flex justify-end">
          <button type="button" id="detail-close" class="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Tutup</button>
        </div>`}
    </div>`);

  document.getElementById('detail-close').addEventListener('click', closeModal);
  if (canManage) {
    document.getElementById('save-status-btn').addEventListener('click', () => updateStatus(b.id, document.getElementById('status-select').value));
    document.getElementById('delete-booking-btn').addEventListener('click', () => deleteBooking(b.id));
  }
}

async function updateStatus(id, status) {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
  if (error) { toast('Gagal mengubah status.', 'error'); return; }
  toast('Status booking diperbarui.');
  closeModal();
  loadBookings();
}

async function deleteBooking(id) {
  if (!confirmAction('Hapus booking ini? Tindakan ini tidak dapat dibatalkan.')) return;
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) { toast('Gagal menghapus booking.', 'error'); return; }
  toast('Booking dihapus.');
  closeModal();
  loadBookings();
}

// ---------------------------------------------------------------------------
// Blocked dates (admin only)
// ---------------------------------------------------------------------------
function blockedRow(b) {
  return `
    <div class="flex items-center justify-between px-5 py-3 text-sm">
      <div>
        <p class="font-medium text-neutral-900 dark:text-white">${b.blocked_date}</p>
        <p class="text-xs text-neutral-400">${escapeHtml(b.reason) || (b.is_fully_booked ? 'Fully booked' : 'Diblokir')}</p>
      </div>
      <button data-id="${b.id}" class="remove-blocked-btn text-xs uppercase tracking-widest text-red-500 hover:text-red-700">Hapus</button>
    </div>`;
}

async function loadBlockedDates() {
  const el = document.getElementById('blocked-dates-list');
  const { data, error } = await supabase.from('blocked_dates').select('*').order('blocked_date', { ascending: true });
  if (error) { el.innerHTML = `<p class="px-5 py-6 text-sm text-red-500">Gagal memuat tanggal diblokir.</p>`; return; }
  el.innerHTML = data.length ? data.map(blockedRow).join('') : `<p class="px-5 py-6 text-sm text-neutral-400">Belum ada tanggal yang diblokir.</p>`;
  el.querySelectorAll('.remove-blocked-btn').forEach((btn) => btn.addEventListener('click', () => removeBlockedDate(btn.dataset.id)));
}

async function removeBlockedDate(id) {
  if (!confirmAction('Buka kembali tanggal ini agar bisa dibooking?')) return;
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
  if (error) { toast('Gagal menghapus.', 'error'); return; }
  toast('Tanggal dibuka kembali.');
  loadBlockedDates();
}

function openBlockedForm() {
  openModal(`
    <form id="blocked-form" class="p-6">
      <h2 class="font-display text-xl text-neutral-900 dark:text-white">Blokir Tanggal</h2>
      <div class="mt-5 space-y-4">
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Tanggal *</label>
          <input type="date" id="blocked-date" required class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Alasan</label>
          <input type="text" id="blocked-reason" placeholder="Contoh: Cuti, sudah fully booked" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="blocked-fully" class="h-4 w-4">
          Tandai sebagai fully booked
        </label>
        <p id="blocked-form-error" class="hidden border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"></p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" id="blocked-form-cancel" class="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Batal</button>
        <button type="submit" class="bg-neutral-900 px-5 py-2.5 text-sm text-white dark:bg-white dark:text-neutral-900">Simpan</button>
      </div>
    </form>`);

  document.getElementById('blocked-form-cancel').addEventListener('click', closeModal);
  document.getElementById('blocked-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('blocked_dates').insert({
      blocked_date: document.getElementById('blocked-date').value,
      reason: document.getElementById('blocked-reason').value.trim() || null,
      is_fully_booked: document.getElementById('blocked-fully').checked,
    });
    if (error) {
      const errEl = document.getElementById('blocked-form-error');
      errEl.textContent = error.code === '23505' ? 'Tanggal ini sudah diblokir sebelumnya.' : 'Gagal menyimpan.';
      errEl.classList.remove('hidden');
      return;
    }
    toast('Tanggal berhasil diblokir.');
    closeModal();
    loadBlockedDates();
  });
}

async function init() {
  const shell = await initAdminShell({ activePage: 'bookings.html' });
  if (!shell) return;
  currentRole = shell.profile.role;

  const params = new URLSearchParams(location.search);
  if (params.get('status')) document.getElementById('filter-status').value = params.get('status');

  document.getElementById('filter-status').addEventListener('change', loadBookings);
  document.getElementById('filter-date').addEventListener('change', loadBookings);
  document.getElementById('filter-reset').addEventListener('click', () => {
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-date').value = '';
    loadBookings();
  });

  if (currentRole === 'admin') {
    document.getElementById('add-blocked-date-btn').addEventListener('click', openBlockedForm);
    loadBlockedDates();
  } else {
    document.getElementById('blocked-dates-section').classList.add('hidden');
  }

  loadBookings();
}

init();
