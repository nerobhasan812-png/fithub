const express = require("express");
const session = require("express-session");
const path = require("path");
const { createTables, seedData } = require("./db");

const app = express();
createTables();
seedData();
app.use(express.json({ limit: "20mb" }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fithub-local-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax" },
  }),
);
app.use("/api", require("./routes/auth"));
app.use("/api/members", require("./routes/members"));
app.use("/api/trainers", require("./routes/trainers"));
app.use("/api/classes", require("./routes/classes"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/settings", require("./routes/settings"));
app.use(express.static(path.join(__dirname, "public")));
app.use(function (err, req, res, next) {
  if (res.headersSent) return next(err);
  res.status(400).json({ error: "Invalid request" });
});
app.listen(3030, function () {
  console.log("FitHub is running at http://localhost:3030");
});
