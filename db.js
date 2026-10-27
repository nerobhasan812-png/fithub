const Database = require("better-sqlite3");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { today } = require("./utils/dates");

const dataFolder = path.join(__dirname, "data");
const databasePath = path.join(dataFolder, "fithub.sqlite");
fs.mkdirSync(dataFolder, { recursive: true });
let db = open(databasePath);

function open(file) {
  const connection = new Database(file);
  connection.pragma("foreign_keys = ON");
  return connection;
}

function getDb() {
  return db;
}

function hashPassword(password, salt) {
  const actualSalt = salt || crypto.randomBytes(16).toString("base64");
  return {
    salt: actualSalt,
    hash: crypto
      .pbkdf2Sync(
        password,
        Buffer.from(actualSalt, "base64"),
        150000,
        32,
        "sha256",
      )
      .toString("base64"),
  };
}

function createTables() {
  db.exec(
    "CREATE TABLE IF NOT EXISTS staff (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "name TEXT NOT NULL, username TEXT NOT NULL UNIQUE, " +
      "password_hash TEXT NOT NULL, salt TEXT NOT NULL" +
      ");" +
      "CREATE TABLE IF NOT EXISTS trainers (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "name TEXT NOT NULL, specialty TEXT NOT NULL, " +
      "phone TEXT NOT NULL, email TEXT NOT NULL" +
      ");" +
      "CREATE TABLE IF NOT EXISTS members (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, " +
      "phone TEXT NOT NULL, membership_type TEXT NOT NULL, " +
      "start_date TEXT NOT NULL, expiry_date TEXT NOT NULL, " +
      "active INTEGER NOT NULL DEFAULT 1" +
      ");" +
      "CREATE TABLE IF NOT EXISTS classes (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, " +
      "category TEXT NOT NULL, trainer_id INTEGER NOT NULL, " +
      "class_date TEXT NOT NULL, class_time TEXT NOT NULL, " +
      "duration INTEGER NOT NULL, capacity INTEGER NOT NULL CHECK(capacity > 0), " +
      "FOREIGN KEY(trainer_id) REFERENCES trainers(id)" +
      ");" +
      "CREATE TABLE IF NOT EXISTS bookings (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, member_id INTEGER NOT NULL, " +
      "class_id INTEGER NOT NULL, status TEXT NOT NULL " +
      "CHECK(status IN ('Booked','Cancelled')), booked_at TEXT NOT NULL, " +
      "cancelled_at TEXT, cancellation_fee REAL NOT NULL DEFAULT 0, " +
      "attended INTEGER NOT NULL DEFAULT 0, UNIQUE(member_id, class_id), " +
      "FOREIGN KEY(member_id) REFERENCES members(id), " +
      "FOREIGN KEY(class_id) REFERENCES classes(id)" +
      ");",
  );
}

function seedData() {
  if (db.prepare("SELECT id FROM staff LIMIT 1").get()) return;
  const account = hashPassword("admin123");
  db.prepare(
    "INSERT INTO staff (name,username,password_hash,salt) VALUES (?,?,?,?)",
  ).run("Administrator", "admin", account.hash, account.salt);
  const addTrainer = db.prepare(
    "INSERT INTO trainers (name,specialty,phone,email) VALUES (?,?,?,?)",
  );
  [
    ["Maya Rahman", "Yoga and Pilates", "01711000001", "maya@fithub.local"],
    ["Daniel Khan", "HIIT and Boxing", "01711000002", "daniel@fithub.local"],
    ["Nadia Islam", "Spin and Cardio", "01711000003", "nadia@fithub.local"],
  ].forEach(function (row) {
    addTrainer.run(...row);
  });
  const addMember = db.prepare(
    "INSERT INTO members " +
      "(name,email,phone,membership_type,start_date,expiry_date,active) " +
      "VALUES (?,?,?,?,?,?,?)",
  );
  [
    ["Amina Hasan", "amina@example.com", "01712000001", "Monthly", -20, 10, 1],
    ["Rafi Ahmed", "rafi@example.com", "01712000002", "Quarterly", -40, 50, 1],
    ["Sadia Noor", "sadia@example.com", "01712000003", "Monthly", -12, -1, 1],
    [
      "Imran Chowdhury",
      "imran@example.com",
      "01712000004",
      "Annual",
      -100,
      260,
      1,
    ],
    ["Tania Akter", "tania@example.com", "01712000005", "Monthly", -8, 22, 1],
    ["Fahim Rahman", "fahim@example.com", "01712000006", "Quarterly", -15, 70, 1],
    ["Nusrat Jahan", "nusrat@example.com", "01712000007", "Monthly", -40, -5, 1],
    ["Samiul Islam", "samiul@example.com", "01712000008", "Annual", -200, 160, 1],
    ["Mim Sultana", "mim@example.com", "01712000009", "Monthly", -5, 25, 0],
  ].forEach(function (row) {
    addMember.run(
      row[0],
      row[1],
      row[2],
      row[3],
      today(row[4]),
      today(row[5]),
      row[6],
    );
  });
  const addClass = db.prepare(
    "INSERT INTO classes (title,category,trainer_id,class_date,class_time,duration,capacity) VALUES (?,?,?,?,?,?,?)",
  );
  [
    ["Morning Yoga", "Yoga", 1, 1, "08:00", 60, 16],
    ["HIIT Express", "HIIT", 2, 2, "18:00", 45, 12],
    ["Pilates Core", "Pilates", 1, 3, "17:30", 60, 14],
    ["Evening Spin", "Spin", 3, 4, "19:00", 45, 18],
    ["Boxing Basics", "Boxing", 2, 5, "18:30", 60, 10],
    ["Power Yoga", "Yoga", 1, 7, "09:00", 75, 16],
    ["HIIT Circuit", "HIIT", 2, 9, "17:00", 60, 12],
    ["Weekend Spin", "Spin", 3, 11, "10:00", 60, 18],
  ].forEach(function (row) {
    addClass.run(row[0], row[1], row[2], today(row[3]), row[4], row[5], row[6]);
  });

  const addBooking = db.prepare(
    "INSERT INTO bookings " +
      "(member_id,class_id,status,booked_at,cancelled_at,cancellation_fee,attended) " +
      "VALUES (?,?,?,?,?,?,?)",
  );
  [
    [1, 1, "Booked", 0, 0],
    [2, 1, "Booked", 1, 1],
    [4, 2, "Booked", 0, 0],
    [5, 3, "Booked", 0, 0],
    [6, 4, "Cancelled", 5, 0],
    [8, 5, "Booked", 0, 0],
    [1, 6, "Cancelled", 5, 0],
    [2, 7, "Booked", 0, 0],
  ].forEach(function (row) {
    addBooking.run(
      row[0],
      row[1],
      row[2],
      new Date().toISOString(),
      row[2] === "Cancelled" ? new Date().toISOString() : null,
      row[3],
      row[4],
    );
  });
}

function replaceDatabase(buffer) {
  const temp = path.join(dataFolder, "import.sqlite");
  fs.writeFileSync(temp, buffer);
  let imported;
  try {
    imported = open(temp);
    const names = imported
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map(function (row) {
        return row.name;
      });
    if (
      !["staff", "trainers", "members", "classes", "bookings"].every(
        function (name) {
          return names.includes(name);
        },
      )
    )
      throw new Error("Invalid database");
    imported.close();
    imported = null;
    fs.copyFileSync(
      databasePath,
      path.join(dataFolder, "fithub-backup.sqlite"),
    );
    db.close();
    fs.copyFileSync(temp, databasePath);
    db = open(databasePath);
  } finally {
    if (imported) imported.close();
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

module.exports = {
  getDb,
  hashPassword,
  createTables,
  seedData,
  replaceDatabase,
  databasePath,
};
