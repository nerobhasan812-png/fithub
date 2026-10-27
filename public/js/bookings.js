async function getBookings(filters) {
  return api("/api/bookings?" + query(filters));
}
async function createBooking(memberId, classId) {
  return api("/api/bookings", "POST", { memberId: memberId, classId: classId });
}
async function cancelBooking(id) {
  return api("/api/bookings/" + id + "/cancel", "POST", {});
}
async function markAttendance(id) {
  return api("/api/bookings/" + id + "/attendance", "POST", {});
}
