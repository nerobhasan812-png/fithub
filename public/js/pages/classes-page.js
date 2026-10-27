async function renderClassesPage() {
  const page = document.getElementById("page-content");
  page.innerHTML =
    '<div class="page-head"><h2>Classes</h2></div><div class="toolbar"><input id="class-search" placeholder="Search classes"><select id="class-category"><option value="">All categories</option><option>Yoga</option><option>HIIT</option><option>Pilates</option><option>Spin</option><option>Boxing</option></select><input id="class-date" type="date"></div><div id="class-table"></div>';
  async function draw() {
    const classes = await getClasses({
      search: document.getElementById("class-search").value,
      category: document.getElementById("class-category").value,
      date: document.getElementById("class-date").value,
    });
    document.getElementById("class-table").innerHTML = renderTable(
      ["Class", "Trainer", "Date and time", "Duration", "Seats left"],
      classes.map(function (item) {
        return (
          "<tr><td>" +
          escapeText(item.title) +
          "<br><small>" +
          escapeText(item.category) +
          "</small></td><td>" +
          escapeText(item.trainer_name) +
          "</td><td>" +
          item.class_date +
          "<br>" +
          item.class_time +
          "</td><td>" +
          item.duration +
          " min</td><td>" +
          (item.capacity - item.booking_count) +
          " / " +
          item.capacity +
          "</td></tr>"
        );
      }),
      "No classes match your filters.",
    );
  }
  ["class-search", "class-category", "class-date"].forEach(function (id) {
    document.getElementById(id).oninput = draw;
    document.getElementById(id).onchange = draw;
  });
  await draw();
}
