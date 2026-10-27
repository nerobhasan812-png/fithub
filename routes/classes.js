const express = require("express");
const { getDb } = require("../db");
const { requireLogin } = require("../middleware/auth");
const { classData } = require("../utils/validate");
const { today, classStart } = require("../utils/dates");
const router = express.Router();
router.use(requireLogin);
function list() {
  return getDb()
    .prepare(
      "SELECT c.*,t.name trainer_name,(SELECT COUNT(*) FROM bookings b WHERE b.class_id=c.id AND b.status='Booked') booking_count FROM classes c JOIN trainers t ON t.id=c.trainer_id ORDER BY c.class_date,c.class_time",
    )
    .all();
}
router.get("/", function (req, res) {
  const q = req.query;
  res.json(
    list().filter(function (row) {
      return (
        (!q.search ||
          row.title.toLowerCase().includes(q.search.toLowerCase()) ||
          row.trainer_name.toLowerCase().includes(q.search.toLowerCase())) &&
        (!q.category || row.category === q.category) &&
        (!q.date || row.class_date === q.date)
      );
    }),
  );
});
router.post("/", save);
router.put("/:id", save);
function save(req, res) {
  const error = classData(req.body);
  if (error) return res.status(400).json({ error });
  const d = req.body;
  const id = req.params.id;
  if (!getDb().prepare("SELECT id FROM trainers WHERE id=?").get(d.trainer_id))
    return res.status(400).json({ error: "Choose a valid trainer" });
  if (!id && d.class_date < today())
    return res.status(400).json({ error: "New classes cannot be in the past" });
  const booked = id
    ? getDb()
        .prepare(
          "SELECT COUNT(*) total FROM bookings WHERE class_id=? AND status='Booked'",
        )
        .get(id).total
    : 0;
  if (d.capacity < booked)
    return res
      .status(400)
      .json({ error: "Capacity cannot be lower than current bookings" });
  const start = classStart(d);
  const end = new Date(start.getTime() + d.duration * 60000);
  const overlap = getDb()
    .prepare("SELECT * FROM classes WHERE trainer_id=?")
    .all(d.trainer_id)
    .some(function (row) {
      return (
        String(row.id) !== String(id) &&
        start < new Date(classStart(row).getTime() + row.duration * 60000) &&
        end > classStart(row)
      );
    });
  if (overlap)
    return res
      .status(400)
      .json({ error: "This trainer already has a class at this time" });
  if (id)
    getDb()
      .prepare(
        "UPDATE classes SET title=?,category=?,trainer_id=?,class_date=?,class_time=?,duration=?,capacity=? WHERE id=?",
      )
      .run(
        d.title.trim(),
        d.category.trim(),
        d.trainer_id,
        d.class_date,
        d.class_time,
        d.duration,
        d.capacity,
        id,
      );
  else
    getDb()
      .prepare(
        "INSERT INTO classes (title,category,trainer_id,class_date,class_time,duration,capacity) VALUES (?,?,?,?,?,?,?)",
      )
      .run(
        d.title.trim(),
        d.category.trim(),
        d.trainer_id,
        d.class_date,
        d.class_time,
        d.duration,
        d.capacity,
      );
  res.json({ success: true });
}
router.delete("/:id", function (req, res) {
  if (
    getDb()
      .prepare("SELECT id FROM bookings WHERE class_id=? AND status='Booked'")
      .get(req.params.id)
  )
    return res.status(400).json({ error: "This class has active bookings" });
  getDb().prepare("DELETE FROM classes WHERE id=?").run(req.params.id);
  res.json({ success: true });
});
module.exports = router;
