const FREE_CANCELLATION_HOURS = 24;
const LATE_CANCELLATION_FEE = 5;
const AFTER_START_FEE = 10;

function getBookings(filters) {
  filters = filters || {};
  let sql = 'SELECT b.*, m.name AS member_name, c.title AS class_title, c.class_date, c.class_time FROM bookings b JOIN members m ON m.id = b.member_id JOIN classes c ON c.id = b.class_id WHERE 1 = 1';
  const params = [];
  if (filters.member_id) { sql += ' AND b.member_id = ?'; params.push(filters.member_id); }
  if (filters.class_id) { sql += ' AND b.class_id = ?'; params.push(filters.class_id); }
  if (filters.status) { sql += ' AND b.status = ?'; params.push(filters.status); }
  return queryAll(sql + ' ORDER BY c.class_date DESC, c.class_time DESC', params);
}
function classStart(item) { return new Date(item.class_date + 'T' + item.class_time + ':00'); }
async function createBooking(memberId, classId) {
  const member = getMember(memberId);
  const fitnessClass = getClass(classId);
  if (!member || !fitnessClass) return { error: 'Choose a valid member and class' };
  if (!member.active || member.expiry_date < todayText()) return { error: 'This member does not have an active membership' };
  if (classStart(fitnessClass) < new Date()) return { error: 'This class is in the past' };
  const existing = queryOne('SELECT * FROM bookings WHERE member_id = ? AND class_id = ?', [memberId, classId]);
  if (existing && existing.status === 'Booked') return { error: 'This member is already booked into this class' };
  const count = queryOne('SELECT COUNT(*) AS total FROM bookings WHERE class_id = ? AND status = ?', [classId, 'Booked']);
  if (count.total >= fitnessClass.capacity) return { error: 'This class is full' };
  const overlaps = queryAll(`SELECT c.* FROM bookings b JOIN classes c ON c.id = b.class_id WHERE b.member_id = ? AND b.status = 'Booked'`, [memberId]).some(function (item) { const start = classStart(item); const end = new Date(start.getTime() + item.duration * 60000); const newStart = classStart(fitnessClass); const newEnd = new Date(newStart.getTime() + fitnessClass.duration * 60000); return newStart < end && newEnd > start; });
  if (overlaps) return { error: 'This member already has an overlapping class booking' };
  if (existing) await runQuery('UPDATE bookings SET status = ?, booked_at = ?, cancelled_at = NULL, cancellation_fee = 0, attended = 0 WHERE id = ?', ['Booked', new Date().toISOString(), existing.id]);
  else await runQuery('INSERT INTO bookings (member_id, class_id, status, booked_at, cancellation_fee, attended) VALUES (?, ?, ?, ?, ?, ?)', [memberId, classId, 'Booked', new Date().toISOString(), 0, 0]);
  return { success: true };
}
async function cancelBooking(id) {
  const booking = queryOne('SELECT b.*, c.class_date, c.class_time FROM bookings b JOIN classes c ON c.id = b.class_id WHERE b.id = ?', [id]);
  if (!booking || booking.status !== 'Booked') return { error: 'Only booked classes can be cancelled' };
  const difference = (classStart(booking) - new Date()) / 3600000;
  const fee = difference < 0 ? AFTER_START_FEE : difference < FREE_CANCELLATION_HOURS ? LATE_CANCELLATION_FEE : 0;
  await runQuery('UPDATE bookings SET status = ?, cancelled_at = ?, cancellation_fee = ? WHERE id = ?', ['Cancelled', new Date().toISOString(), fee, id]);
  return { success: true, fee: fee };
}
async function markAttendance(id) {
  const booking = queryOne('SELECT b.*, c.class_date FROM bookings b JOIN classes c ON c.id = b.class_id WHERE b.id = ?', [id]);
  if (!booking || booking.status !== 'Booked') return { error: 'Only booked classes can have attendance marked' };
  if (booking.class_date > todayText()) return { error: 'Attendance can only be marked on or after the class date' };
  await runQuery('UPDATE bookings SET attended = 1 WHERE id = ?', [id]);
  return { success: true };
}
