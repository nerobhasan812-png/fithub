function reportRange(filters) {
  const clauses = [];
  const params = [];
  if (filters.start) { clauses.push('c.class_date >= ?'); params.push(filters.start); }
  if (filters.end) { clauses.push('c.class_date <= ?'); params.push(filters.end); }
  return { where: clauses.length ? ' WHERE ' + clauses.join(' AND ') : '', params: params };
}
function getReportData(filters) {
  const range = reportRange(filters || {});
  return {
    classes: queryAll('SELECT c.title AS name, COUNT(b.id) AS bookings, SUM(CASE WHEN b.attended = 1 THEN 1 ELSE 0 END) AS attendance FROM classes c LEFT JOIN bookings b ON b.class_id = c.id AND b.status = \'Booked\'' + range.where + ' GROUP BY c.id ORDER BY c.class_date', range.params),
    trainers: queryAll('SELECT t.name, COUNT(b.id) AS bookings, SUM(CASE WHEN b.attended = 1 THEN 1 ELSE 0 END) AS attendance FROM trainers t LEFT JOIN classes c ON c.trainer_id = t.id LEFT JOIN bookings b ON b.class_id = c.id AND b.status = \'Booked\'' + range.where + ' GROUP BY t.id ORDER BY t.name', range.params),
    members: queryAll('SELECT m.name, COUNT(b.id) AS bookings, SUM(CASE WHEN b.attended = 1 THEN 1 ELSE 0 END) AS attendance FROM members m LEFT JOIN bookings b ON b.member_id = m.id AND b.status = \'Booked\' LEFT JOIN classes c ON c.id = b.class_id' + range.where + ' GROUP BY m.id ORDER BY m.name', range.params),
    fees: queryOne('SELECT COALESCE(SUM(b.cancellation_fee), 0) AS total FROM bookings b JOIN classes c ON c.id = b.class_id' + range.where, range.params)
  };
}
function downloadCsv(name, rows) {
  const csv = rows.map(function (row) { return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
