async function renderTrainersPage() {
  const page = document.getElementById("page-content");
  page.innerHTML =
    '<div class="page-head"><h2>Trainers</h2></div><div class="toolbar"><input id="trainer-search" placeholder="Search trainers"></div><div id="trainer-table"></div>';
  async function draw() {
    const trainers = await getTrainers(
      document.getElementById("trainer-search").value,
    );
    document.getElementById("trainer-table").innerHTML = renderTable(
      ["Trainer", "Specialty", "Phone", "Email"],
      trainers.map(function (item) {
        return (
          "<tr><td>" +
          escapeText(item.name) +
          "</td><td>" +
          escapeText(item.specialty) +
          "</td><td>" +
          escapeText(item.phone) +
          "</td><td>" +
          escapeText(item.email) +
          "</td></tr>"
        );
      }),
      "No trainers match your search.",
    );
  }
  document.getElementById("trainer-search").oninput = draw;
  await draw();
}
