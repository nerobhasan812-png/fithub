const pageNames = {
  dashboard: "Dashboard",
  members: "Members",
  trainers: "Trainers",
  classes: "Classes",
  bookings: "Bookings",
  reports: "Reports",
  settings: "Settings",
};
function startApp() {
  const staff = currentStaff();
  if (!staff) return showLoginPage();
  document.getElementById("app").innerHTML =
    '<div class="app-shell"><aside class="sidebar" id="sidebar"><div class="brand"><span class="brand-mark">F</span>FitHub</div><nav class="side-nav">' +
    Object.keys(pageNames)
      .map(function (key) {
        return (
          '<button class="nav-item" data-page="' +
          key +
          '">' +
          icon(key) +
          " " +
          pageNames[key] +
          "</button>"
        );
      })
      .join("") +
    '<button class="nav-item" onclick="logout()">' +
    icon("logout") +
    ' Logout</button></nav></aside><main class="main"><header class="topbar"><button class="plain-button menu-toggle" id="menu-button">' +
    icon("menu") +
    '</button><h1 id="top-title">Dashboard</h1><span class="staff-name">' +
    escapeText(staff.name) +
    '</span></header><div class="page" id="page-content"></div></main></div>';
  document.querySelectorAll(".nav-item[data-page]").forEach(function (button) {
    button.onclick = function () {
      showPage(button.dataset.page);
    };
  });
  document.getElementById("menu-button").onclick = function () {
    document.getElementById("sidebar").classList.toggle("open");
  };
  showPage("dashboard");
}
async function showPage(name) {
  document.getElementById("top-title").textContent = pageNames[name];
  const pages = {
    dashboard: renderDashboardPage,
    members: renderMembersPage,
    trainers: renderTrainersPage,
    classes: renderClassesPage,
    bookings: renderBookingsPage,
    reports: renderReportsPage,
    settings: renderSettingsPage,
  };
  await pages[name]();
}
window.addEventListener("DOMContentLoaded", async function () {
  const result = await api("/api/me");
  if (result.staff) {
    sessionStorage.setItem("fithub_staff", JSON.stringify(result.staff));
    startApp();
  } else showLoginPage();
});
