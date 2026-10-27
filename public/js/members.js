async function getMembers(search, status) {
  return api(
    "/api/members?" + query({ search: search || "", status: status || "" }),
  );
}
async function getMember(id) {
  return (await getMembers()).find(function (item) {
    return item.id === id;
  });
}
function memberStatus(member) {
  return !member.active
    ? "Inactive"
    : member.expiry_date < todayText()
      ? "Expired"
      : "Active";
}
async function saveMember(data, id) {
  return api("/api/members" + (id ? "/" + id : ""), id ? "PUT" : "POST", data);
}
async function removeMember(id) {
  return api("/api/members/" + id, "DELETE");
}
async function deactivateMember(id) {
  return api("/api/members/" + id + "/deactivate", "POST", {});
}
