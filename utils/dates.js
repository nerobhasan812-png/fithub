function today(offset) {
  const date = new Date();
  date.setDate(date.getDate() + (offset || 0));
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}
function classStart(item) {
  return new Date(item.class_date + "T" + item.class_time + ":00");
}
function isDate(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(value + "T00:00:00").getTime())
  );
}
function isTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
module.exports = { today, classStart, isDate, isTime };
