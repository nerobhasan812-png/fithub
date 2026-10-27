const express = require("express");
const { getDb } = require("../db");
const { requireLogin } = require("../middleware/auth");
const { trainer } = require("../utils/validate");
const router = express.Router();
router.use(requireLogin);
router.get("/", function (req, res) {
  const term = "%" + (req.query.search || "") + "%";
  res.json(
    getDb()
      .prepare(
        "SELECT * FROM trainers WHERE name LIKE ? OR specialty LIKE ? OR email LIKE ? ORDER BY name",
      )
      .all(term, term, term),
  );
});
router.post("/", save);
router.put("/:id", save);
function save(req, res) {
  const error = trainer(req.body);
  if (error) return res.status(400).json({ error });
  const d = req.body;
  if (req.params.id)
    getDb()
      .prepare(
        "UPDATE trainers SET name=?,specialty=?,phone=?,email=? WHERE id=?",
      )
      .run(
        d.name.trim(),
        d.specialty.trim(),
        d.phone,
        d.email.trim(),
        req.params.id,
      );
  else
    getDb()
      .prepare(
        "INSERT INTO trainers (name,specialty,phone,email) VALUES (?,?,?,?)",
      )
      .run(d.name.trim(), d.specialty.trim(), d.phone, d.email.trim());
  res.json({ success: true });
}
router.delete("/:id", function (req, res) {
  if (
    getDb()
      .prepare("SELECT id FROM classes WHERE trainer_id=?")
      .get(req.params.id)
  )
    return res.status(400).json({ error: "This trainer has classes" });
  getDb().prepare("DELETE FROM trainers WHERE id=?").run(req.params.id);
  res.json({ success: true });
});
module.exports = router;
