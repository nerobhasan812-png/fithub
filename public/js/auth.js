async function login(username, password) {
  const result = await api("/api/login", "POST", {
    username: username,
    password: password,
  });
  if (!result.ok) return false;
  sessionStorage.setItem("fithub_staff", JSON.stringify(result.staff));
  return true;
}
function currentStaff() {
  const value = sessionStorage.getItem("fithub_staff");
  return value ? JSON.parse(value) : null;
}
async function logout() {
  await api("/api/logout", "POST", {});
  sessionStorage.removeItem("fithub_staff");
  showLoginPage();
}
