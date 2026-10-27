async function renderSettingsPage() {
  const staff = await api("/api/settings/staff");
  document.getElementById("page-content").innerHTML =
    '<div class="page-head"><h2>Settings</h2></div><section class="card"><h3>Staff accounts</h3>' +
    renderTable(
      ["Name", "Username"],
      staff.map(function (item) {
        return (
          "<tr><td>" +
          escapeText(item.name) +
          "</td><td>" +
          escapeText(item.username) +
          "</td></tr>"
        );
      }),
      "No staff accounts found.",
    ) +
    '</section><section class="card" style="margin-top:20px"><h3>Database</h3><p>Download or replace the SQLite database file.</p><button class="button secondary" onclick="window.location.href=\'/api/settings/export\'">Export database</button> <input id="import-file" type="file" accept=".sqlite,application/x-sqlite3"></section>';
  document.getElementById("import-file").onchange = async function () {
    const file = this.files[0];
    if (!file) return;
    const base64 = await file.arrayBuffer();
    const bytes = new Uint8Array(base64);
    let text = "";
    bytes.forEach(function (byte) {
      text += String.fromCharCode(byte);
    });
    const result = await api("/api/settings/import", "POST", {
      file: btoa(text),
    });
    if (result.error) return showToast(result.error, "error");
    sessionStorage.removeItem("fithub_staff");
    showToast("Database imported. Please sign in again.");
    showLoginPage();
  };
}
