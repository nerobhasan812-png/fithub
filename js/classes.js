function getClasses(filters) {
  filters = filters || {};
  let sql = 'SELECT c.*, t.name AS trainer_name, (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status = \'Booked\') AS booking_count FROM classes c JOIN trainers t ON t.id = c.trainer_id WHERE 1 = 1';
  const params = [];
  if (filters.search) { sql += ' AND (c.title LIKE ? OR t.name LIKE ?)'; const term = '%' + filters.search + '%'; params.push(term, term); }
  if (filters.category) { sql += ' AND c.category = ?'; params.push(filters.category); }
  if (filters.date) { sql += ' AND c.class_date = ?'; params.push(filters.date); }
  return queryAll(sql + ' ORDER BY c.class_date, c.class_time', params);
}
function getClass(id) { return queryOne('SELECT * FROM classes WHERE id = ?', [id]); }
function validateClass(data, id) {
  const errors = {};
  if (!data.title.trim()) errors.title = 'Class title is required';
  if (!data.category) errors.category = 'Choose a category';
  if (!data.trainer_id) errors.trainer_id = 'Choose a trainer';
  if (!data.class_date || !data.class_time) errors.class_date = 'Enter a valid date and time';
  if (!Number.isInteger(data.duration) || data.duration < 15 || data.duration > 240) errors.duration = 'Duration must be between 15 and 240 minutes';
  if (!Number.isInteger(data.capacity) || data.capacity < 1) errors.capacity = 'Capacity must be at least 1';
  const existing = id ? queryOne('SELECT COUNT(*) AS count FROM bookings WHERE class_id = ? AND status = ?', [id, 'Booked']) : { count: 0 };
  if (data.capacity < existing.count) errors.capacity = 'Capacity cannot be lower than current bookings';
  return errors;
}
async function saveClass(data, id) {
  const errors = validateClass(data, id);
  if (Object.keys(errors).length) return { errors: errors };
  const params = [data.title.trim(), data.category, Number(data.trainer_id), data.class_date, data.class_time, data.duration, data.capacity];
  if (id) await runQuery('UPDATE classes SET title = ?, category = ?, trainer_id = ?, class_date = ?, class_time = ?, duration = ?, capacity = ? WHERE id = ?', params.concat(id));
  else await runQuery('INSERT INTO classes (title, category, trainer_id, class_date, class_time, duration, capacity) VALUES (?, ?, ?, ?, ?, ?, ?)', params);
  return { success: true };
}
async function removeClass(id) {
  if (queryOne('SELECT id FROM bookings WHERE class_id = ? AND status = ?', [id, 'Booked'])) return { blocked: true };
  await runQuery('DELETE FROM classes WHERE id = ?', [id]);
  return { success: true };
}
