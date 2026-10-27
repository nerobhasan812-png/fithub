function memberForm(member) {
  const item = member || {
    membership_type: "Monthly",
    start_date: todayText(),
    expiry_date: todayText(),
    active: 1,
  };
  const activeChecked = item.active ? "checked" : "";

  openModal(
    item.id ? "Edit member" : "Add member",
    '<form id="member-form">' +
      '<div class="form-grid">' +
      '<div class="form-field full"><label>Name</label>' +
      '<input id="m-name" value="' +
      escapeText(item.name) +
      '"><div class="field-error" id="member-error"></div></div>' +
      '<div class="form-field"><label>Email</label><input id="m-email" value="' +
      escapeText(item.email) +
      '"></div>' +
      '<div class="form-field"><label>Phone</label><input id="m-phone" value="' +
      escapeText(item.phone) +
      '"></div>' +
      '<div class="form-field"><label>Membership</label>' +
      '<select id="m-type">' +
      ["Monthly", "Quarterly", "Annual"]
        .map(function (type) {
          return (
            "<option " +
            (item.membership_type === type ? "selected" : "") +
            ">" +
            type +
            "</option>"
          );
        })
        .join("") +
      "</select></div>" +
      '<div class="form-field"><label>Start date</label><input id="m-start" type="date" value="' +
      item.start_date +
      '"></div><div class="form-field"><label>Expiry date</label>' +
      '<input id="m-expiry" type="date" value="' +
      item.expiry_date +
      '"></div>' +
      (item.id
        ? '<div class="form-field full"><label><input id="m-active" type="checkbox" ' +
          activeChecked +
          "> Membership active</label></div>"
        : "") +
      "</div>" +
      '<div class="form-actions"><button type="button" class="button secondary" onclick="closeModal()">Cancel</button>' +
      '<button class="button">Save member</button></div></form>',
  );

  document.getElementById("member-form").onsubmit = async function (event) {
    event.preventDefault();
    const data = {
      name: document.getElementById("m-name").value,
      email: document.getElementById("m-email").value,
      phone: document.getElementById("m-phone").value,
      membership_type: document.getElementById("m-type").value,
      start_date: document.getElementById("m-start").value,
      expiry_date: document.getElementById("m-expiry").value,
      active: item.id ? document.getElementById("m-active").checked : true,
    };
    const result = await saveMember(data, item.id);
    if (result.error) return fieldError("member-error", result.error);
    closeModal();
    showToast(item.id ? "Member updated" : "Member added");
    renderMembersPage();
  };
}

async function openMember(id) {
  memberForm(await getMember(id));
}

function deleteMember(id) {
  confirmAction("Delete this member?", async function () {
    const result = await removeMember(id);
    if (result.error) return showToast(result.error, "error");
    showToast("Member deleted");
    renderMembersPage();
  });
}

async function renderMembersPage() {
  const page = document.getElementById("page-content");
  page.innerHTML =
    '<div class="page-head"><h2>Members</h2><button class="button" id="add-member">' +
    icon("plus") +
    " Add member</button></div>" +
    '<div class="toolbar"><input id="member-search" placeholder="Search name, email or phone">' +
    '<select id="member-status"><option value="">All memberships</option>' +
    "<option>Active</option><option>Expired</option><option>Inactive</option></select></div>" +
    '<div id="member-table"></div>';

  async function draw() {
    const members = await getMembers(
      document.getElementById("member-search").value,
      document.getElementById("member-status").value,
    );
    const rows = members.map(function (item) {
      return (
        "<tr><td><strong>" +
        escapeText(item.name) +
        "</strong></td><td>" +
        escapeText(item.email) +
        "</td><td>" +
        escapeText(item.phone) +
        "</td><td>" +
        escapeText(item.membership_type) +
        "</td><td>" +
        item.expiry_date +
        "</td><td>" +
        statusBadge(memberStatus(item)) +
        '</td><td><button class="icon-button" onclick="openMember(' +
        item.id +
        ')" title="Edit">' +
        icon("edit") +
        '</button><button class="icon-button" onclick="deleteMember(' +
        item.id +
        ')" title="Delete">' +
        icon("delete") +
        "</button></td></tr>"
      );
    });
    document.getElementById("member-table").innerHTML = renderTable(
      ["Member", "Email", "Phone", "Membership", "Expires", "Status", ""],
      rows,
      "No members match your search.",
    );
  }

  document.getElementById("add-member").onclick = function () {
    memberForm();
  };
  document.getElementById("member-search").oninput = draw;
  document.getElementById("member-status").onchange = draw;
  await draw();
}
