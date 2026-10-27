async function renderDashboardPage() {
  const data = await api("/api/reports/dashboard");
  const max = Math.max.apply(
    null,
    data.categories
      .map(function (item) {
        return item.total;
      })
      .concat(1),
  );
  document.getElementById("page-content").innerHTML =
    '<div class="page-head"><h2>Dashboard</h2></div><div class="stats"><div class="stat-card"><span>Active members</span><strong>' +
    data.members +
    '</strong></div><div class="stat-card"><span>Upcoming classes</span><strong>' +
    data.classes +
    '</strong></div><div class="stat-card"><span>Active bookings</span><strong>' +
    data.bookings +
    '</strong></div><div class="stat-card"><span>Fees collected</span><strong>$' +
    Number(data.fees).toFixed(2) +
    '</strong></div></div><div class="dashboard-grid"><section class="card"><h3>Upcoming classes</h3>' +
    renderTable(
      ["Class", "Trainer", "Date", "Seats left"],
      data.upcoming.map(function (item) {
        return (
          "<tr><td>" +
          escapeText(item.title) +
          "</td><td>" +
          escapeText(item.trainer_name) +
          "</td><td>" +
          item.class_date +
          " " +
          item.class_time +
          "</td><td>" +
          (item.capacity - item.booking_count) +
          " / " +
          item.capacity +
          "</td></tr>"
        );
      }),
      "No upcoming classes.",
    ) +
    '</section><section class="card"><h3>Bookings by category</h3><div class="chart">' +
    data.categories
      .map(function (item) {
        return (
          '<div class="bar-group"><div class="bar" style="height:' +
          (item.total / max) * 170 +
          'px"></div>' +
          escapeText(item.category) +
          "<br><strong>" +
          item.total +
          "</strong></div>"
        );
      })
      .join("") +
    "</div></section></div>";
}
