async function getClasses(filters) {
  return api("/api/classes?" + query(filters));
}
async function getClass(id) {
  return (await getClasses()).find(function (item) {
    return item.id === id;
  });
}
async function saveClass(data, id) {
  return api("/api/classes" + (id ? "/" + id : ""), id ? "PUT" : "POST", data);
}
async function removeClass(id) {
  return api("/api/classes/" + id, "DELETE");
}
