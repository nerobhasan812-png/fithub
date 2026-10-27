async function classForm(item) {
  const data = item || {
    class_date: todayText(),
    class_time: "09:00",
    duration: 60,
    capacity: 12,
  };
  const trainers = await getTrainers();
  openModal(
    data.id ? "Edit class" : "Add class",
    '<form id="class-form"><div class="form-grid">' +
      '<div class="form-field"><label>Title</label><input id="c-title" value="' +
      escapeText(data.title) +
      '"></div><div class="form-field"><label>Category</label><select id="c-category"><option value="">Choose category</option>' +
      ["Yoga", "HIIT", "Pilates", "Spin", "Boxing"]
        .map(function (category) {
          return (
            "<option " +
            (data.category === category ? "selected" : "") +
            ">" +
            category +
            "</option>"
          );
        })
        .join("") +
      '</select></div><div class="form-field"><label>Trainer</label><select id="c-trainer"><option value="">Choose trainer</option>' +
      trainers
        .map(function (trainer) {
          return (
            '<option value="' +
            trainer.id +
            '" ' +
            (data.trainer_id == trainer.id ? "selected" : "") +
            ">" +
            escapeText(trainer.name) +
            "</option>"
          );
        })
        .join("") +
      '</select></div><div class="form-field"><label>Date</label><input id="c-date" type="date" value="' +
      data.class_date +
      '"></div><div class="form-field"><label>Time</label><input id="c-time" type="time" value="' +
      data.class_time +
      '"></div><div class="form-field"><label>Duration in minutes</label><input id="c-duration" type="number" value="' +
      data.duration +
      '"></div><div class="form-field"><label>Capacity</label><input id="c-capacity" type="number" value="' +
      data.capacity +
      '"></div><div class="field-error" id="class-error"></div></div>' +
      '<div class="form-actions"><button type="button" class="button secondary" onclick="closeModal()">Cancel</button><button class="button">Save class</button></div></form>',
  );
  document.getElementById("class-form").onsubmit = async function (event) {
    event.preventDefault();
    const result = await saveClass(
      {
        title: document.getElementById("c-title").value,
        category: document.getElementById("c-category").value,
        trainer_id: Number(document.getElementById("c-trainer").value),
        class_date: document.getElementById("c-date").value,
        class_time: document.getElementById("c-time").value,
        duration: Number(document.getElementById("c-duration").value),
        capacity: Number(document.getElementById("c-capacity").value),
      },
      data.id,
    );
    if (result.error) return fieldError("class-error", result.error);
    closeModal();
    showToast(data.id ? "Class updated" : "Class added");
    renderClassesPage();
  };
}

async function openClass(id) {
  classForm(await getClass(id));
}
function deleteClass(id) {
  confirmAction("Delete this class?", async function () {
    const result = await removeClass(id);
    if (result.error) return showToast(result.error, "error");
    showToast("Class deleted");
    renderClassesPage();
  });
}

async function renderClassesPage() {
  const page = document.getElementById("page-content");
  page.innerHTML =
    '<div class="page-head"><h2>Classes</h2><button class="button" id="add-class">' +
    icon("plus") +
    ' Add class</button></div><div class="toolbar"><input id="class-search" placeholder="Search classes"><select id="class-category"><option value="">All categories</option><option>Yoga</option><option>HIIT</option><option>Pilates</option><option>Spin</option><option>Boxing</option></select><input id="class-date" type="date"></div><div id="class-table"></div>';
  async function draw() {
    const classes = await getClasses({
      search: document.getElementById("class-search").value,
      category: document.getElementById("class-category").value,
      date: document.getElementById("class-date").value,
    });
    const rows = classes.map(function (item) {
      return (
        "<tr><td><strong>" +
        escapeText(item.title) +
        "</strong><br><small>" +
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
        '</td><td><button class="icon-button" onclick="openClass(' +
        item.id +
        ')">' +
        icon("edit") +
        '</button><button class="icon-button" onclick="deleteClass(' +
        item.id +
        ')">' +
        icon("delete") +
        "</button></td></tr>"
      );
    });
    document.getElementById("class-table").innerHTML = renderTable(
      ["Class", "Trainer", "Date and time", "Duration", "Seats left", ""],
      rows,
      "No classes match your filters.",
    );
  }
  ["class-search", "class-category", "class-date"].forEach(function (id) {
    document.getElementById(id).oninput = draw;
    document.getElementById(id).onchange = draw;
  });
  document.getElementById("add-class").onclick = function () {
    classForm();
  };
  await draw();
}
