// Booking form + availability calendar for booking.html.
import { supabase } from './supabase.js';
import { fetchActiveCategories } from './portfolio.js';
import { WHATSAPP_NUMBER } from './config.js';
import { escapeHtml } from './utils.js';

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Fixed session blocks per day, each with a start and end time. Edit this list
// to match how the studio actually books sessions — a date is only fully
// blocked once every block below is taken; individual taken blocks are
// disabled in the time picker so double-booking is impossible.
const TIME_SLOTS = [
  { start: '08:00', end: '10:00' },
  { start: '10:00', end: '12:00' },
  { start: '13:00', end: '15:00' },
  { start: '15:00', end: '17:00' },
  { start: '17:00', end: '19:00' },
];
const slotKey = (start, end) => `${start}|${end}`;

let viewDate = new Date();
viewDate.setDate(1);
let selectedDate = null;
let selectedStart = null;
let selectedEnd = null;
let selectedCategoryId = null;
let selectedCategoryName = null;
let blockedDateSet = new Set();
let bookedSlotsByDate = new Map(); // dateISO -> Set of "start|end" keys already booked

const toISODate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayISO = () => toISODate(new Date());
const formatDateLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

async function checkBookingOpen() {
  const { data } = await supabase.from('app_settings').select('booking_open').eq('id', 1).single();
  return data ? data.booking_open : true;
}

// Custom dropdown instead of a native <select> — the native option popup on
// Windows Chrome is rendered by the OS and largely ignores page CSS/dark mode
// (color-scheme fixes the closed control but not the open popup), so this is
// built from plain styleable elements instead, same as the calendar/time slots.
async function loadCategories() {
  const label = document.getElementById('category-select-label');
  const list = document.getElementById('category-select-list');
  try {
    const categories = await fetchActiveCategories();
    if (!categories.length) {
      label.textContent = 'Belum ada layanan tersedia';
      return;
    }
    label.textContent = 'Pilih layanan…';
    list.innerHTML = categories.map((c) => `
      <button type="button" data-id="${c.id}" data-name="${escapeHtml(c.name)}" role="option" class="category-option block w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">${escapeHtml(c.name)}</button>
    `).join('');
    list.querySelectorAll('.category-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedCategoryId = btn.dataset.id;
        selectedCategoryName = btn.dataset.name;
        label.textContent = selectedCategoryName;
        label.classList.remove('text-neutral-400');
        label.classList.add('text-neutral-900', 'dark:text-white');
        closeCategoryDropdown();
        clearError();
      });
    });
  } catch (err) {
    label.textContent = 'Gagal memuat layanan';
    console.error(err);
  }
}

function openCategoryDropdown() {
  document.getElementById('category-select-list').classList.remove('hidden');
  document.getElementById('category-select-btn').setAttribute('aria-expanded', 'true');
}
function closeCategoryDropdown() {
  document.getElementById('category-select-list').classList.add('hidden');
  document.getElementById('category-select-btn').setAttribute('aria-expanded', 'false');
}
function toggleCategoryDropdown() {
  const isOpen = !document.getElementById('category-select-list').classList.contains('hidden');
  if (isOpen) closeCategoryDropdown();
  else openCategoryDropdown();
}

async function loadAvailability() {
  const today = todayISO();
  const [{ data: blocked }, { data: booked }] = await Promise.all([
    supabase.from('blocked_dates').select('blocked_date').gte('blocked_date', today),
    supabase.from('bookings').select('booking_date, booking_time, end_time').in('status', ['pending', 'confirmed']).gte('booking_date', today),
  ]);

  blockedDateSet = new Set((blocked ?? []).map((b) => b.blocked_date));

  bookedSlotsByDate = new Map();
  for (const b of booked ?? []) {
    const start = (b.booking_time ?? '').slice(0, 5); // Postgres returns "HH:MM:SS" — normalize to "HH:MM"
    const end = (b.end_time ?? '').slice(0, 5);
    if (!start || !end) continue; // legacy rows saved before end_time existed — nothing to match against
    if (!bookedSlotsByDate.has(b.booking_date)) bookedSlotsByDate.set(b.booking_date, new Set());
    bookedSlotsByDate.get(b.booking_date).add(slotKey(start, end));
  }
}

function isDateFullyBooked(iso) {
  const taken = bookedSlotsByDate.get(iso);
  return Boolean(taken) && TIME_SLOTS.every((slot) => taken.has(slotKey(slot.start, slot.end)));
}

function isDateUnavailable(iso) {
  return blockedDateSet.has(iso) || isDateFullyBooked(iso);
}

function renderWeekdays() {
  document.getElementById('cal-weekdays').innerHTML = WEEKDAYS
    .map((w) => `<div class="py-2 text-center text-xs uppercase tracking-widest text-neutral-400">${w}</div>`)
    .join('');
}

function renderCalendar() {
  document.getElementById('cal-month-label').textContent = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISO();

  const cells = Array.from({ length: firstDay }, () => '<div></div>');

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toISODate(new Date(year, month, day));
    const isPast = iso < today;
    const disabled = isPast || isDateUnavailable(iso);
    const isSelected = selectedDate === iso;
    const isToday = iso === today;

    let cls = 'h-10 w-full flex items-center justify-center text-sm transition-colors ';
    if (disabled) cls += 'text-neutral-300 dark:text-neutral-700 line-through cursor-not-allowed';
    else if (isSelected) cls += 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 cursor-pointer';
    else cls += 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 cursor-pointer';
    if (isToday && !isSelected) cls += ' font-semibold underline underline-offset-4';

    cells.push(`<button type="button" data-date="${iso}" ${disabled ? 'disabled' : ''} class="${cls}">${day}</button>`);
  }

  const daysEl = document.getElementById('cal-days');
  daysEl.innerHTML = cells.join('');
  daysEl.querySelectorAll('button[data-date]:not(:disabled)').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedDate = btn.dataset.date;
      selectedStart = null;
      selectedEnd = null;
      document.getElementById('selected-date-label').textContent = formatDateLabel(selectedDate);
      clearError();
      renderCalendar();
      renderTimeSlots();
    });
  });

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();
  const prevBtn = document.getElementById('cal-prev');
  prevBtn.disabled = isCurrentMonth;
  prevBtn.classList.toggle('opacity-30', isCurrentMonth);
  prevBtn.classList.toggle('cursor-not-allowed', isCurrentMonth);
}

function renderTimeSlots() {
  const container = document.getElementById('time-slots');

  if (!selectedDate) {
    container.innerHTML = `<p class="text-sm text-neutral-400">Pilih tanggal terlebih dahulu.</p>`;
    return;
  }

  const taken = bookedSlotsByDate.get(selectedDate) ?? new Set();
  container.innerHTML = TIME_SLOTS.map((slot) => {
    const key = slotKey(slot.start, slot.end);
    const isTaken = taken.has(key);
    const isSelected = selectedStart === slot.start && selectedEnd === slot.end;
    let cls = 'time-slot-btn border px-4 py-2 text-sm transition-colors ';
    if (isTaken) cls += 'cursor-not-allowed border-neutral-200 text-neutral-300 line-through dark:border-neutral-800 dark:text-neutral-700';
    else if (isSelected) cls += 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900';
    else cls += 'border-neutral-300 text-neutral-700 hover:border-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-white';
    return `<button type="button" data-start="${slot.start}" data-end="${slot.end}" ${isTaken ? 'disabled' : ''} class="${cls}">${slot.start} – ${slot.end}</button>`;
  }).join('');

  container.querySelectorAll('.time-slot-btn:not(:disabled)').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedStart = btn.dataset.start;
      selectedEnd = btn.dataset.end;
      clearError();
      renderTimeSlots();
    });
  });
}

function showError(msg) {
  const el = document.getElementById('booking-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function clearError() {
  document.getElementById('booking-error').classList.add('hidden');
}

function buildWhatsAppLink({ name, whatsapp, date, time, service, location }) {
  const text = `Halo Anulika, saya baru saja melakukan booking.\n\nNama: ${name}\nWhatsApp: ${whatsapp}\nTanggal: ${date}\nJam: ${time}\nLayanan: ${service}\nLokasi: ${location}\n\nSaya ingin melakukan konfirmasi booking.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function showSuccess(details) {
  document.getElementById('booking-form-section').classList.add('hidden');
  const successEl = document.getElementById('booking-success');
  successEl.classList.remove('hidden');
  document.getElementById('success-summary').innerHTML = ['Nama', 'Tanggal', 'Jam', 'Layanan', 'Lokasi']
    .map((label, i) => {
      const value = [details.name, details.date, details.time, details.service, details.location][i];
      return `<div class="flex justify-between border-b border-neutral-100 py-2 dark:border-neutral-800"><dt class="text-neutral-400">${label}</dt><dd class="font-medium">${escapeHtml(value)}</dd></div>`;
    }).join('');
  document.getElementById('whatsapp-confirm-btn').href = details.waLink;
  successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function handleSubmit(e) {
  e.preventDefault();
  clearError();
  const form = e.target;
  const name = form.name.value.trim();
  const whatsapp = form.whatsapp.value.trim();
  const email = form.email.value.trim();
  const categoryId = selectedCategoryId;
  const categoryName = selectedCategoryName ?? '';
  const location = form.location.value.trim();
  const notes = form.notes.value.trim();

  if (!name || !whatsapp || !categoryId || !selectedDate || !selectedStart || !selectedEnd || !location) {
    showError('Mohon lengkapi semua field wajib, termasuk memilih tanggal dan jam.');
    return;
  }

  const key = slotKey(selectedStart, selectedEnd);
  if (isDateUnavailable(selectedDate) || bookedSlotsByDate.get(selectedDate)?.has(key)) {
    showError('Tanggal/jam yang dipilih baru saja terisi. Silakan pilih jadwal lain.');
    await loadAvailability();
    renderCalendar();
    renderTimeSlots();
    return;
  }

  const submitBtn = document.getElementById('booking-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Mengirim...';

  const { error } = await supabase.from('bookings').insert({
    name, whatsapp, email: email || null,
    category_id: categoryId,
    booking_date: selectedDate,
    booking_time: selectedStart,
    end_time: selectedEnd,
    location,
    notes: notes || null,
  });

  submitBtn.disabled = false;
  submitBtn.textContent = 'Kirim Booking';

  if (error) {
    showError('Gagal mengirim booking. Periksa koneksi Anda dan coba lagi.');
    console.error(error);
    return;
  }

  const timeRange = `${selectedStart} - ${selectedEnd}`;
  showSuccess({
    name, whatsapp, location,
    time: timeRange,
    date: formatDateLabel(selectedDate),
    service: categoryName,
    waLink: buildWhatsAppLink({ name, whatsapp, date: formatDateLabel(selectedDate), time: timeRange, service: categoryName, location }),
  });
}

async function init() {
  renderWeekdays();

  const bookingOpen = await checkBookingOpen();
  if (!bookingOpen) {
    document.getElementById('wa-fallback-link').href = `https://wa.me/${WHATSAPP_NUMBER}`;
    document.getElementById('booking-unavailable').classList.remove('hidden');
    document.getElementById('booking-form-section').classList.add('hidden');
    return;
  }

  await Promise.all([loadCategories(), loadAvailability()]);
  renderCalendar();
  renderTimeSlots();

  document.getElementById('cal-prev').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(); });
  document.getElementById('cal-next').addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(); });
  document.getElementById('booking-form').addEventListener('submit', handleSubmit);

  document.getElementById('category-select-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCategoryDropdown();
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#category-select-btn') && !e.target.closest('#category-select-list')) {
      closeCategoryDropdown();
    }
  });
}

if (document.getElementById('booking-form')) init();
