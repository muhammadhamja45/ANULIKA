import { initAdminShell, openModal, closeModal, toast, confirmAction } from './shared.js';
import { supabase } from '../supabase.js';
import { escapeHtml } from '../utils.js';

let currentUserId = null;
let usersCache = [];

function countActiveAdmins() {
  return usersCache.filter((u) => u.role === 'admin' && u.is_active).length;
}

async function callAdminUsersFn(body) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    let message = 'Terjadi kesalahan. Pastikan Edge Function "admin-users" sudah di-deploy.';
    try { message = (await error.context.json()).error ?? message; } catch { /* keep default */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

function row(u) {
  const isSelf = u.id === currentUserId;
  return `
    <tr>
      <td class="px-5 py-3.5">
        <p class="font-medium text-neutral-900 dark:text-white">${escapeHtml(u.full_name)}</p>
        ${isSelf ? '<p class="text-xs text-neutral-400">Anda</p>' : ''}
      </td>
      <td class="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">${escapeHtml(u.email)}</td>
      <td class="px-5 py-3.5">
        <select data-id="${u.id}" class="role-select rounded border border-neutral-300 bg-transparent px-2 py-1 text-xs capitalize dark:border-neutral-700" ${isSelf ? 'disabled' : ''}>
          <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>Editor</option>
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
      </td>
      <td class="px-5 py-3.5">
        <button data-id="${u.id}" data-active="${u.is_active}" ${isSelf ? 'disabled' : ''} class="toggle-active-btn rounded-full px-2.5 py-1 text-xs ${u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'}">${u.is_active ? 'Aktif' : 'Nonaktif'}</button>
      </td>
      <td class="px-5 py-3.5 text-right">
        <button data-email="${escapeHtml(u.email)}" class="reset-pw-btn px-2 text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Reset Password</button>
        <button data-id="${u.id}" ${isSelf ? 'disabled' : ''} class="delete-user-btn px-2 text-xs uppercase tracking-widest text-red-500 hover:text-red-700 disabled:opacity-30">Hapus</button>
      </td>
    </tr>`;
}

async function loadUsers() {
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = `<tr><td colspan="5" class="px-5 py-10 text-center text-sm text-neutral-400">Memuat...</td></tr>`;
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-5 py-10 text-center text-sm text-red-500">Gagal memuat pengguna.</td></tr>`;
    return;
  }
  usersCache = data;
  tbody.innerHTML = data.map(row).join('');

  tbody.querySelectorAll('.role-select').forEach((sel) => sel.addEventListener('change', () => changeRole(sel)));
  tbody.querySelectorAll('.toggle-active-btn').forEach((btn) => btn.addEventListener('click', () => toggleActive(btn.dataset.id, btn.dataset.active === 'true')));
  tbody.querySelectorAll('.reset-pw-btn').forEach((btn) => btn.addEventListener('click', () => resetPassword(btn.dataset.email)));
  tbody.querySelectorAll('.delete-user-btn').forEach((btn) => btn.addEventListener('click', () => deleteUser(btn.dataset.id)));
}

async function changeRole(sel) {
  const user = usersCache.find((u) => u.id === sel.dataset.id);
  const newRole = sel.value;
  if (user.role === 'admin' && newRole !== 'admin' && countActiveAdmins() <= 1) {
    toast('Tidak dapat mengubah role admin aktif terakhir.', 'error');
    sel.value = user.role;
    return;
  }
  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
  if (error) { toast('Gagal mengubah role.', 'error'); sel.value = user.role; return; }
  toast('Role pengguna diperbarui.');
  loadUsers();
}

async function toggleActive(id, current) {
  const user = usersCache.find((u) => u.id === id);
  if (user.role === 'admin' && current && countActiveAdmins() <= 1) {
    toast('Tidak dapat menonaktifkan admin aktif terakhir.', 'error');
    return;
  }
  const { error } = await supabase.from('profiles').update({ is_active: !current }).eq('id', id);
  if (error) { toast('Gagal mengubah status.', 'error'); return; }
  toast('Status pengguna diperbarui.');
  loadUsers();
}

async function resetPassword(email) {
  const redirectTo = `${location.origin}${location.pathname.replace('users.html', 'login.html')}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) { toast('Gagal mengirim email reset password.', 'error'); return; }
  toast(`Email reset password telah dikirim ke ${email}.`);
}

async function deleteUser(id) {
  if (!confirmAction('Hapus user ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
  try {
    await callAdminUsersFn({ action: 'delete', payload: { user_id: id } });
    toast('User berhasil dihapus.');
    loadUsers();
  } catch (err) {
    toast(err.message, 'error');
  }
}

function openUserForm() {
  openModal(`
    <form id="user-form" class="p-6">
      <h2 class="font-display text-xl text-neutral-900 dark:text-white">Tambah User</h2>
      <div class="mt-5 space-y-4">
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Nama Lengkap *</label>
          <input type="text" id="user-name" required class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Email *</label>
          <input type="email" id="user-email" required class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Password Sementara *</label>
          <input type="password" id="user-password" required minlength="6" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
        </div>
        <div>
          <label class="mb-1.5 block text-xs uppercase tracking-widest text-neutral-400">Role *</label>
          <select id="user-role" class="w-full border border-neutral-300 bg-transparent px-4 py-2.5 text-sm focus:border-neutral-900 focus:outline-none dark:border-neutral-700 dark:focus:border-white">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <p id="user-form-error" class="hidden border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400"></p>
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" id="user-form-cancel" class="px-5 py-2.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Batal</button>
        <button type="submit" id="user-form-submit" class="bg-neutral-900 px-5 py-2.5 text-sm text-white dark:bg-white dark:text-neutral-900">Simpan</button>
      </div>
    </form>`);

  document.getElementById('user-form-cancel').addEventListener('click', closeModal);
  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('user-form-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Menyimpan...';
    try {
      await callAdminUsersFn({
        action: 'create',
        payload: {
          full_name: document.getElementById('user-name').value.trim(),
          email: document.getElementById('user-email').value.trim(),
          password: document.getElementById('user-password').value,
          role: document.getElementById('user-role').value,
        },
      });
      toast('User berhasil ditambahkan.');
      closeModal();
      loadUsers();
    } catch (err) {
      const errEl = document.getElementById('user-form-error');
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';
    }
  });
}

async function init() {
  const shell = await initAdminShell({ activePage: 'users.html', requiredRole: 'admin' });
  if (!shell) return;
  currentUserId = shell.profile.id;
  document.getElementById('add-user-btn').addEventListener('click', openUserForm);
  loadUsers();
}

init();
