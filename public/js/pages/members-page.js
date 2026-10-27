async function renderMembersPage() {
  const page = document.getElementById("page-content");
  page.innerHTML =
    '<div class="page-head"><h2>Members</h2></div><div class="toolbar"><input id="member-search" placeholder="Search name, email or phone"><select id="member-status"><option value="">All memberships</option><option>Active</option><option>Expired</option><option>Inactive</option></select></div><div id="member-table"></div>';
  async function draw() {
    const members = await getMembers(
      document.getElementById("member-search").value,
      document.getElementById("member-status").value,
    );
    document.getElementById("member-table").innerHTML = renderTable(
      ["Member", "Email", "Phone", "Membership", "Expires", "Status"],
      members.map(function (item) {
        return (
          "<tr><td>" +
          escapeText(item.name) +
          "</td><td>" +
          escapeText(item.email) +
          "</td><td>" +
          escapeText(item.phone) +
          "</td><td>" +
          escapeText(item.membership_type) +
          "</td><td>" +
          item.expiry_date +
          "</td><td>" +
          statusBadge(memberStatus(item)) +
          "</td></tr>"
        );
      }),
      "No members match your search.",
    );
  }
  document.getElementById("member-search").oninput = draw;
  document.getElementById("member-status").onchange = draw;
  await draw();
}
