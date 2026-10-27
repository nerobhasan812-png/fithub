const { isDate, isTime } = require("./dates");
function text(value) {
  return typeof value === "string" ? value.trim() : "";
}
function email(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}
function phone(value) {
  return /^\d+$/.test(value || "");
}
function whole(value, min, max) {
  return (
    Number.isInteger(value) &&
    value >= min &&
    (max === undefined || value <= max)
  );
}
function member(data) {
  if (
    !data ||
    !text(data.name) ||
    !email(data.email) ||
    !phone(data.phone) ||
    !text(data.membership_type) ||
    !isDate(data.start_date) ||
    !isDate(data.expiry_date)
  )
    return "Enter valid member details";
  if (data.expiry_date < data.start_date)
    return "Expiry date cannot be before start date";
  return null;
}
function trainer(data) {
  return !data ||
    !text(data.name) ||
    !text(data.specialty) ||
    !phone(data.phone) ||
    !email(data.email)
    ? "Enter valid trainer details"
    : null;
}
function classData(data) {
  if (
    !data ||
    !text(data.title) ||
    !text(data.category) ||
    !whole(Number(data.trainer_id), 1) ||
    !isDate(data.class_date) ||
    !isTime(data.class_time)
  )
    return "Enter valid class details";
  if (!whole(data.duration, 15, 240))
    return "Duration must be between 15 and 240 minutes";
  return whole(data.capacity, 1)
    ? null
    : "Capacity must be a whole number of at least 1";
}
function staff(data, needsPassword) {
  if (!data || !text(data.name) || !text(data.username))
    return "Name and username are required";
  return (needsPassword || data.password) &&
    (typeof data.password !== "string" || data.password.length < 8)
    ? "Password must be at least 8 characters"
    : null;
}
module.exports = { text, member, trainer, classData, staff, whole };
