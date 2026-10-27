const express = require("express");
const { getDb } = require("../db");
const { requireLogin } = require("../middleware/auth");
const { today, classStart } = require("../utils/dates");

const router = express.Router();
const EARLY_FEE = 0;
const LATE_FEE = 5;
const PAST_FEE = 10;
const LATE_LIMIT_HOURS = 24;

router.use(requireLogin);

function checkMember(memberId) {
  return getDb().prepare("SELECT * FROM members WHERE id=?").get(memberId);
}

function checkClass(classId) {
  return getDb().prepare("SELECT * FROM classes WHERE id=?").get(classId);
}

function classIsFull(item) {
  const row = getDb()
    .prepare(
      "SELECT COUNT(*) total FROM bookings WHERE class_id=? AND status='Booked'",
    )
    .get(item.id);
  return row.total >= item.capacity;
}

function hasDuplicate(memberId, classId) {
  return getDb()
    .prepare(
      "SELECT id FROM bookings WHERE member_id=? AND class_id=? AND status='Booked'",
    )
    .get(memberId, classId);
}

function hasOverlap(memberId, item) {
  const sql =
    "SELECT c.* " +
    "FROM bookings b " +
    "JOIN classes c ON c.id=b.class_id " +
    "WHERE b.member_id=? AND b.status='Booked'";
  const bookings = getDb().prepare(sql).all(memberId);

  return bookings.some(function (row) {
    const bookedStart = classStart(row);
    const bookedEnd = new Date(bookedStart.getTime() + row.duration * 60000);
    const newStart = classStart(item);
    const newEnd = new Date(newStart.getTime() + item.duration * 60000);
    return newStart < bookedEnd && newEnd > bookedStart;
  });
}

function cancellationFee(item) {
  const hours = (classStart(item) - new Date()) / 3600000;
  if (hours < 0) return PAST_FEE;
  if (hours < LATE_LIMIT_HOURS) return LATE_FEE;
  return EARLY_FEE;
}

function bookingList(req) {
  let sql =
    "SELECT b.*, m.name member_name, c.title class_title, " +
    "c.class_date, c.class_time " +
    "FROM bookings b " +
    "JOIN members m ON m.id=b.member_id " +
    "JOIN classes c ON c.id=b.class_id " +
    "WHERE 1=1";
  const values = [];

  ["member_id", "class_id", "status"].forEach(function (key) {
    if (req.query[key]) {
      sql += " AND b." + key + "=?";
      values.push(req.query[key]);
    }
  });

  if (req.query.from) {
    sql += " AND c.class_date>=?";
    values.push(req.query.from);
  }

  if (req.query.to) {
    sql += " AND c.class_date<=?";
    values.push(req.query.to);
  }

  return getDb()
    .prepare(sql + " ORDER BY c.class_date DESC,c.class_time DESC")
    .all(...values);
}

function saveBooking(memberId, classId) {
  const old = getDb()
    .prepare("SELECT * FROM bookings WHERE member_id=? AND class_id=?")
    .get(memberId, classId);

  if (old) {
    getDb()
      .prepare(
        "UPDATE bookings SET status='Booked', booked_at=?, cancelled_at=NULL, " +
          "cancellation_fee=0, attended=0 WHERE id=?",
      )
      .run(new Date().toISOString(), old.id);
    return;
  }

  getDb()
    .prepare(
      "INSERT INTO bookings " +
        "(member_id,class_id,status,booked_at,cancellation_fee,attended) " +
        "VALUES (?,?,'Booked',?,0,0)",
    )
    .run(memberId, classId, new Date().toISOString());
}

router.get("/", function (req, res) {
  res.json(bookingList(req));
});

router.post("/", function (req, res) {
  const memberId = Number(req.body.memberId);
  const classId = Number(req.body.classId);
  const member = checkMember(memberId);
  const item = checkClass(classId);

  if (!member || !item) {
    return res.status(400).json({ error: "Choose a valid member and class" });
  }

  if (!member.active || member.expiry_date < today()) {
    return res.status(400).json({
      error: "This member does not have an active membership",
    });
  }

  if (classStart(item) < new Date()) {
    return res.status(400).json({ error: "This class is in the past" });
  }

  if (hasDuplicate(memberId, classId)) {
    return res.status(400).json({
      error: "This member is already booked into this class",
    });
  }

  if (classIsFull(item)) {
    return res.status(400).json({ error: "This class is full" });
  }

  if (hasOverlap(memberId, item)) {
    return res.status(400).json({
      error: "This member already has an overlapping class booking",
    });
  }

  saveBooking(memberId, classId);
  res.json({ success: true });
});

router.post("/:id/cancel", function (req, res) {
  const sql =
    "SELECT b.*, c.class_date, c.class_time " +
    "FROM bookings b " +
    "JOIN classes c ON c.id=b.class_id " +
    "WHERE b.id=?";
  const booking = getDb().prepare(sql).get(req.params.id);

  if (!booking || booking.status !== "Booked") {
    return res.status(400).json({
      error: "Only booked classes can be cancelled",
    });
  }

  const fee = cancellationFee(booking);
  getDb()
    .prepare(
      "UPDATE bookings SET status='Cancelled', cancelled_at=?, " +
        "cancellation_fee=? WHERE id=?",
    )
    .run(new Date().toISOString(), fee, booking.id);
  res.json({ success: true, fee: fee });
});

router.post("/:id/attendance", function (req, res) {
  const sql =
    "SELECT b.*, c.class_date " +
    "FROM bookings b " +
    "JOIN classes c ON c.id=b.class_id " +
    "WHERE b.id=?";
  const booking = getDb().prepare(sql).get(req.params.id);

  if (!booking || booking.status !== "Booked") {
    return res.status(400).json({
      error: "Only booked classes can have attendance marked",
    });
  }

  if (booking.class_date > today()) {
    return res.status(400).json({
      error: "Attendance can only be marked on or after the class date",
    });
  }

  getDb()
    .prepare("UPDATE bookings SET attended=? WHERE id=?")
    .run(booking.attended ? 0 : 1, booking.id);
  res.json({ success: true });
});

module.exports = router;
