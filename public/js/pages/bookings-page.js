async function renderBookingsPage() {
  const page = document.getElementById("page-content");
  const members = await getMembers();
  const classes = await getClasses();
  page.innerHTML =
    '<div class="page-head"><h2>Bookings</h2><button class="button" id="add-booking">' +
    icon("plus") +
    ' Create booking</button></div><div class="toolbar"><select id="booking-member"><option value="">All members</option>' +
    members
      .map(function (item) {
        return (
          '<option value="' +
          item.id +
          '">' +
          escapeText(item.name) +
          "</option>"
        );
      })
      .join("") +
    '</select><select id="booking-class"><option value="">All classes</option>' +
    classes
      .map(function (item) {
        return (
          '<option value="' +
          item.id +
          '">' +
          escapeText(item.title) +
          "</option>"
        );
      })
      .join("") +
    '</select><select id="booking-status"><option value="">All statuses</option><option>Booked</option><option>Cancelled</option></select><input id="booking-from" type="date"><input id="booking-to" type="date"></div><div id="booking-table"></div>';
  async function draw() {
    const rows = await getBookings({
      member_id: document.getElementById("booking-member").value,
      class_id: document.getElementById("booking-class").value,
      status: document.getElementById("booking-status").value,
      from: document.getElementById("booking-from").value,
      to: document.getElementById("booking-to").value,
    });
    document.getElementById("booking-table").innerHTML = renderTable(
      ["Member", "Class", "Status", "Fee", "Attendance", ""],
      rows.map(function (item) {
        return (
          "<tr><td>" +
          escapeText(item.member_name) +
          "</td><td>" +
          escapeText(item.class_title) +
          "<br><small>" +
          item.class_date +
          " " +
          item.class_time +
          "</small></td><td>" +
          statusBadge(item.status) +
          "</td><td>$" +
          Number(item.cancellation_fee).toFixed(2) +
          "</td><td>" +
          (item.attended ? "Present" : "Absent") +
          "</td><td>" +
          (item.status === "Booked"
            ? '<button class="icon-button" onclick="cancelOne(' +
              item.id +
              ')">Cancel</button><button class="icon-button" onclick="attendanceOne(' +
              item.id +
              ')">Toggle attendance</button>'
            : "") +
          "</td></tr>"
        );
      }),
      "No bookings match your filters.",
    );
  }
  window.cancelOne = async function (id) {
    const result = await cancelBooking(id);
    showToast(
      result.error || "Booking cancelled",
      result.error ? "error" : "success",
    );
    await draw();
  };
  window.attendanceOne = async function (id) {
    const result = await markAttendance(id);
    showToast(
      result.error || "Attendance updated",
      result.error ? "error" : "success",
    );
    await draw();
  };
  [
    "booking-member",
    "booking-class",
    "booking-status",
    "booking-from",
    "booking-to",
  ].forEach(function (id) {
    document.getElementById(id).onchange = draw;
  });
  document.getElementById("add-booking").onclick = async function () {
    const active = await getMembers("", "Active");
    const available = await getClasses();
    openModal(
      "Create booking",
      '<form id="booking-form"><div class="form-field"><label>Member</label><select id="b-member">' +
        active
          .map(function (item) {
            return (
              '<option value="' +
              item.id +
              '">' +
              escapeText(item.name) +
              "</option>"
            );
          })
          .join("") +
        '</select></div><div class="form-field"><label>Class</label><select id="b-class">' +
        available
          .map(function (item) {
            return (
              '<option value="' +
              item.id +
              '">' +
              escapeText(item.title) +
              "</option>"
            );
          })
          .join("") +
        '</select></div><div class="field-error" id="booking-error"></div><button class="button">Create booking</button></form>',
    );
    document.getElementById("booking-form").onsubmit = async function (event) {
      event.preventDefault();
      const result = await createBooking(
        Number(document.getElementById("b-member").value),
        Number(document.getElementById("b-class").value),
      );
      if (result.error) return fieldError("booking-error", result.error);
      closeModal();
      await draw();
    };
  };
  await draw();
}
