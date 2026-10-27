const express = require("express");
const { getDb } = require("../db");
const { requireLogin } = require("../middleware/auth");
const { today } = require("../utils/dates");
const router = express.Router();
router.use(requireLogin);
function range(query) {
  let sql = "";
  const values = [];
  if (query.start) {
    sql += " AND c.class_date>=?";
    values.push(query.start);
  }
  if (query.end) {
    sql += " AND c.class_date<=?";
    values.push(query.end);
  }
  return { sql, values };
}
function rate(row) {
  return row.bookings ? Math.round((row.attendance * 100) / row.bookings) : 0;
}
router.get("/dashboard", function (req, res) {
  const db = getDb();
  const classes = db
    .prepare(
      "SELECT c.*,t.name trainer_name,(SELECT COUNT(*) FROM bookings b WHERE b.class_id=c.id AND b.status='Booked') booking_count FROM classes c JOIN trainers t ON t.id=c.trainer_id ORDER BY c.class_date,c.class_time",
    )
    .all();
  res.json({
    members: db
      .prepare(
        "SELECT COUNT(*) total FROM members WHERE active=1 AND expiry_date>=?",
      )
      .get(today()).total,
    classes: classes.filter(function (row) {
      return row.class_date >= today();
    }).length,
    bookings: db
      .prepare("SELECT COUNT(*) total FROM bookings WHERE status='Booked'")
      .get().total,
    fees: db
      .prepare("SELECT COALESCE(SUM(cancellation_fee),0) total FROM bookings")
      .get().total,
    upcoming: classes
      .filter(function (row) {
        return row.class_date >= today();
      })
      .slice(0, 6),
    categories: db
      .prepare(
        "SELECT c.category,COUNT(b.id) total FROM classes c LEFT JOIN bookings b ON b.class_id=c.id AND b.status='Booked' GROUP BY c.category",
      )
      .all(),
  });
});
router.get("/", function (req, res) {
  const db = getDb();
  const r = range(req.query);
  const classes = db
    .prepare(
      "SELECT c.title name,COUNT(b.id) bookings,COALESCE(SUM(CASE WHEN b.attended=1 THEN 1 ELSE 0 END),0) attendance FROM classes c LEFT JOIN bookings b ON b.class_id=c.id AND b.status='Booked' WHERE 1=1" +
        r.sql +
        " GROUP BY c.id ORDER BY c.class_date",
    )
    .all(...r.values);
  const trainers = db
    .prepare(
      "SELECT t.name,COUNT(b.id) bookings,COALESCE(SUM(CASE WHEN b.attended=1 THEN 1 ELSE 0 END),0) attendance FROM trainers t LEFT JOIN classes c ON c.trainer_id=t.id LEFT JOIN bookings b ON b.class_id=c.id AND b.status='Booked' WHERE 1=1" +
        r.sql +
        " GROUP BY t.id ORDER BY t.name",
    )
    .all(...r.values);
  const members = db
    .prepare(
      "SELECT m.name,COUNT(b.id) bookings,COALESCE(SUM(CASE WHEN b.attended=1 THEN 1 ELSE 0 END),0) attendance FROM members m LEFT JOIN bookings b ON b.member_id=m.id AND b.status='Booked' LEFT JOIN classes c ON c.id=b.class_id WHERE 1=1" +
        r.sql +
        " GROUP BY m.id ORDER BY m.name",
    )
    .all(...r.values);
  [classes, trainers, members].forEach(function (rows) {
    rows.forEach(function (row) {
      row.rate = rate(row);
    });
  });
  const cancelled = db
    .prepare(
      "SELECT m.name member,c.title class,c.class_date,b.cancelled_at,b.cancellation_fee fee FROM bookings b JOIN members m ON m.id=b.member_id JOIN classes c ON c.id=b.class_id WHERE b.status='Cancelled'" +
        r.sql +
        " ORDER BY c.class_date",
    )
    .all(...r.values);
  const fees = cancelled.reduce(function (total, row) {
    return total + row.fee;
  }, 0);
  res.json({ classes, trainers, members, cancelled, fees: { total: fees } });
});
module.exports = router;
