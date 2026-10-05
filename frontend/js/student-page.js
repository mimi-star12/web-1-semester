// ищем параметры (после ? в адресной строке) 
const params = new URLSearchParams(window.location.search);
const isuFromUrl = params.get("isu");
const isEditMode = params.get("mode") === "edit";



// ищем элементы из html
const studentNotFound = document.querySelector("#student-not-found");
const studentView = document.querySelector("#student-view");
const studentEditForm = document.querySelector("#student-edit-form");
const editStudentLink = document.querySelector("#edit-student-link");
const cancelStudentEditButton = document.querySelector("#cancel-student-edit-button");
const dormitoryFields = document.querySelector("#edit-dormitory-fields");
const pageMessage = document.querySelector("#student-page-message");


const dormitoryCheckbox = studentEditForm.elements.livesInDormitory;
const settlementStartInput = studentEditForm.elements.settlementStart;
const settlementEndInput = studentEditForm.elements.settlementEnd;
const dormitoryInputs = dormitoryFields.querySelectorAll("input");

// форматируем дату в формате дд.мм.гггг
function formatDate(date) {
  if (!date) {
    return "—";
  }

  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

// заполняем режим просмотра
function fillStudentView(student) {
  document.querySelector("#student-full-name").textContent = student.fullName;
  document.querySelector("#student-group").textContent = student.group;
  document.querySelector("#student-isu-id").textContent = student.isuId;

  document.querySelector("#student-dormitory-number").textContent =
    student.livesInDormitory ? `Корпус ${student.dormitoryNumber}` : "Не проживает";

  document.querySelector("#student-room-number").textContent =
    student.livesInDormitory ? student.roomNumber : "—";

  document.querySelector("#student-settlement-start").textContent =
    student.livesInDormitory ? formatDate(student.settlementStart) : "—";

  document.querySelector("#student-settlement-end").textContent =
    student.livesInDormitory ? formatDate(student.settlementEnd) : "—";

  document.querySelector("#student-is-foreign").textContent =
    student.isForeign ? "Да" : "Нет";

  document.querySelector("#student-notes").textContent = student.notes || "—";
}

// заполняем режим редактирования
function fillStudentForm(student) {
  studentEditForm.elements.fullName.value = student.fullName;
  studentEditForm.elements.group.value = student.group;
  studentEditForm.elements.isuId.value = student.isuId;
  studentEditForm.elements.livesInDormitory.checked = student.livesInDormitory;
  studentEditForm.elements.dormitoryNumber.value = student.dormitoryNumber;
  studentEditForm.elements.roomNumber.value = student.roomNumber;
  studentEditForm.elements.settlementStart.value = student.settlementStart;
  studentEditForm.elements.settlementEnd.value = student.settlementEnd;
  studentEditForm.elements.isForeign.checked = student.isForeign;
  studentEditForm.elements.notes.value = student.notes;
}

// показываем или скрываем поля общежития
function updateDormitoryFields() {
  const livesInDormitory = dormitoryCheckbox.checked;

  dormitoryFields.hidden = !livesInDormitory;
  dormitoryFields.disabled = !livesInDormitory;

  dormitoryInputs.forEach((input) => {
    input.required = livesInDormitory;
  });
}

function updateSettlementEndMin() {
  settlementEndInput.min = settlementStartInput.value || "2020-01-01";
}

function showStudentNotFound() {
  studentNotFound.hidden = false;
  studentView.hidden = true;
  studentEditForm.hidden = true;
}

// режим редактирования или просмотра
function showSelectedMode(student) {
  studentNotFound.hidden = true;

  if (isEditMode) {
    studentView.hidden = true;
    studentEditForm.hidden = false;

    fillStudentForm(student);
    updateDormitoryFields();
    updateSettlementEndMin();
  } else {
    studentView.hidden = false;
    studentEditForm.hidden = true;
  }
}

dormitoryCheckbox.addEventListener("change", updateDormitoryFields);
settlementStartInput.addEventListener("change", updateSettlementEndMin);
cancelStudentEditButton.addEventListener("click", () => {
  window.location.href = `student.html?isu=${encodeURIComponent(isuFromUrl)}`;
});


studentEditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  pageMessage.textContent = "";

  const newIsuId = studentEditForm.elements.isuId.value.trim();
  const livesInDormitory = dormitoryCheckbox.checked;

  const updatedStudent = {
    fullName: studentEditForm.elements.fullName.value.trim(),
    group: studentEditForm.elements.group.value.trim(),
    isuId: newIsuId,
    livesInDormitory,

    dormitoryNumber: livesInDormitory
      ? studentEditForm.elements.dormitoryNumber.value.trim()
      : "",

    roomNumber: livesInDormitory
      ? studentEditForm.elements.roomNumber.value.trim()
      : "",

    settlementStart: livesInDormitory ? settlementStartInput.value : "",
    settlementEnd: livesInDormitory ? settlementEndInput.value : "",
    isForeign: studentEditForm.elements.isForeign.checked,
    notes: studentEditForm.elements.notes.value.trim()
  };

  try {
    const savedStudent = await updateStudent(isuFromUrl, updatedStudent);

    window.location.href =
      `student.html?isu=${encodeURIComponent(savedStudent.isuId)}`;
  } catch (error) {
    pageMessage.textContent =
      error.status
        ? error.message
        : "Не удалось сохранить изменения.";
  }
});

async function loadStudentPage() {
  studentView.hidden = true;
  studentEditForm.hidden = true;
  studentNotFound.hidden = true;
  pageMessage.textContent = "";

  if (!isuFromUrl) {
    showStudentNotFound();
    return;
  }

  pageMessage.textContent = "Загрузка студента…";

  try {
    const student = await getStudent(isuFromUrl);

    fillStudentView(student);

    editStudentLink.href =
      `student.html?isu=${encodeURIComponent(student.isuId)}&mode=edit`;

    showSelectedMode(student);
    pageMessage.textContent = "";
  } catch (error) {
    if (error.status === 404) {
      showStudentNotFound();
    }

    pageMessage.textContent =
      error.status
        ? error.message
        : "Не удалось загрузить данные студента.";
  }
}

loadStudentPage();
