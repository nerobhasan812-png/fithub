let staffRows = [];

function staffForm(staff) {
  const item = staff || {};
  const passwordLabel = item.id
    ? "New password, leave blank to keep it"
    : "Password";

  openModal(
    item.id ? "Edit staff account" : "Add staff account",
    '<form id="staff-form"><div class="form-grid">' +
      '<div class="form-field"><label>Name</label><input id="staff-name" value="' +
      escapeText(item.name) +
      '"></div><div class="form-field"><label>Username</label><input id="staff-user" value="' +
      escapeText(item.username) +
      '"></div><div class="form-field full"><label>' +
      passwordLabel +
      '</label><input id="staff-password" type="password"><div class="field-error" id="staff-error"></div></div>' +
      '</div><div class="form-actions">' +
      '<button type="button" class="button secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="button">Save staff account</button></div></form>',
  );

  document.getElementById("staff-form").onsubmit = async function (event) {
    event.preventDefault();
    const data = {
      name: document.getElementById("staff-name").value.trim(),
      username: document.getElementById("staff-user").value.trim(),
      password: document.getElementById("staff-password").value,
    };
    const result = await api(
      "/api/settings/staff" + (item.id ? "/" + item.id : ""),
      item.id ? "PUT" : "POST",
      data,
    );
    if (result.error) return fieldError("staff-error", result.error);
    closeModal();
    showToast(item.id ? "Staff account updated" : "Staff account added");
    renderSettingsPage();
  };
}

function editStaff(id) {
  staffForm(
    staffRows.find(function (item) {
      return item.id === id;
    }),
  );
}

function deleteStaff(id) {
  confirmAction("Delete this staff account?", async function () {
    const result = await api("/api/settings/staff/" + id, "DELETE");
    if (result.error) return showToast(result.error, "error");
    showToast("Staff account deleted");
    renderSettingsPage();
  });
}

async function renderSettingsPage() {
  staffRows = await api("/api/settings/staff");
  document.getElementById("page-content").innerHTML =
    '<div class="page-head"><h2>Settings</h2><button class="button" id="add-staff">' +
    icon("plus") +
    " Add staff account</button></div>" +
    '<section class="card"><h3>Staff accounts</h3>' +
    renderTable(
      ["Name", "Username", ""],
      staffRows.map(function (item) {
        return (
          "<tr><td>" +
          escapeText(item.name) +
          "</td><td>" +
          escapeText(item.username) +
          '</td><td><button class="icon-button" onclick="editStaff(' +
          item.id +
          ')" title="Edit">' +
          icon("edit") +
          '</button><button class="icon-button" onclick="deleteStaff(' +
          item.id +
          ')" title="Delete">' +
          icon("delete") +
          "</button></td></tr>"
        );
      }),
      "No staff accounts found.",
    ) +
    "</section>";

  document.getElementById("add-staff").onclick = function () {
    staffForm();
  };
}
