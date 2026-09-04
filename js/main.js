// Site chrome shared by every public page: header, mobile menu, footer, AOS init.
// Page-specific data (portfolio grids, booking form) lives in portfolio.js / booking.js.
import { bindThemeToggle, SUN_ICON, MOON_ICON } from './dark-mode.js';
import { WHATSAPP_NUMBER } from './config.js';

const NAV_LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'portfolio.html', label: 'Portfolio' },
  { href: 'about.html', label: 'Tentang' },
  { href: 'booking.html', label: 'Booking' },
];

const MENU_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>`;
const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>`;

function currentPage() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

function renderHeader() {
  const active = currentPage();
  const navLink = (link, extra = '') => `
    <a href="${link.href}" class="text-sm uppercase tracking-wide transition-colors hover:text-neutral-900 dark:hover:text-white ${active === link.href ? 'text-neutral-900 dark:text-white font-medium' : 'text-neutral-500 dark:text-neutral-400'} ${extra}">${link.label}</a>`;

  return `
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
      <a href="index.html" class="font-display text-2xl tracking-[0.2em] text-neutral-900 dark:text-white">ANULIKA</a>
      <nav class="hidden md:flex items-center gap-8">
        ${NAV_LINKS.map((l) => navLink(l)).join('')}
      </nav>
      <div class="flex items-center gap-3">
        <button id="theme-toggle" aria-label="Ganti tema" class="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
          <span class="block dark:hidden">${MOON_ICON}</span>
          <span class="hidden dark:block">${SUN_ICON}</span>
        </button>
        <a href="booking.html" class="hidden md:inline-block border border-neutral-900 px-5 py-2 text-sm uppercase tracking-wide text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-neutral-900">Booking</a>
        <button id="mobile-menu-toggle" aria-label="Buka menu" aria-expanded="false" class="p-2 text-neutral-900 dark:text-white md:hidden">${MENU_ICON}</button>
      </div>
    </div>
    <div id="mobile-menu" class="hidden space-y-4 border-t border-neutral-200 px-6 py-5 dark:border-neutral-800 md:hidden">
      ${NAV_LINKS.map((l) => navLink(l, 'block')).join('')}
      <a href="booking.html" class="block border border-neutral-900 px-5 py-2 text-center text-sm uppercase tracking-wide text-neutral-900 dark:border-white dark:text-white">Booking</a>
    </div>`;
}

function renderFooter() {
  return `
    <div class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div class="grid gap-12 md:grid-cols-3">
        <div>
          <p class="font-display text-2xl tracking-[0.2em] text-neutral-900 dark:text-white">ANULIKA</p>
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">Studio fotografi yang mengabadikan momen berharga Anda dengan pendekatan editorial dan personal.</p>
        </div>
        <div>
          <p class="text-xs uppercase tracking-widest text-neutral-400">Navigasi</p>
          <ul class="mt-4 space-y-2 text-sm">
            ${NAV_LINKS.map((l) => `<li><a href="${l.href}" class="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">${l.label}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <p class="text-xs uppercase tracking-widest text-neutral-400">Kontak</p>
          <ul class="mt-4 space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
            <li><a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" rel="noopener" class="hover:text-neutral-900 dark:hover:text-white">WhatsApp: +${WHATSAPP_NUMBER}</a></li>
            <li>Email: hello@anulika.studio</li>
            <li>Indonesia</li>
          </ul>
        </div>
      </div>
      <div class="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-neutral-200 pt-8 text-xs text-neutral-400 dark:border-neutral-800 md:flex-row">
        <p>© <span id="footer-year"></span> Anulika Photography. All rights reserved.</p>
        <p>Crafted with care.</p>
      </div>
    </div>`;
}

function initHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  el.innerHTML = renderHeader();
  bindThemeToggle(document.getElementById('theme-toggle'));

  const menuBtn = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  menuBtn?.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('hidden');
    menu.classList.toggle('hidden');
    menuBtn.setAttribute('aria-expanded', String(!isOpen));
    menuBtn.innerHTML = isOpen ? MENU_ICON : CLOSE_ICON;
  });
}

function initFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = renderFooter();
  document.getElementById('footer-year').textContent = new Date().getFullYear();
}

initHeader();
initFooter();

if (window.AOS) {
  AOS.init({ duration: 700, once: true, offset: 40, easing: 'ease-out-cubic' });
}
