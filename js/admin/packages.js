import { initAdminShell, openModal, closeModal, toast, confirmAction } from './shared.js';
import { supabase } from '../supabase.js';
import { escapeHtml } from '../utils.js';

const BUCKET = 'portfolio-images'; // reused bucket; package photos live under packages/

let packagesCache = [];
let editingPackage = null;
let pendingImageFile = null;

async function uploadToStorage(file, folder) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function row(pkg) {
  const thumb = pkg.image_url
    ? `<img src="${pkg.image_url}" alt="${escapeHtml(pkg.name)}" class="h-12 w-12 rounded object-cover">`
    : `<div class="flex h-12 w-12 items-center justify-center rounded bg-neutral-100 text-neutral-300 dark:bg-neutral-800">—</div>`;
  return `
    <tr>
      <td class="px-5 py-3">${thumb}</td>
      <td class="px-5 py-3.5">
        <p class="font-medium text-neutral-900 dark:text-white">${escapeHtml(pkg.name)}</p>
        ${pkg.description ? `<p class="text-xs text-neutral-400">${escapeHtml(pkg.description)}</p>` : ''}
      </td>
      <td class="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">${escapeHtml(pkg.price_label || '-')}</td>
      <td class="px-5 py-3.5">
        <button data-id="${pkg.id}" data-active="${pkg.is_active}" class="toggle-active-btn rounded-full px-2.5 py-1 text-xs ${pkg.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}">${pkg.is_active ? 'Aktif' : 'Nonaktif'}</button>
      </td>
      <td class="px-5 py-3.5 text-right">
        <button data-id="${pkg.id}" class="edit-btn px-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Edit</button>
        <button data-id="${pkg.id}" class="delete-btn px-2 text-xs uppercase tracking-widest text-red-500 hover:text-red-700">Hapus</button>
      </td>
    </tr>`;
}

async function loadPackages() {
  const tbody = document.getElementById('packages-table-body');
  tbody.innerHTML = `<tr><td colspan="5" class="px-5 py-10 text-center text-sm text-neutral-400">Memuat...</td></tr>`;
  const { data, error } = await supabase.from('packages').select('*').order('sort_order', { ascending: true });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-5 py-10 text-center text-sm text-red-500">Gagal memuat paket. Pastikan migration_002 sudah dijalankan di Supabase.</td></tr>`;
    return;
  }
  packagesCache = data;
  tbody.innerHTML = data.length ? data.map(row).join('') : `<tr><td colspan="5" class="px-5 py-10 text-center text-sm text-neutral-400">Belum ada paket. Klik "Tambah Paket" untuk membuat yang pertama.</td></tr>`;
  wireRowButtons();
}

function wireRowButtons() {
  document.querySelectorAll('.toggle-active-btn').forEach((btn) => {
    btn.addEventListener('click', () => toggleActive(btn.dataset.id, btn.dataset.active === 'true'));
  });
  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => openForm(packagesCache.find((p) => p.id === btn.dataset.id)));
  });
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => deletePackage(btn.dataset.id));
  });
}

async function toggleActive(id, current) {
  const { error } = await supabase.from('packages').update({ is_active: !current }).eq('id', id);
  if (error) { toast('Gagal mengubah status.', 'error'); return; }
  toast('Status paket diperbarui.');
  loadPackages();
}

async function deletePackage(id) {
  if (!confirmAction('Hapus paket ini?')) return;
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) { toast('Gagal menghapus paket.', 'error'); return; }
  toast('Paket dihapus.');
  loadPackages();
}

function renderImagePreview() {
  const el = document.getElementById('pkg-image-preview');
  const src = pendingImageFile ? URL.createObjectURL(pendingImageFile) : editingPackage?.image_url;
  el.innerHTML = src
    ? `<img src="${src}" class="h-32 w-32 rounded object-cover">`
    : `<div class="flex h-32 w-32 items-center justify-center rounded bg-neutral-100 text-xs text-neutral-400 dark:bg-neutral-800">Belum ada foto</div>`;
}

function openForm(pkg) {
  editingPackage = pkg ?? null;
  pendingImageFile = null;
  const isEdit = Boolean(editingPackage);

  openModal(`
    <form id="package-form" class="max-h-[85vh] overflow-y-auto p-6">
      <h2 class="font-display text-xl text-neutral-900 dark:text-white">${isEdit ? 'Edit Paket' : 'Tambah Paket'}</h2>
      <div class="mt-5 space-y-4">
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Foto Paket</label>
          <div id="pkg-image-preview" class="mb-2"></div>
          <input type="file" id="pkg-image-file" accept="image/*" class="w-full text-sm">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Nama Paket *</label>
          <input type="text" id="pkg-name" required value="${escapeHtml(editingPackage?.name ?? '')}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Harga</label>
          <input type="text" id="pkg-price" placeholder="Contoh: Rp 2.500.000" value="${escapeHtml(editingPackage?.price_label ?? '')}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Deskripsi Singkat</label>
          <input type="text" id="pkg-description" value="${escapeHtml(editingPackage?.description ?? '')}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Fasilitas (satu per baris)</label>
          <textarea id="pkg-features" rows="5" placeholder="2 jam sesi pemotretan&#10;1 fotografer&#10;20 foto hasil edit" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">${escapeHtml(editingPackage?.features ?? '')}</textarea>
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="pkg-active" ${editingPackage?.is_active !== false ? 'checked' : ''} class="h-4 w-4">
          Aktif (tampil di halaman utama)
        </label>
        <p id="package-form-error" class="hidden border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"></p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" id="package-form-cancel" class="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Batal</button>
        <button type="submit" id="package-form-submit" class="bg-neutral-900 px-5 py-2.5 text-sm text-white dark:bg-white dark:text-neutral-900">Simpan</button>
      </div>
    </form>`);

  renderImagePreview();
  document.getElementById('pkg-image-file').addEventListener('change', (e) => {
    pendingImageFile = e.target.files[0] || null;
    renderImagePreview();
  });

  document.getElementById('package-form-cancel').addEventListener('click', closeModal);
  document.getElementById('package-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('package-form-submit');
    const errEl = document.getElementById('package-form-error');
    errEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';

    try {
      let imageUrl = editingPackage?.image_url ?? null;
      if (pendingImageFile) imageUrl = await uploadToStorage(pendingImageFile, 'packages');

      const payload = {
        name: document.getElementById('pkg-name').value.trim(),
        price_label: document.getElementById('pkg-price').value.trim() || null,
        description: document.getElementById('pkg-description').value.trim() || null,
        features: document.getElementById('pkg-features').value.trim() || null,
        image_url: imageUrl,
        is_active: document.getElementById('pkg-active').checked,
      };
      const { error } = isEdit
        ? await supabase.from('packages').update(payload).eq('id', editingPackage.id)
        : await supabase.from('packages').insert(payload);
      if (error) throw error;

      toast(isEdit ? 'Paket diperbarui.' : 'Paket ditambahkan.');
      closeModal();
      loadPackages();
    } catch (err) {
      console.error(err);
      errEl.textContent = 'Gagal menyimpan paket.';
      errEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';
    }
  });
}

async function init() {
  const shell = await initAdminShell({ activePage: 'packages.html' });
  if (!shell) return;
  document.getElementById('add-package-btn').addEventListener('click', () => openForm(null));
  loadPackages();
}

init();
