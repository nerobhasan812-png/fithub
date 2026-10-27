function getTrainers(search) {
  const term = '%' + (search || '') + '%';
  return queryAll('SELECT * FROM trainers WHERE name LIKE ? OR specialty LIKE ? OR email LIKE ? ORDER BY name', [term, term, term]);
}
function getTrainer(id) { return queryOne('SELECT * FROM trainers WHERE id = ?', [id]); }
function validateTrainer(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.specialty.trim()) errors.specialty = 'Specialty is required';
  if (!validPhone(data.phone)) errors.phone = 'Phone must contain digits only';
  if (!validEmail(data.email)) errors.email = 'Enter a valid email address';
  return errors;
}
async function saveTrainer(data, id) {
  const errors = validateTrainer(data);
  if (Object.keys(errors).length) return { errors: errors };
  if (id) await runQuery('UPDATE trainers SET name = ?, specialty = ?, phone = ?, email = ? WHERE id = ?', [data.name.trim(), data.specialty.trim(), data.phone.trim(), data.email.trim(), id]);
  else await runQuery('INSERT INTO trainers (name, specialty, phone, email) VALUES (?, ?, ?, ?)', [data.name.trim(), data.specialty.trim(), data.phone.trim(), data.email.trim()]);
  return { success: true };
}
async function removeTrainer(id) {
  if (queryOne('SELECT id FROM classes WHERE trainer_id = ?', [id])) return { blocked: true };
  await runQuery('DELETE FROM trainers WHERE id = ?', [id]);
  return { success: true };
}
