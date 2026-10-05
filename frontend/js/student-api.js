
async function getStudents(filters = {}) {
  if (Object.keys(filters).length > 2) {
    return await queryStudents(filters);
  }
  const params = new URLSearchParams(filters);
  const query = params.toString();

  const url = query
    ? `/api/requests?${query}`
    : "/api/requests";

  const response = await fetchApi(url);

  if (!response.ok) {
    await throwApiError(response);
  }


  return await response.json();
}

async function queryStudents(filters) {
  const response = await fetchApi("/api/requests", {
    method: "QUERY",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filters)
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  return await response.json();
}

//getting student by isu
async function getStudent(isuId) {
  const response = await fetchApi(
    `/api/requests/${encodeURIComponent(isuId)}`
  );

  if (!response.ok) {
    await throwApiError(response);
  }

  return await response.json();
}

async function createStudent(student) {
  const response = await fetchApi("/api/requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(student)
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  return await response.json();
}

async function updateStudent(isuId, changes) {
  const response = await fetchApi(
    `/api/requests/${encodeURIComponent(isuId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(changes)
    }
  );

  if (!response.ok) {
    await throwApiError(response);
  }

  return await response.json();
}

async function deleteStudent(isuId) {
  const response = await fetchApi (
    `/api/requests/${encodeURIComponent(isuId)}`,
    {
      method: "DELETE"
    }
  );

  if (!response.ok) {
    await throwApiError(response);
  }
}


//выброс ошибки с сервера или запасное соо-ние по http коду
async function throwApiError(response) {
  let message = `Ошибка запроса (${response.status})`;

  try {
    const data = await response.json();

    if (data?.error?.message) {
      message = data.error.message;
    }
  } catch {
    // ответ был пустым или не содержал корректный JSON
  }

  const error = new Error(message);
  error.status = response.status;
  throw error;
}

//выброс ошибки если не подключились к серверу
async function fetchApi(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error("Не удалось связаться с сервером");
  }
}

/*
{
  error: {
    message: "ИСУ должен состоять ровно из 6 цифр"
  }
}
*/
