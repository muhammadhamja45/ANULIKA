// Shared admin shell: auth guard, sidebar, topbar, modal + toast helpers.
// Every admin page calls initAdminShell() first, then renders its own <main> content.
import { getSession, getProfile, signOut } from '../auth.js';
import { bindThemeToggle, SUN_ICON, MOON_ICON } from '../dark-mode.js';
import { escapeHtml } from '../utils.js';

const ICON_GRID = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.5h6.75v6.75H3.75V4.5ZM13.5 4.5h6.75v6.75H13.5V4.5ZM3.75 12.75h6.75v6.75H3.75v-6.75ZM13.5 12.75h6.75v6.75H13.5v-6.75Z"/></svg>`;
const ICON_IMAGE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 4.5h18M3.75 4.5v15a.75.75 0 0 0 .75.75h15a.75.75 0 0 0 .75-.75v-15M9 9.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>`;
const ICON_TAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.182 0l4.318-4.318a2.25 2.25 0 0 0 0-3.182L10.16 3.66A2.25 2.25 0 0 0 9.568 3Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z"/></svg>`;
const ICON_CALENDAR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M4.5 6h15a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75V6.75A.75.75 0 0 1 4.5 6Z"/></svg>`;
const ICON_USERS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 3 19.5M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM19.5 19.5v-.75a3.75 3.75 0 0 0-3-3.675M15.75 6.128a3.75 3.75 0 0 1 0 7.243"/></svg>`;
const ICON_SETTINGS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.75 6H7.5m9 12h3.75M13.5 18a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.75 18H10.5M13.5 12h6.75M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.75 12H10.5"/></svg>`;
const ICON_LOGOUT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"/></svg>`;
const ICON_MENU = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/></svg>`;

const NAV_ITEMS = [
  { href: 'dashboard.html', label: 'Dashboard', icon: ICON_GRID, roles: ['admin', 'editor'] },
  { href: 'portfolio.html', label: 'Portfolio', icon: ICON_IMAGE, roles: ['admin', 'editor'] },
  { href: 'categories.html', label: 'Kategori', icon: ICON_TAG, roles: ['admin', 'editor'] },
  { href: 'bookings.html', label: 'Booking', icon: ICON_CALENDAR, roles: ['admin', 'editor'] },
  { href: 'users.html', label: 'Pengguna', icon: ICON_USERS, roles: ['admin'] },
  { href: 'settings.html', label: 'Pengaturan', icon: ICON_SETTINGS, roles: ['admin', 'editor'] },
];

function renderSidebar(activePage, role) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  return `
    <div class="flex h-16 shrink-0 items-center border-b border-neutral-200 px-6 dark:border-neutral-800">
      <a href="dashboard.html" class="font-display text-xl tracking-[0.2em] text-neutral-900 dark:text-white">ANULIKA</a>
    </div>
    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      ${items.map((item) => `
        <a href="${item.href}" class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${activePage === item.href ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-900'}">
          ${item.icon}<span>${item.label}</span>
        </a>`).join('')}
    </nav>
    <div class="border-t border-neutral-200 p-4 text-xs text-neutral-400 dark:border-neutral-800">Anulika Admin</div>`;
}

function renderTopbar(profile) {
  const initial = (profile.full_name || profile.email || '?').trim().charAt(0).toUpperCase();
  return `
    <button id="sidebar-toggle" aria-label="Buka menu" class="p-2 text-neutral-600 dark:text-neutral-300 lg:hidden">${ICON_MENU}</button>
    <div class="flex-1"></div>
    <button id="theme-toggle" aria-label="Ganti tema" class="rounded-full p-2 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800">
      <span class="block dark:hidden">${MOON_ICON}</span>
      <span class="hidden dark:block">${SUN_ICON}</span>
    </button>
    <div class="mx-3 h-8 w-px bg-neutral-200 dark:bg-neutral-800"></div>
    <div class="flex items-center gap-2.5">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-white dark:bg-white dark:text-neutral-900">${escapeHtml(initial)}</div>
      <div class="hidden sm:block">
        <p class="text-sm font-medium leading-tight text-neutral-900 dark:text-white">${escapeHtml(profile.full_name)}</p>
        <p class="text-xs capitalize leading-tight text-neutral-400">${escapeHtml(profile.role)}</p>
      </div>
    </div>
    <button id="logout-btn" aria-label="Keluar" class="ml-2 rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-neutral-800">${ICON_LOGOUT}</button>`;
}

/**
 * Auth guard + shell renderer. Call at the top of every admin page except login.html.
 * Redirects to login if not authenticated/active, or to dashboard if requiredRole fails.
 */
export async function initAdminShell({ activePage, requiredRole } = {}) {
  const session = await getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const profile = await getProfile(session.user.id);
  if (!profile || !profile.is_active) {
    await signOut();
    window.location.href = 'login.html?deactivated=1';
    return null;
  }

  if (requiredRole && profile.role !== requiredRole) {
    window.location.href = 'dashboard.html';
    return null;
  }

  document.getElementById('admin-sidebar').innerHTML = renderSidebar(activePage, profile.role);
  document.getElementById('admin-topbar').innerHTML = renderTopbar(profile);
  bindThemeToggle(document.getElementById('theme-toggle'));

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await signOut();
    window.location.href = 'login.html';
  });

  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
  });
  backdrop?.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  });

  return { session, profile };
}

// ---------------------------------------------------------------------------
// Modal (used by categories/portfolio/bookings/users pages for add/edit/detail)
// ---------------------------------------------------------------------------
export function openModal(innerHtml, { maxWidth = 'max-w-lg' } = {}) {
  const root = document.getElementById('admin-modal-root');
  root.innerHTML = `
    <div id="modal-backdrop" class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10 sm:items-center">
      <div class="w-full ${maxWidth} rounded-lg bg-white shadow-xl dark:bg-neutral-900">${innerHtml}</div>
    </div>`;
  document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
}
export function closeModal() {
  const root = document.getElementById('admin-modal-root');
  if (root) root.innerHTML = '';
}

// ---------------------------------------------------------------------------
// Toast (success / error notifications)
// ---------------------------------------------------------------------------
export function toast(message, type = 'success') {
  const root = document.getElementById('admin-toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `rounded-md px-4 py-3 text-sm shadow-lg ${type === 'error' ? 'bg-red-600 text-white' : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function confirmAction(message) {
  return window.confirm(message);
}
