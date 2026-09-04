// Escapes untrusted text before it's inserted via innerHTML. Required wherever
// public-submitted content (e.g. booking form fields, entered by anonymous
// visitors) is later rendered in the admin dashboard — without this, a booking
// name/note containing a <script> or onerror= payload would execute in the
// logged-in admin's session (stored XSS). Applied to admin-entered fields too
// for consistency and to keep attribute values (value="...") from breaking.
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
