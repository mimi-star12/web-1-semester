console.log("students-table.js подключился");

const savedStudents = loadStudents();

const students = savedStudents ?? [
  {
    fullName: "Милли Иванова",
    group: "P3222",
    isuId: "504695",
    livesInDormitory: true,
    dormitoryNumber: "3",
    roomNumber: "16",
    settlementStart: "2026-09-01",
    settlementEnd: "2027-06-30",
    isForeign: false,
    notes: "блин милли все сломала, молодец"
  }
];

if (savedStudents === null) {
  saveStudents(students);
}


const tableBody = document.querySelector(
  "#students-table-body"
);

const studentForm = document.querySelector(
  "#student-form"
);

const showStudentFormButton = document.querySelector(
  "#show-student-form-button"
);

const cancelStudentFormButton = document.querySelector(
  "#cancel-student-form-button"
);


const settlementStartInput =
  studentForm.elements.settlementStart;

const settlementEndInput =
  studentForm.elements.settlementEnd;

function renderStudents() {
  tableBody.replaceChildren();

  students.forEach((student) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameLink = document.createElement("a");

    // constructing "matryoshka-like" structure
    nameLink.textContent = student.fullName;
    nameLink.href =
      `student.html?isu=${student.isuId}`;

    nameCell.append(nameLink);

    const groupCell = document.createElement("td");
    groupCell.textContent = student.group;

    const isuCell = document.createElement("td");
    isuCell.textContent = student.isuId;

    const dormitoryCell = document.createElement("td");
    dormitoryCell.textContent =
      student.livesInDormitory
        ? `Корпус ${student.dormitoryNumber}`
        : "—";

    //action row
    const actionCell = document.createElement("td");
    actionCell.classList.add("actions-cell");

    // Кнопка удаления
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.ariaLabel =
      `Удалить ${student.fullName}`;
    deleteButton.classList.add("action-control");

    const deleteIcon = document.createElement("img");
    deleteIcon.src = "png/delete-icon.png";
    deleteIcon.alt = "";
    deleteIcon.classList.add("action-icon");
    deleteIcon.style.width = "16px";

    deleteButton.append(deleteIcon);

    deleteButton.addEventListener("click", () => {
      const shouldDelete = confirm(`Удалить студента ${student.fullName}?`);

      if (!shouldDelete) {
        return;
      }

      const studentIndex = students.findIndex(
        (currentStudent) => currentStudent.isuId === student.isuId
      );

      if (studentIndex === -1) {
        return;
      }

      // splice(индекс начала удаления, кол-во удаляемых элементов)
      students.splice(studentIndex, 1);
      saveStudents(students);
      renderStudents();
    });

    // Ссылка редактирования
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

showStudentFormButton.addEventListener("click", () => {
  studentForm.reset();
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

  dormitoryFields.hidden =
    !livesInDormitory;

  dormitoryFields.disabled =
    !livesInDormitory;

  dormitoryInputs.forEach((input) => {
    input.required = livesInDormitory;
  });
}

dormitoryCheckbox.addEventListener(
  "change",
  updateDormitoryFields
);

updateDormitoryFields();

// сохранение студента
studentForm.addEventListener("submit", function (event) {
  event.preventDefault();
  
  // получаем данные из формы (используем .get, .has)
  const formData = new FormData(studentForm);
  const isuId = formData.get("isuId").trim();
  const livesInDormitory = formData.has("livesInDormitory");

  const isuAlreadyExists = students.some((student) => student.isuId === isuId);
  const isuInput = studentForm.elements.isuId;

  isuInput.addEventListener("input", () => {
    isuInput.setCustomValidity("");
  });
  if (isuAlreadyExists) {
    isuInput.setCustomValidity("Студент с таким ИСУ уже существует.");
    isuInput.reportValidity();
    return;
  }

  const newStudent = {
    fullName: formData.get("fullName").trim(),
    group: formData.get("group").trim(),
    isuId,
    livesInDormitory,
    dormitoryNumber: livesInDormitory ? formData.get("dormitoryNumber").trim() : "",
    roomNumber: livesInDormitory ? formData.get("roomNumber").trim() : "",
    settlementStart: livesInDormitory ? formData.get("settlementStart") : "",
    settlementEnd: livesInDormitory ? formData.get("settlementEnd") : "",
    isForeign: formData.has("isForeign"),
    notes: formData.get("notes").trim()
  };
  students.push(newStudent);
  saveStudents(students);
  renderStudents();

  studentForm.reset();
  studentForm.hidden = true;

  updateDormitoryFields();
  updateSettlementEndMin();
});

// выселение позже заселения
function updateSettlementEndMin() {
  settlementEndInput.min =
    settlementStartInput.value || "2020-01-01"; // | - или
}
settlementStartInput.addEventListener(
  "change",
  updateSettlementEndMin
);
updateSettlementEndMin();


renderStudents();

console.log(students[0].fullName);



