# Студенческое досье

Фронт и API работают через один сервер Django. Студенты сохраняются в `backend/data.json`; пустой или отсутствующий файл означает пустой список.

## Запуск в Windows

Открой терминал VS Code в корне проекта, где находится `manage.py`:

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py runserver
```

Открой http://127.0.0.1:8000/start.html. Страницы, CSS, JS и API выдаёт Django; Live Server для этого запуска не нужен.

Если виртуальное окружение уже есть, используй его Python вместо создания нового.

## API

| Метод | Адрес | Действие |
| --- | --- | --- |
| GET | `/api/requests` | Список; фильтры передаются после `?` |
| QUERY | `/api/requests` | Список; фильтры передаются объектом JSON |
| POST | `/api/requests` | Создание студента |
| GET | `/api/requests/<isu_id>` | Получение студента |
| PATCH | `/api/requests/<isu_id>` | Изменение студента |
| DELETE | `/api/requests/<isu_id>` | Удаление; ответ 204 без тела |

Фильтры: `fullName`, `group`, `isuId`, `dormitoryNumber`, `livesInDormitory`, `isForeign`. Для GET логические значения передаются строками `true`/`false`, для QUERY — логическими значениями JSON. ФИО ищется по вхождению, группа и ИСУ — по началу значения, номер общежития — по точному совпадению. Все заданные условия должны выполняться вместе.

Ошибки API возвращаются в формате `{"error":{"message":"Причина ошибки"}}`. Коды: 400 — некорректный JSON, 422 — неправильные значения, 409 — занятый ИСУ, 404 — студент не найден, 500 — внутренний сбой.

## Проверки

```powershell
.venv\Scripts\python.exe manage.py test --debug-mode
```

Проверки используют временный файл данных и не изменяют сохранённых студентов. `--debug-mode` включает также проверку выдачи CSS и JS, которая используется при локальном запуске.
