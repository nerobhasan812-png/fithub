const express = require("express");
const { getDb, hashPassword } = require("../db");
const { requireLogin } = require("../middleware/auth");
const router = express.Router();
const loginAttempts = new Map();

router.post("/login", function (req, res) {
  const username =
    typeof req.body.username === "string" ? req.body.username.trim() : "";
  const password =
    typeof req.body.password === "string" ? req.body.password : "";
  const attempt = loginAttempts.get(username);
  if (attempt && attempt.count >= 5 && Date.now() - attempt.time < 60000)
    return res
      .status(429)
      .json({ error: "Too many attempts. Try again in one minute." });
  const staff = getDb()
    .prepare("SELECT * FROM staff WHERE username=?")
    .get(username);
  if (
    !staff ||
    hashPassword(password, staff.salt).hash !== staff.password_hash
  ) {
    loginAttempts.set(username, {
      count:
        attempt && Date.now() - attempt.time < 60000 ? attempt.count + 1 : 1,
      time: Date.now(),
    });
    return res.status(401).json({ error: "Incorrect username or password" });
  }
  loginAttempts.delete(username);
  req.session.staff = {
    id: staff.id,
    name: staff.name,
    username: staff.username,
  };
  res.json({ ok: true, staff: req.session.staff });
});
router.get("/me", function (req, res) {
  if (!req.session.staff)
    return res.status(401).json({ error: "Login required" });
  res.json({ staff: req.session.staff });
});
router.post("/logout", function (req, res) {
  req.session.destroy(function () {
    res.json({ ok: true });
  });
});
router.use(requireLogin);
module.exports = router;
