import { initAdminShell, openModal, closeModal, toast, confirmAction } from './shared.js';
import { supabase } from '../supabase.js';
import { escapeHtml } from '../utils.js';

let categoriesCache = [];

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function row(cat) {
  return `
    <tr>
      <td class="px-5 py-3.5">
        <p class="font-medium text-neutral-900 dark:text-white">${escapeHtml(cat.name)}</p>
        ${cat.description ? `<p class="text-xs text-neutral-400">${escapeHtml(cat.description)}</p>` : ''}
      </td>
      <td class="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">${escapeHtml(cat.slug)}</td>
      <td class="px-5 py-3.5">
        <button data-id="${cat.id}" data-active="${cat.is_active}" class="toggle-active-btn rounded-full px-2.5 py-1 text-xs ${cat.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}">${cat.is_active ? 'Aktif' : 'Nonaktif'}</button>
      </td>
      <td class="px-5 py-3.5 text-right">
        <button data-id="${cat.id}" class="edit-btn px-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Edit</button>
        <button data-id="${cat.id}" class="delete-btn px-2 text-xs uppercase tracking-widest text-red-500 hover:text-red-700">Hapus</button>
      </td>
    </tr>`;
}

async function loadCategories() {
  const tbody = document.getElementById('categories-table-body');
  tbody.innerHTML = `<tr><td colspan="4" class="px-5 py-10 text-center text-sm text-neutral-400">Memuat...</td></tr>`;
  const { data, error } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-5 py-10 text-center text-sm text-red-500">Gagal memuat kategori.</td></tr>`;
    return;
  }
  categoriesCache = data;
  tbody.innerHTML = data.length ? data.map(row).join('') : `<tr><td colspan="4" class="px-5 py-10 text-center text-sm text-neutral-400">Belum ada kategori. Klik "Tambah Kategori" untuk membuat yang pertama.</td></tr>`;
  wireRowButtons();
}

function wireRowButtons() {
  document.querySelectorAll('.toggle-active-btn').forEach((btn) => {
    btn.addEventListener('click', () => toggleActive(btn.dataset.id, btn.dataset.active === 'true'));
  });
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => openForm(categoriesCache.find((c) => c.id === btn.dataset.id)));
  });
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => deleteCategory(btn.dataset.id));
  });
}

async function toggleActive(id, current) {
  const { error } = await supabase.from('categories').update({ is_active: !current }).eq('id', id);
  if (error) { toast('Gagal mengubah status.', 'error'); return; }
  toast('Status kategori diperbarui.');
  loadCategories();
}

async function deleteCategory(id) {
  if (!confirmAction('Hapus kategori ini? Portfolio yang menggunakan kategori ini akan menjadi "Tanpa Kategori".')) return;
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) { toast('Gagal menghapus kategori.', 'error'); return; }
  toast('Kategori dihapus.');
  loadCategories();
}

function openForm(category) {
  const isEdit = Boolean(category);
  openModal(`
    <form id="category-form" class="p-6">
      <h2 class="font-display text-xl text-neutral-900 dark:text-white">${isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
      <div class="mt-5 space-y-4">
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Nama *</label>
          <input type="text" id="cat-name" required value="${escapeHtml(category?.name ?? '')}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Slug *</label>
          <input type="text" id="cat-slug" required value="${escapeHtml(category?.slug ?? '')}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Deskripsi</label>
          <textarea id="cat-description" rows="2" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">${escapeHtml(category?.description ?? '')}</textarea>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="cat-active" ${category?.is_active !== false ? 'checked' : ''} class="h-4 w-4">
          Aktif (tampil di website)
        </label>
        <p id="category-form-error" class="hidden border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"></p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" id="category-form-cancel" class="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Batal</button>
        <button type="submit" class="bg-neutral-900 px-5 py-2.5 text-sm text-white dark:bg-white dark:text-neutral-900">Simpan</button>
      </div>
    </form>`);

  const nameInput = document.getElementById('cat-name');
  const slugInput = document.getElementById('cat-slug');
  if (!isEdit) nameInput.addEventListener('input', () => { slugInput.value = slugify(nameInput.value); });

  document.getElementById('category-form-cancel').addEventListener('click', closeModal);
  document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      name: nameInput.value.trim(),
      slug: slugify(slugInput.value.trim()),
      description: document.getElementById('cat-description').value.trim() || null,
      is_active: document.getElementById('cat-active').checked,
    };
    const { error } = isEdit
      ? await supabase.from('categories').update(payload).eq('id', category.id)
      : await supabase.from('categories').insert(payload);

    if (error) {
      const errEl = document.getElementById('category-form-error');
      errEl.textContent = error.code === '23505' ? 'Slug sudah digunakan, gunakan slug lain.' : 'Gagal menyimpan kategori.';
      errEl.classList.remove('hidden');
      return;
    }
    toast(isEdit ? 'Kategori diperbarui.' : 'Kategori ditambahkan.');
    closeModal();
    loadCategories();
  });
}

async function init() {
  const shell = await initAdminShell({ activePage: 'categories.html' });
  if (!shell) return;
  document.getElementById('add-category-btn').addEventListener('click', () => openForm(null));
  loadCategories();
}

init();
