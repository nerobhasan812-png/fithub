function getMembers(search, status) {
  let sql = 'SELECT * FROM members WHERE 1 = 1';
  const params = [];
  if (search) { sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)'; const term = '%' + search + '%'; params.push(term, term, term); }
  if (status === 'Active') { sql += ' AND active = 1 AND expiry_date >= ?'; params.push(todayText()); }
  if (status === 'Expired') { sql += ' AND (active = 0 OR expiry_date < ?)'; params.push(todayText()); }
  return queryAll(sql + ' ORDER BY name', params);
}

function getMember(id) { return queryOne('SELECT * FROM members WHERE id = ?', [id]); }

function memberStatus(member) { return member.active && member.expiry_date >= todayText() ? 'Active' : 'Expired'; }

function validateMember(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = 'Name is required';
  if (!validEmail(data.email)) errors.email = 'Enter a valid email address';
  if (!validPhone(data.phone)) errors.phone = 'Phone must contain digits only';
  if (!data.membership_type) errors.membership_type = 'Choose a membership type';
  if (!data.start_date || !data.expiry_date || data.expiry_date < data.start_date) errors.expiry_date = 'Enter valid membership dates';
  return errors;
}

async function saveMember(data, id) {
  const errors = validateMember(data);
  if (Object.keys(errors).length) return { errors: errors };
  try {
    if (id) await runQuery('UPDATE members SET name = ?, email = ?, phone = ?, membership_type = ?, start_date = ?, expiry_date = ?, active = ? WHERE id = ?', [data.name.trim(), data.email.trim(), data.phone.trim(), data.membership_type, data.start_date, data.expiry_date, data.active ? 1 : 0, id]);
    else await runQuery('INSERT INTO members (name, email, phone, membership_type, start_date, expiry_date, active) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.name.trim(), data.email.trim(), data.phone.trim(), data.membership_type, data.start_date, data.expiry_date, 1]);
    return { success: true };
  } catch (error) { return { errors: { email: 'This email address is already in use' } }; }
}

async function removeMember(id) {
  const booking = queryOne('SELECT id FROM bookings WHERE member_id = ?', [id]);
  if (booking) return { blocked: true };
  await runQuery('DELETE FROM members WHERE id = ?', [id]);
  return { success: true };
}

async function deactivateMember(id) { await runQuery('UPDATE members SET active = 0 WHERE id = ?', [id]); }
