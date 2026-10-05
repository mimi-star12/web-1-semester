const tableBody = document.querySelector("#students-table-body");
const studentForm = document.querySelector("#student-form");
const showStudentFormButton = document.querySelector("#show-student-form-button");
const cancelStudentFormButton = document.querySelector("#cancel-student-form-button");
const tableMessage = document.querySelector("#students-table-message");

const settlementStartInput = studentForm.elements.settlementStart;
const settlementEndInput = studentForm.elements.settlementEnd;

const toggleFiltersButton = document.querySelector("#toggle-filters");
const filtersPanel = document.querySelector("#filters-panel");
const filterInputs = document.querySelectorAll(".filter-input");
const dormitoryStatusFilter = document.querySelector("#lives-in-dormitory-filter");
const dormitoryNumberFilter = document.querySelector("#dormitory-filter");
const applyFiltersButton = document.querySelector("#apply-filters");
const resetFiltersButton = document.querySelector("#reset-filters");

let activeFilters = {};

toggleFiltersButton.addEventListener("click", () => {
  filtersPanel.hidden = !filtersPanel.hidden;
  toggleFiltersButton.setAttribute(
    "aria-expanded",
    String(!filtersPanel.hidden)
  );
});

function updateDormitoryNumberFilter() {
  const doesNotLiveInDormitory =
    dormitoryStatusFilter.value === "false";

  if (doesNotLiveInDormitory) {
    dormitoryNumberFilter.value = "";
  }

  dormitoryNumberFilter.disabled = doesNotLiveInDormitory;
}

dormitoryStatusFilter.addEventListener(
  "change",
  updateDormitoryNumberFilter
);

function getFiltersFromInputs() {
  const filters = {};

  filterInputs.forEach((input) => {
    if (input.disabled) return;

    const value = input.value.trim();

    if (value !== "") {
      filters[input.name] =
        input.name === "livesInDormitory" ||
        input.name === "isForeign"
          ? value === "true"
          : value;
    }
  });

  return filters;
}

filtersPanel.addEventListener("submit", async (event) => {
  event.preventDefault();

  activeFilters = getFiltersFromInputs();
  await refreshStudents();
});

resetFiltersButton.addEventListener("click", async () => {
  filterInputs.forEach((input) => {
    input.value = "";
  });

  updateDormitoryNumberFilter();
  activeFilters = {};
  await refreshStudents();
});

function renderStudents(studentsToShow) {
  tableBody.replaceChildren();

  studentsToShow.forEach((student) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameLink = document.createElement("a");
    nameLink.textContent = student.fullName;
    nameLink.href = `student.html?isu=${student.isuId}`;
    nameCell.append(nameLink);

    const groupCell = document.createElement("td");
    groupCell.textContent = student.group;

    const isuCell = document.createElement("td");
    isuCell.textContent = student.isuId;

    const dormitoryCell = document.createElement("td");
    dormitoryCell.textContent = student.livesInDormitory
      ? `Корпус ${student.dormitoryNumber}`
      : "—";

    const actionCell = document.createElement("td");
    actionCell.classList.add("actions-cell");

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.ariaLabel = `Удалить ${student.fullName}`;
    deleteButton.classList.add("action-control");

    const deleteIcon = document.createElement("img");
    deleteIcon.src = "png/delete-icon.png";
    deleteIcon.alt = "";
    deleteIcon.classList.add("action-icon");
    deleteIcon.style.width = "16px";
    deleteButton.append(deleteIcon);

    deleteButton.addEventListener("click", async () => {
      const shouldDelete = confirm(
        `Удалить студента ${student.fullName}?`
      );
      if (!shouldDelete) return;

      tableMessage.textContent = "";

      try {
        await deleteStudent(student.isuId);
        await refreshStudents();
      } catch (error) {
        tableMessage.textContent = error.status
          ? error.message
          : "Не удалось удалить студента.";
      }
    });

    const editLink = document.createElement("a");
    editLink.href =
      `student.html?isu=${student.isuId}&mode=edit`;
    editLink.ariaLabel =
      `Редактировать ${student.fullName}`;
    editLink.classList.add("action-control");

    const editIcon = document.createElement("img");
    editIcon.src = "png/edit-icon.png";
    editIcon.alt = "";
    editIcon.classList.add("action-icon");
    editIcon.style.width = "16px";
    editLink.append(editIcon);

    actionCell.append(editLink, deleteButton);

    row.append(
      nameCell,
      groupCell,
      isuCell,
      dormitoryCell,
      actionCell
    );

    tableBody.append(row);
  });
}

async function refreshStudents() {
  tableMessage.textContent = "";

  try {
    const studentsFromServer =
      await getStudents(activeFilters);

    renderStudents(studentsFromServer);

    if (studentsFromServer.length === 0) {
      tableMessage.textContent =
        Object.keys(activeFilters).length === 0
          ? "Пока нет студентов."
          : "Студенты не найдены.";
    }
  } catch (error) {
    tableMessage.textContent = error.status
      ? error.message
      : "Не удалось загрузить список студентов.";
  }
}

showStudentFormButton.addEventListener("click", () => {
  studentForm.reset();
  updateDormitoryFields();
  updateSettlementEndMin();

  studentForm.hidden = false;
  studentForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
  studentForm.elements.fullName.focus();
});

cancelStudentFormButton.addEventListener("click", () => {
  studentForm.reset();
  studentForm.hidden = true;
});

const dormitoryCheckbox =
  studentForm.elements.livesInDormitory;

const dormitoryFields =
  document.querySelector("#dormitory-fields");

const dormitoryInputs =
  dormitoryFields.querySelectorAll("input");

function updateDormitoryFields() {
  const livesInDormitory =
    dormitoryCheckbox.checked;

  dormitoryFields.hidden = !livesInDormitory;
  dormitoryFields.disabled = !livesInDormitory;

  dormitoryInputs.forEach((input) => {
    input.required = livesInDormitory;
  });
}

dormitoryCheckbox.addEventListener(
  "change",
  updateDormitoryFields
);

updateDormitoryFields();

studentForm.addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();
    tableMessage.textContent = "";

    const formData = new FormData(studentForm);
    const livesInDormitory =
      formData.has("livesInDormitory");

    const newStudent = {
      fullName: formData.get("fullName").trim(),
      group: formData.get("group").trim(),
      isuId: formData.get("isuId").trim(),
      livesInDormitory,

      dormitoryNumber: livesInDormitory
        ? formData.get("dormitoryNumber").trim()
        : "",

      roomNumber: livesInDormitory
        ? formData.get("roomNumber").trim()
        : "",

      settlementStart: livesInDormitory
        ? formData.get("settlementStart")
        : "",

      settlementEnd: livesInDormitory
        ? formData.get("settlementEnd")
        : "",

      isForeign: formData.has("isForeign"),
      notes: formData.get("notes").trim()
    };

    try {
      await createStudent(newStudent);

      studentForm.reset();
      studentForm.hidden = true;

      updateDormitoryFields();
      updateSettlementEndMin();

      await refreshStudents();
    } catch (error) {
      tableMessage.textContent = error.status
        ? error.message
        : "Не удалось добавить студента.";
    }
  }
);

function updateSettlementEndMin() {
  settlementEndInput.min =
    settlementStartInput.value || "2020-01-01";
}

settlementStartInput.addEventListener(
  "change",
  updateSettlementEndMin
);

updateSettlementEndMin();
refreshStudents();