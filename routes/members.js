const express = require("express");
const { getDb } = require("../db");
const { requireLogin } = require("../middleware/auth");
const { member } = require("../utils/validate");
const { today } = require("../utils/dates");
const router = express.Router();
router.use(requireLogin);
function memberStatus(row) {
  return !row.active
    ? "Inactive"
    : row.expiry_date < today()
      ? "Expired"
      : "Active";
}
router.get("/", function (req, res) {
  const search = "%" + (req.query.search || "") + "%";
  const rows = getDb()
    .prepare(
      "SELECT * FROM members WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name",
    )
    .all(search, search, search)
    .filter(function (row) {
      return !req.query.status || memberStatus(row) === req.query.status;
    });
  res.json(rows);
});
router.post("/", save);
router.put("/:id", save);
function save(req, res) {
  const error = member(req.body);
  if (error) return res.status(400).json({ error });
  const data = req.body;
  try {
    if (req.params.id)
      getDb()
        .prepare(
          "UPDATE members SET name=?,email=?,phone=?,membership_type=?,start_date=?,expiry_date=?,active=? WHERE id=?",
        )
        .run(
          data.name.trim(),
          data.email.trim(),
          data.phone,
          data.membership_type,
          data.start_date,
          data.expiry_date,
          data.active ? 1 : 0,
          req.params.id,
        );
    else
      getDb()
        .prepare(
          "INSERT INTO members (name,email,phone,membership_type,start_date,expiry_date,active) VALUES (?,?,?,?,?,?,?)",
        )
        .run(
          data.name.trim(),
          data.email.trim(),
          data.phone,
          data.membership_type,
          data.start_date,
          data.expiry_date,
          data.active === false ? 0 : 1,
        );
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "This email is already in use" });
  }
}
router.delete("/:id", function (req, res) {
  if (
    getDb()
      .prepare("SELECT id FROM bookings WHERE member_id=?")
      .get(req.params.id)
  )
    return res.status(400).json({ error: "This member has bookings" });
  getDb().prepare("DELETE FROM members WHERE id=?").run(req.params.id);
  res.json({ success: true });
});
router.post("/:id/deactivate", function (req, res) {
  getDb().prepare("UPDATE members SET active=0 WHERE id=?").run(req.params.id);
  res.json({ success: true });
});
module.exports = router;
