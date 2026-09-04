import { initAdminShell, toast } from './shared.js';
import { supabase } from '../supabase.js';
import { escapeHtml } from '../utils.js';

function updateBookingLabel() {
  document.getElementById('booking-open-label').textContent =
    document.getElementById('booking-open-toggle').checked ? 'Booking Terbuka' : 'Booking Ditutup';
}

async function initBookingToggle() {
  const { data } = await supabase.from('app_settings').select('booking_open').eq('id', 1).single();
  document.getElementById('booking-open-toggle').checked = data ? data.booking_open : true;
  updateBookingLabel();

  document.getElementById('booking-open-toggle').addEventListener('change', async (e) => {
    updateBookingLabel();
    const { error } = await supabase.from('app_settings').update({ booking_open: e.target.checked }).eq('id', 1);
    if (error) { toast('Gagal menyimpan pengaturan.', 'error'); return; }
    toast('Pengaturan booking diperbarui.');
  });
}

async function init() {
  const shell = await initAdminShell({ activePage: 'settings.html' });
  if (!shell) return;
  const { profile } = shell;

  document.getElementById('account-info').innerHTML = `
    <div class="flex justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800"><dt class="text-neutral-400">Nama</dt><dd class="text-neutral-900 dark:text-white">${escapeHtml(profile.full_name)}</dd></div>
    <div class="flex justify-between border-b border-neutral-100 pb-2 dark:border-neutral-800"><dt class="text-neutral-400">Email</dt><dd class="text-neutral-900 dark:text-white">${escapeHtml(profile.email)}</dd></div>
    <div class="flex justify-between pb-2"><dt class="text-neutral-400">Role</dt><dd class="capitalize text-neutral-900 dark:text-white">${escapeHtml(profile.role)}</dd></div>`;

  if (profile.role === 'admin') {
    initBookingToggle();
  } else {
    document.getElementById('booking-availability-card').classList.add('hidden');
  }

  document.getElementById('password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('password-form-error');
    errEl.classList.add('hidden');
    const { error } = await supabase.auth.updateUser({ password: document.getElementById('new-password').value });
    if (error) {
      errEl.textContent = 'Gagal mengubah password.';
      errEl.classList.remove('hidden');
      return;
    }
    toast('Password berhasil diubah.');
    e.target.reset();
  });
}

init();
