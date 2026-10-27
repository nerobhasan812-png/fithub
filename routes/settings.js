const express = require("express");
const { getDb, hashPassword, replaceDatabase, databasePath } = require("../db");
const { requireLogin } = require("../middleware/auth");
const { staff } = require("../utils/validate");
const router = express.Router();
router.use(requireLogin);
router.get("/export", function (req, res) {
  res.download(databasePath, "fithub.sqlite");
});
router.get("/staff", function (req, res) {
  res.json(
    getDb().prepare("SELECT id,name,username FROM staff ORDER BY name").all(),
  );
});
router.post("/staff", save);
router.put("/staff/:id", save);
function save(req, res) {
  const error = staff(req.body, !req.params.id);
  if (error) return res.status(400).json({ error });
  const data = req.body;
  try {
    if (req.params.id) {
      const password = data.password ? hashPassword(data.password) : null;
      if (password)
        getDb()
          .prepare(
            "UPDATE staff SET name=?,username=?,password_hash=?,salt=? WHERE id=?",
          )
          .run(
            data.name.trim(),
            data.username.trim(),
            password.hash,
            password.salt,
            req.params.id,
          );
      else
        getDb()
          .prepare("UPDATE staff SET name=?,username=? WHERE id=?")
          .run(data.name.trim(), data.username.trim(), req.params.id);
    } else {
      const password = hashPassword(data.password);
      getDb()
        .prepare(
          "INSERT INTO staff (name,username,password_hash,salt) VALUES (?,?,?,?)",
        )
        .run(
          data.name.trim(),
          data.username.trim(),
          password.hash,
          password.salt,
        );
    }
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "That username is already in use" });
  }
}
router.delete("/staff/:id", function (req, res) {
  if (Number(req.params.id) === req.session.staff.id)
    return res
      .status(400)
      .json({ error: "You cannot delete your own staff account" });
  if (getDb().prepare("SELECT COUNT(*) total FROM staff").get().total <= 1)
    return res
      .status(400)
      .json({ error: "The last staff account cannot be deleted" });
  getDb().prepare("DELETE FROM staff WHERE id=?").run(req.params.id);
  res.json({ success: true });
});
router.post("/password", function (req, res) {
  const data = req.body || {};
  if (
    typeof data.old !== "string" ||
    typeof data.fresh !== "string" ||
    data.fresh.length < 8
  )
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  const current = getDb()
    .prepare("SELECT * FROM staff WHERE id=?")
    .get(req.session.staff.id);
  if (
    !current ||
    hashPassword(data.old, current.salt).hash !== current.password_hash
  )
    return res.status(400).json({ error: "Current password is incorrect" });
  const password = hashPassword(data.fresh);
  getDb()
    .prepare("UPDATE staff SET password_hash=?,salt=? WHERE id=?")
    .run(password.hash, password.salt, current.id);
  res.json({ success: true });
});
router.post("/import", function (req, res) {
  if (!req.body || typeof req.body.file !== "string")
    return res.status(400).json({ error: "Choose a SQLite file" });
  try {
    replaceDatabase(Buffer.from(req.body.file, "base64"));
    req.session.destroy(function () {
      res.json({ success: true });
    });
  } catch (e) {
    res
      .status(400)
      .json({ error: "The selected file is not a valid FitHub database" });
  }
});
module.exports = router;
