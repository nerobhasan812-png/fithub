function bytesToBase64(bytes) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), function (letter) { return letter.charCodeAt(0); });
}

async function createPasswordHash(password, existingSalt) {
  const salt = existingSalt ? base64ToBytes(existingSalt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
  return { hash: bytesToBase64(hash), salt: existingSalt || bytesToBase64(salt) };
}

async function login(username, password) {
  const staff = queryOne('SELECT * FROM staff WHERE username = ?', [username]);
  if (!staff) return false;
  const result = await createPasswordHash(password, staff.salt);
  if (result.hash !== staff.password_hash) return false;
  sessionStorage.setItem('fithub_staff', JSON.stringify({ id: staff.id, name: staff.name, username: staff.username }));
  return true;
}

function currentStaff() {
  const saved = sessionStorage.getItem('fithub_staff');
  return saved ? JSON.parse(saved) : null;
}

function logout() {
  sessionStorage.removeItem('fithub_staff');
  showLoginPage();
}
