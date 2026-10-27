async function api(path, method, body) {
  const options = { method: method || "GET", headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    result = { error: "Invalid server response" };
  }
  if (response.status === 401) {
    sessionStorage.removeItem("fithub_staff");
    showLoginPage();
  }
  return result;
}
function query(values) {
  return new URLSearchParams(
    Object.entries(values || {}).filter(function (entry) {
      return entry[1] !== "";
    }),
  ).toString();
}
