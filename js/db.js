let db;
let SQL;

function openStore() {
  return new Promise(function (resolve, reject) {
    const request = indexedDB.open('fithub_database', 1);
    request.onupgradeneeded = function () { request.result.createObjectStore('files'); };
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

async function getSavedDatabase() {
  const store = await openStore();
  return new Promise(function (resolve, reject) {
    const transaction = store.transaction('files', 'readonly');
    const request = transaction.objectStore('files').get('main');
    request.onsuccess = function () { resolve(request.result); };
    request.onerror = function () { reject(request.error); };
  });
}

async function saveDatabase() {
  if (!db) return;
  const store = await openStore();
  return new Promise(function (resolve, reject) {
    const transaction = store.transaction('files', 'readwrite');
    transaction.objectStore('files').put(db.export(), 'main');
    transaction.oncomplete = resolve;
    transaction.onerror = function () { reject(transaction.error); };
  });
}

async function initDatabase() {
  SQL = await initSqlJs();
  const saved = await getSavedDatabase();
  db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  createTables();
  if (!saved) await addSampleData();
}

function createTables() {
  db.run(`CREATE TABLE IF NOT EXISTS staff (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, salt TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS trainers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, specialty TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL)`);
  db.run(`CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL, membership_type TEXT NOT NULL, start_date TEXT NOT NULL, expiry_date TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1)`);
  db.run(`CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category TEXT NOT NULL, trainer_id INTEGER NOT NULL, class_date TEXT NOT NULL, class_time TEXT NOT NULL, duration INTEGER NOT NULL, capacity INTEGER NOT NULL CHECK(capacity > 0), FOREIGN KEY(trainer_id) REFERENCES trainers(id))`);
  db.run(`CREATE TABLE IF NOT EXISTS bookings (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL, class_id INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('Booked','Cancelled')), booked_at TEXT NOT NULL, cancelled_at TEXT, cancellation_fee REAL NOT NULL DEFAULT 0, attended INTEGER NOT NULL DEFAULT 0, UNIQUE(member_id, class_id), FOREIGN KEY(member_id) REFERENCES members(id), FOREIGN KEY(class_id) REFERENCES classes(id))`);
}

function queryAll(sql, params) {
  const statement = db.prepare(sql);
  statement.bind(params || []);
  const rows = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}

function queryOne(sql, params) {
  return queryAll(sql, params)[0] || null;
}

async function runQuery(sql, params) {
  db.run(sql, params || []);
  await saveDatabase();
}

function dateText(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

async function addSampleData() {
  const account = await createPasswordHash('admin123');
  db.run('INSERT INTO staff (name, username, password_hash, salt) VALUES (?, ?, ?, ?)', ['Administrator', 'admin', account.hash, account.salt]);
  const trainers = [['Maya Rahman', 'Yoga and Pilates', '01711000001', 'maya@fithub.local'], ['Daniel Khan', 'HIIT and Boxing', '01711000002', 'daniel@fithub.local'], ['Nadia Islam', 'Spin and Cardio', '01711000003', 'nadia@fithub.local']];
  trainers.forEach(function (trainer) { db.run('INSERT INTO trainers (name, specialty, phone, email) VALUES (?, ?, ?, ?)', trainer); });
  const members = [['Amina Hasan', 'amina@example.com', '01712000001', 'Monthly', -20, 10, 1], ['Rafi Ahmed', 'rafi@example.com', '01712000002', 'Quarterly', -40, 50, 1], ['Sadia Noor', 'sadia@example.com', '01712000003', 'Monthly', -12, -1, 1], ['Imran Chowdhury', 'imran@example.com', '01712000004', 'Annual', -100, 260, 1], ['Tania Akter', 'tania@example.com', '01712000005', 'Monthly', -8, 22, 1], ['Fahim Rahman', 'fahim@example.com', '01712000006', 'Quarterly', -15, 70, 1], ['Nusrat Jahan', 'nusrat@example.com', '01712000007', 'Monthly', -40, -5, 1], ['Samiul Islam', 'samiul@example.com', '01712000008', 'Annual', -200, 160, 1], ['Mim Sultana', 'mim@example.com', '01712000009', 'Monthly', -5, 25, 1]];
  members.forEach(function (member) { db.run('INSERT INTO members (name, email, phone, membership_type, start_date, expiry_date, active) VALUES (?, ?, ?, ?, ?, ?, ?)', [member[0], member[1], member[2], member[3], dateText(member[4]), dateText(member[5]), member[6]]); });
  const classes = [['Morning Yoga', 'Yoga', 1, 1, '08:00', 60, 16], ['HIIT Express', 'HIIT', 2, 2, '18:00', 45, 12], ['Pilates Core', 'Pilates', 1, 3, '17:30', 60, 14], ['Evening Spin', 'Spin', 3, 4, '19:00', 45, 18], ['Boxing Basics', 'Boxing', 2, 5, '18:30', 60, 10], ['Power Yoga', 'Yoga', 1, 7, '09:00', 75, 16], ['HIIT Circuit', 'HIIT', 2, 9, '17:00', 60, 12], ['Weekend Spin', 'Spin', 3, 11, '10:00', 60, 18]];
  classes.forEach(function (item) { db.run('INSERT INTO classes (title, category, trainer_id, class_date, class_time, duration, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)', [item[0], item[1], item[2], dateText(item[3]), item[4], item[5], item[6]]); });
  const now = new Date().toISOString();
  [[1, 1, 'Booked', 0], [2, 1, 'Booked', 1], [4, 2, 'Booked', 0], [5, 3, 'Booked', 0], [6, 4, 'Cancelled', 0], [8, 5, 'Booked', 0]].forEach(function (booking) { db.run('INSERT INTO bookings (member_id, class_id, status, booked_at, cancellation_fee, attended) VALUES (?, ?, ?, ?, ?, ?)', [booking[0], booking[1], booking[2], now, booking[2] === 'Cancelled' ? 5 : 0, booking[3]]); });
  await saveDatabase();
}

async function resetDatabase() {
  db.close();
  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON');
  createTables();
  await addSampleData();
}
