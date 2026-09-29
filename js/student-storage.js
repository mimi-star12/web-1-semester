function getCookie(name) {
  const cookies = document.cookie.split("; ");

  const neededCookie = cookies.find((cookie) =>
    cookie.startsWith(`${name}=`)
  );

  if (!neededCookie) {
    return null;
  }

  return neededCookie.slice(name.length + 1);
}

function loadStudents() {
  const studentsCookie = getCookie("students");

  if (studentsCookie === null) {
    return null;
  }

  try {
    return JSON.parse(
      decodeURIComponent(studentsCookie)
    );
  } catch (error) {
    console.error(
      "Не удалось прочитать студентов из cookie",
      error
    );

    return null;
  }
}

function saveStudents(students) {
  const studentsJSON = JSON.stringify(students);

  document.cookie =
    `students=${encodeURIComponent(studentsJSON)}; max-age=2592000; path=/; SameSite=Lax`;
}

