function requireLogin(req, res, next) {
  if (!req.session.staff)
    return res.status(401).json({ error: "Login required" });
  next();
}
module.exports = { requireLogin };
