function escapeText(value) {
  const node = document.createElement('span');
  node.textContent = value === null || value === undefined ? '' : String(value);
  return node.innerHTML;
}

function icon(name) {
  const paths = { dashboard: 'M3 11l9-8 9 8v9H4v-9M9 20v-6h6v6', members: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87', trainers: 'M4 20h16M6 20V9l6-5 6 5v11M9 20v-4h6v4M9 11h.01M15 11h.01', classes: 'M4 5h16v15H4zM8 3v4M16 3v4M4 10h16', bookings: 'M5 12l4 4L19 6', reports: 'M5 20V10M12 20V4M19 20v-7', settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4', logout: 'M10 17l5-5-5-5M15 12H3M21 3v18h-8', plus: 'M12 5v14M5 12h14', edit: 'M4 20h4l11-11-4-4L4 16zM13 7l4 4', delete: 'M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 14h10l1-14', menu: 'M4 7h16M4 12h16M4 17h16', close: 'M6 6l12 12M18 6L6 18' };
  return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (paths[name] || '') + '"></path></svg>';
}

function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'success');
  toast.textContent = message;
  document.getElementById('toast-area').appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3500);
}

function openModal(title, content) {
  document.getElementById('modal-area').innerHTML = '<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>' + escapeText(title) + '</h2><button class="plain-button" onclick="closeModal()">' + icon('close') + '</button></div><div class="modal-body">' + content + '</div></div></div>';
}

function closeModal() { document.getElementById('modal-area').innerHTML = ''; }

function confirmAction(message, action) {
  openModal('Please confirm', '<p class="confirm-text">' + escapeText(message) + '</p><div class="form-actions"><button class="button secondary" onclick="closeModal()">Cancel</button><button class="button danger" id="confirm-action">Confirm</button></div>');
  document.getElementById('confirm-action').onclick = async function () { closeModal(); await action(); };
}

function fieldError(id, text) {
  const field = document.getElementById(id);
  if (field) field.textContent = text || '';
}

function clearErrors() { document.querySelectorAll('.field-error').forEach(function (item) { item.textContent = ''; }); }

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function validPhone(value) { return /^\d+$/.test(value); }
function todayText() { return new Date().toISOString().slice(0, 10); }
function emptyState(text) { return '<div class="empty-state">' + escapeText(text) + '</div>'; }

function renderTable(columns, rows, emptyMessage) {
  if (!rows.length) return emptyState(emptyMessage);
  return '<div class="table-wrap"><table><thead><tr>' + columns.map(function (column) { return '<th>' + escapeText(column) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
}

function statusBadge(value) { return '<span class="badge ' + escapeText(String(value).toLowerCase()) + '">' + escapeText(value) + '</span>'; }
