async function getTrainers(search) {
  return api("/api/trainers?" + query({ search: search || "" }));
}
async function getTrainer(id) {
  return (await getTrainers()).find(function (item) {
    return item.id === id;
  });
}
async function saveTrainer(data, id) {
  return api("/api/trainers" + (id ? "/" + id : ""), id ? "PUT" : "POST", data);
}
async function removeTrainer(id) {
  return api("/api/trainers/" + id, "DELETE");
}
