function reportTable(title, rows) {
  return (
    '<section class="card"><h3>' +
    title +
    '</h3><div class="small-table">' +
    renderTable(
      ["Name", "Bookings", "Attendance", "Attendance rate"],
      rows.map(function (row) {
        return (
          "<tr><td>" +
          escapeText(row.name) +
          "</td><td>" +
          row.bookings +
          "</td><td>" +
          row.attendance +
          "</td><td>" +
          row.rate +
          "%</td></tr>"
        );
      }),
      "No report data.",
    ) +
    "</div></section>"
  );
}
async function renderReportsPage() {
  const page = document.getElementById("page-content");
  page.innerHTML =
    '<div class="page-head"><h2>Reports</h2><button class="button" id="export-report">Export to CSV</button></div><div class="toolbar"><input id="report-start" type="date"><input id="report-end" type="date"><button class="button secondary" id="report-filter">Apply dates</button></div><div id="report-results"></div>';
  async function draw() {
    const data = await getReportData({
      start: document.getElementById("report-start").value,
      end: document.getElementById("report-end").value,
    });
    document.getElementById("report-results").innerHTML =
      '<div class="stats" style="grid-template-columns:1fr"><div class="stat-card"><span>Cancellation fees collected</span><strong>$' +
      Number(data.fees.total).toFixed(2) +
      '</strong></div></div><div class="report-grid" style="margin-top:20px">' +
      reportTable("By class", data.classes) +
      reportTable("By trainer", data.trainers) +
      reportTable("By member", data.members) +
      '</div><section class="card" style="margin-top:20px"><h3>Cancelled bookings</h3>' +
      renderTable(
        ["Member", "Class", "Class date", "Cancelled at", "Fee"],
        data.cancelled.map(function (row) {
          return (
            "<tr><td>" +
            escapeText(row.member) +
            "</td><td>" +
            escapeText(row.class) +
            "</td><td>" +
            row.class_date +
            "</td><td>" +
            row.cancelled_at +
            "</td><td>$" +
            Number(row.fee).toFixed(2) +
            "</td></tr>"
          );
        }),
        "No cancelled bookings.",
      ) +
      "</section>";
    document.getElementById("export-report").onclick = function () {
      const rows = [
        ["Report", "Name", "Bookings", "Attendance", "Attendance rate"],
      ];
      [
        ["Class", data.classes],
        ["Trainer", data.trainers],
        ["Member", data.members],
      ].forEach(function (group) {
        group[1].forEach(function (row) {
          rows.push([
            group[0],
            row.name,
            row.bookings,
            row.attendance,
            row.rate + "%",
          ]);
        });
      });
      rows.push([]);
      rows.push([
        "Cancelled bookings",
        "Member",
        "Class",
        "Class date",
        "Cancelled at",
        "Fee",
      ]);
      data.cancelled.forEach(function (row) {
        rows.push([
          "Cancelled booking",
          row.member,
          row.class,
          row.class_date,
          row.cancelled_at,
          row.fee,
        ]);
      });
      rows.push(["Cancellation fee total", "", "", "", "", data.fees.total]);
      downloadCsv("fithub-report.csv", rows);
    };
  }
  document.getElementById("report-filter").onclick = draw;
  await draw();
}
