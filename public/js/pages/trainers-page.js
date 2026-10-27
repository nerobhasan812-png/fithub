function trainerForm(trainer) {
  const item = trainer || {};
  openModal(
    item.id ? "Edit trainer" : "Add trainer",
    '<form id="trainer-form"><div class="form-grid">' +
      '<div class="form-field"><label>Name</label><input id="t-name" value="' +
      escapeText(item.name) +
      '"></div><div class="form-field"><label>Specialty</label><input id="t-specialty" value="' +
      escapeText(item.specialty) +
      '"></div><div class="form-field"><label>Phone</label><input id="t-phone" value="' +
      escapeText(item.phone) +
      '"></div><div class="form-field"><label>Email</label><input id="t-email" value="' +
      escapeText(item.email) +
      '"></div><div class="field-error" id="trainer-error"></div></div>' +
      '<div class="form-actions"><button type="button" class="button secondary" onclick="closeModal()">Cancel</button><button class="button">Save trainer</button></div></form>',
  );
  document.getElementById("trainer-form").onsubmit = async function (event) {
    event.preventDefault();
    const result = await saveTrainer(
      {
        name: document.getElementById("t-name").value,
        specialty: document.getElementById("t-specialty").value,
        phone: document.getElementById("t-phone").value,
        email: document.getElementById("t-email").value,
      },
      item.id,
    );
    if (result.error) return fieldError("trainer-error", result.error);
    closeModal();
    showToast(item.id ? "Trainer updated" : "Trainer added");
    renderTrainersPage();
  };
}

async function openTrainer(id) {
  trainerForm(await getTrainer(id));
}
function deleteTrainer(id) {
  confirmAction("Delete this trainer?", async function () {
    const result = await removeTrainer(id);
    if (result.error) return showToast(result.error, "error");
    showToast("Trainer deleted");
    renderTrainersPage();
  });
}

async function renderTrainersPage() {
  const page = document.getElementById("page-content");
  page.innerHTML =
    '<div class="page-head"><h2>Trainers</h2><button class="button" id="add-trainer">' +
    icon("plus") +
    ' Add trainer</button></div><div class="toolbar"><input id="trainer-search" placeholder="Search trainers"></div><div id="trainer-table"></div>';
  async function draw() {
    const trainers = await getTrainers(
      document.getElementById("trainer-search").value,
    );
    const rows = trainers.map(function (item) {
      return (
        "<tr><td><strong>" +
        escapeText(item.name) +
        "</strong></td><td>" +
        escapeText(item.specialty) +
        "</td><td>" +
        escapeText(item.phone) +
        "</td><td>" +
        escapeText(item.email) +
        '</td><td><button class="icon-button" onclick="openTrainer(' +
        item.id +
        ')">' +
        icon("edit") +
        '</button><button class="icon-button" onclick="deleteTrainer(' +
        item.id +
        ')">' +
        icon("delete") +
        "</button></td></tr>"
      );
    });
    document.getElementById("trainer-table").innerHTML = renderTable(
      ["Trainer", "Specialty", "Phone", "Email", ""],
      rows,
      "No trainers match your search.",
    );
  }
  document.getElementById("add-trainer").onclick = function () {
    trainerForm();
  };
  document.getElementById("trainer-search").oninput = draw;
  await draw();
}
