async function getReportData(filters) {
  return api("/api/reports?" + query(filters));
}
function downloadCsv(name, rows) {
  const csv = rows
    .map(function (row) {
      return row
        .map(function (value) {
          return '"' + String(value).replace(/"/g, '""') + '"';
        })
        .join(",");
    })
    .join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}
