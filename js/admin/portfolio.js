import { initAdminShell, openModal, closeModal, toast, confirmAction } from './shared.js';
import { supabase } from '../supabase.js';
import { escapeHtml } from '../utils.js';

const BUCKET = 'portfolio-images';

let categoriesForSelect = [];
let existingImages = [];
let removedImageIds = new Set();
let pendingNewFiles = [];
let pendingCoverFile = null;
let editingPortfolio = null;

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function storagePathFromUrl(url) {
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

async function uploadToStorage(file, folder) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removeFromStorage(url) {
  const path = storagePathFromUrl(url);
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

function row(item) {
  const cover = item.cover_image
    ? `<img src="${item.cover_image}" alt="${escapeHtml(item.title)}" class="h-12 w-12 rounded object-cover">`
    : `<div class="flex h-12 w-12 items-center justify-center rounded bg-neutral-100 text-neutral-300 dark:bg-neutral-800">—</div>`;
  return `
    <tr>
      <td class="px-5 py-3">${cover}</td>
      <td class="px-5 py-3 font-medium text-neutral-900 dark:text-white">${escapeHtml(item.title)}</td>
      <td class="px-5 py-3 text-neutral-500 dark:text-neutral-400">${escapeHtml(item.category?.name ?? 'Tanpa Kategori')}</td>
      <td class="px-5 py-3 text-neutral-500 dark:text-neutral-400">${item.shoot_date ?? '-'}</td>
      <td class="px-5 py-3">
        <button data-id="${item.id}" data-published="${item.is_published}" class="toggle-published-btn rounded-full px-2.5 py-1 text-xs ${item.is_published ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}">${item.is_published ? 'Published' : 'Draft'}</button>
      </td>
      <td class="px-5 py-3 text-right">
        <button data-id="${item.id}" class="edit-btn px-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Edit</button>
        <button data-id="${item.id}" class="delete-btn px-2 text-xs uppercase tracking-widest text-red-500 hover:text-red-700">Hapus</button>
      </td>
    </tr>`;
}

async function loadPortfolios() {
  const tbody = document.getElementById('portfolio-table-body');
  tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-10 text-center text-sm text-neutral-400">Memuat...</td></tr>`;
  const { data, error } = await supabase.from('portfolios').select('*, category:categories(name)').order('created_at', { ascending: false });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-5 py-10 text-center text-sm text-red-500">Gagal memuat portfolio.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.length ? data.map(row).join('') : `<tr><td colspan="6" class="px-5 py-10 text-center text-sm text-neutral-400">Belum ada portfolio. Klik "Tambah Portfolio" untuk membuat yang pertama.</td></tr>`;

  tbody.querySelectorAll('.toggle-published-btn').forEach((btn) => {
    btn.addEventListener('click', () => togglePublished(btn.dataset.id, btn.dataset.published === 'true'));
  });
  tbody.querySelectorAll('.edit-btn').forEach((btn) => btn.addEventListener('click', () => openForm(btn.dataset.id)));
  tbody.querySelectorAll('.delete-btn').forEach((btn) => btn.addEventListener('click', () => deletePortfolio(btn.dataset.id)));
}

async function togglePublished(id, current) {
  const { error } = await supabase.from('portfolios').update({ is_published: !current }).eq('id', id);
  if (error) { toast('Gagal mengubah status.', 'error'); return; }
  toast('Status portfolio diperbarui.');
  loadPortfolios();
}

async function deletePortfolio(id) {
  if (!confirmAction('Hapus portfolio ini beserta seluruh gambarnya? Tindakan ini tidak dapat dibatalkan.')) return;
  const { data: portfolio } = await supabase.from('portfolios').select('*, images:portfolio_images(*)').eq('id', id).single();
  if (portfolio) {
    if (portfolio.cover_image) await removeFromStorage(portfolio.cover_image);
    for (const img of portfolio.images ?? []) await removeFromStorage(img.image_url);
  }
  const { error } = await supabase.from('portfolios').delete().eq('id', id);
  if (error) { toast('Gagal menghapus portfolio.', 'error'); return; }
  toast('Portfolio dihapus.');
  loadPortfolios();
}

function renderCoverPreview() {
  const el = document.getElementById('cover-preview-wrap');
  const src = pendingCoverFile ? URL.createObjectURL(pendingCoverFile) : editingPortfolio?.cover_image;
  el.innerHTML = src
    ? `<img src="${src}" class="h-40 w-full rounded object-cover">`
    : `<div class="flex h-40 w-full items-center justify-center rounded bg-neutral-100 text-xs text-neutral-400 dark:bg-neutral-800">Belum ada cover</div>`;
}

function renderExistingGallery() {
  const el = document.getElementById('gallery-existing');
  const visible = existingImages.filter((img) => !removedImageIds.has(img.id));
  el.innerHTML = visible.map((img) => `
    <div class="group relative aspect-square overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
      <img src="${img.image_url}" class="h-full w-full object-cover">
      <button type="button" data-id="${img.id}" class="remove-existing-btn absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white">✕</button>
    </div>`).join('');
  el.querySelectorAll('.remove-existing-btn').forEach((btn) => {
    btn.addEventListener('click', () => { removedImageIds.add(btn.dataset.id); renderExistingGallery(); });
  });
}

function renderNewGalleryPreview() {
  const el = document.getElementById('gallery-new-preview');
  el.innerHTML = pendingNewFiles.map((file, i) => `
    <div class="relative aspect-square overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
      <img src="${URL.createObjectURL(file)}" class="h-full w-full object-cover">
      <button type="button" data-index="${i}" class="remove-new-btn absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white">✕</button>
    </div>`).join('');
  el.querySelectorAll('.remove-new-btn').forEach((btn) => {
    btn.addEventListener('click', () => { pendingNewFiles.splice(Number(btn.dataset.index), 1); renderNewGalleryPreview(); });
  });
}

async function openForm(id) {
  editingPortfolio = null;
  existingImages = [];
  removedImageIds = new Set();
  pendingNewFiles = [];
  pendingCoverFile = null;

  if (id) {
    const { data } = await supabase.from('portfolios').select('*, images:portfolio_images(*)').eq('id', id).single();
    editingPortfolio = data;
    existingImages = (data?.images ?? []).sort((a, b) => a.sort_order - b.sort_order);
  }
  const isEdit = Boolean(editingPortfolio);

  openModal(`
    <form id="portfolio-form" class="max-h-[85vh] overflow-y-auto p-6">
      <h2 class="font-display text-xl text-neutral-900 dark:text-white">${isEdit ? 'Edit Portfolio' : 'Tambah Portfolio'}</h2>
      <div class="mt-5 space-y-4">
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Judul *</label>
          <input type="text" id="pf-title" required value="${escapeHtml(editingPortfolio?.title ?? '')}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Slug *</label>
          <input type="text" id="pf-slug" required value="${escapeHtml(editingPortfolio?.slug ?? '')}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Kategori</label>
            <select id="pf-category" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
              <option value="">Tanpa Kategori</option>
              ${categoriesForSelect.map((c) => `<option value="${c.id}" ${editingPortfolio?.category_id === c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Tanggal Shoot</label>
            <input type="date" id="pf-date" value="${editingPortfolio?.shoot_date ?? ''}" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Deskripsi</label>
          <textarea id="pf-description" rows="3" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">${escapeHtml(editingPortfolio?.description ?? '')}</textarea>
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Cover Image</label>
          <div id="cover-preview-wrap" class="mb-2"></div>
          <input type="file" id="pf-cover-file" accept="image/*" class="w-full text-sm">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Galeri Foto</label>
          <div id="gallery-existing" class="mb-2 grid grid-cols-4 gap-2"></div>
          <div id="gallery-new-preview" class="mb-2 grid grid-cols-4 gap-2"></div>
          <input type="file" id="pf-gallery-files" accept="image/*" multiple class="w-full text-sm">
        </div>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="pf-published" ${editingPortfolio?.is_published ? 'checked' : ''} class="h-4 w-4">
          Publikasikan ke website
        </label>
        <p id="portfolio-form-error" class="hidden border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"></p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" id="portfolio-form-cancel" class="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Batal</button>
        <button type="submit" id="portfolio-form-submit" class="bg-neutral-900 px-5 py-2.5 text-sm text-white dark:bg-white dark:text-neutral-900">Simpan</button>
      </div>
    </form>`, { maxWidth: 'max-w-2xl' });

  renderCoverPreview();
  renderExistingGallery();
  renderNewGalleryPreview();

  const titleInput = document.getElementById('pf-title');
  const slugInput = document.getElementById('pf-slug');
  if (!isEdit) titleInput.addEventListener('input', () => { slugInput.value = slugify(titleInput.value); });

  document.getElementById('pf-cover-file').addEventListener('change', (e) => {
    pendingCoverFile = e.target.files[0] || null;
    renderCoverPreview();
  });
  document.getElementById('pf-gallery-files').addEventListener('change', (e) => {
    pendingNewFiles.push(...Array.from(e.target.files));
    renderNewGalleryPreview();
    e.target.value = '';
  });

  document.getElementById('portfolio-form-cancel').addEventListener('click', closeModal);
  document.getElementById('portfolio-form').addEventListener('submit', (e) => submitForm(e, isEdit));
}

async function submitForm(e, isEdit) {
  e.preventDefault();
  const submitBtn = document.getElementById('portfolio-form-submit');
  const errEl = document.getElementById('portfolio-form-error');
  errEl.classList.add('hidden');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    let coverUrl = editingPortfolio?.cover_image ?? null;
    if (pendingCoverFile) coverUrl = await uploadToStorage(pendingCoverFile, 'covers');

    const payload = {
      title: document.getElementById('pf-title').value.trim(),
      slug: slugify(document.getElementById('pf-slug').value.trim()),
      category_id: document.getElementById('pf-category').value || null,
      shoot_date: document.getElementById('pf-date').value || null,
      description: document.getElementById('pf-description').value.trim() || null,
      cover_image: coverUrl,
      is_published: document.getElementById('pf-published').checked,
    };

    let portfolioId = editingPortfolio?.id;
    if (isEdit) {
      const { error } = await supabase.from('portfolios').update(payload).eq('id', portfolioId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('portfolios').insert(payload).select('id').single();
      if (error) throw error;
      portfolioId = data.id;
    }

    for (const imgId of removedImageIds) {
      const img = existingImages.find((i) => i.id === imgId);
      if (img) await removeFromStorage(img.image_url);
      await supabase.from('portfolio_images').delete().eq('id', imgId);
    }

    let sortOrder = existingImages.filter((i) => !removedImageIds.has(i.id)).length;
    for (const file of pendingNewFiles) {
      const url = await uploadToStorage(file, `gallery/${portfolioId}`);
      await supabase.from('portfolio_images').insert({ portfolio_id: portfolioId, image_url: url, sort_order: sortOrder++ });
    }

    toast(isEdit ? 'Portfolio diperbarui.' : 'Portfolio ditambahkan.');
    closeModal();
    loadPortfolios();
  } catch (err) {
    console.error(err);
    errEl.textContent = err.code === '23505' ? 'Slug sudah digunakan, gunakan slug lain.' : 'Gagal menyimpan portfolio.';
    errEl.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan';
  }
}

async function init() {
  const shell = await initAdminShell({ activePage: 'portfolio.html' });
  if (!shell) return;

  const { data } = await supabase.from('categories').select('id, name').order('sort_order', { ascending: true });
  categoriesForSelect = data ?? [];

  document.getElementById('add-portfolio-btn').addEventListener('click', () => openForm(null));
  loadPortfolios();
}

init();
