function escapeText(value) {
  const node = document.createElement('span');
  node.textContent = value === null || value === undefined ? '' : String(value);
  return node.innerHTML;
}

function icon(name) {
  const icons = { dashboard: '⌂', members: '♙', trainers: '♧', classes: '▣', bookings: '✓', reports: '▥', settings: '⚙', logout: '↪', plus: '+', edit: '✎', delete: '×', menu: '☰', close: '×' };
  return '<span class="icon">' + (icons[name] || '') + '</span>';
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
