import json
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.conf import settings
from django.test import SimpleTestCase

from . import data_manager


class StudentApiTests(SimpleTestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.data_file = Path(self.directory.name) / "data.json"
        self.file_patch = patch.object(data_manager, "DATA_FILE", self.data_file, create=True)
        self.file_patch.start()
        self.addCleanup(self.file_patch.stop)
        self.student = {
            "fullName": "Милли Иванова", "group": "P3222", "isuId": "012345",
            "livesInDormitory": True, "isForeign": False,
            "dormitoryNumber": "3", "roomNumber": "16",
            "settlementStart": "2026-09-01", "settlementEnd": "2027-06-30",
            "notes": "Тестовая запись",
        }

    def create(self, student=None):
        return self.client.post("/api/requests", student or self.student, content_type="application/json")

    def test_pages_are_served(self):
        for url in ["/start.html", "/table+form.html", "/student.html"]:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                response.close()

    def test_frontend_scripts_are_served_in_development(self):
        if not settings.DEBUG:
            self.skipTest("Для проверки статики запустите тесты с --debug-mode")
        for url in ["/js/student-api.js", "/css/pages.css"]:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                response.close()

    def test_missing_or_empty_file_returns_empty_list(self):
        self.assertEqual(self.client.get("/api/requests").json(), [])
        self.data_file.write_text("", encoding="utf-8")
        self.assertEqual(self.client.get("/api/requests").json(), [])

    def test_crud_and_changing_isu_preserve_strings(self):
        response = self.create()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["isuId"], "012345")
        self.assertEqual(self.client.get("/api/requests/012345").json(), self.student)
        response = self.client.patch("/api/requests/012345", {"isuId": "012346", "notes": "Изменено"}, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["fullName"], self.student["fullName"])
        self.assertEqual(self.client.get("/api/requests/012345").status_code, 404)
        self.assertEqual(self.client.delete("/api/requests/012346").status_code, 204)
        self.assertEqual(self.client.get("/api/requests").json(), [])

    def test_filters_work_for_get_strings_and_query_booleans(self):
        self.assertEqual(self.create().status_code, 201)
        other = {**self.student, "isuId": "123456", "fullName": "Анна Петрова", "livesInDormitory": False, "isForeign": True}
        self.assertEqual(self.create(other).status_code, 201)
        response = self.client.get("/api/requests", {"livesInDormitory": "false", "isForeign": "true"})
        self.assertEqual([s["isuId"] for s in response.json()], ["123456"])
        response = self.client.generic("QUERY", "/api/requests", json.dumps({"group": "P32", "isuId": "012", "livesInDormitory": True, "isForeign": False}), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([s["isuId"] for s in response.json()], ["012345"])
        self.assertEqual(self.client.get("/api/requests", {"isForeign": "true", "dormitoryNumber": "3"}).json(), [])

    def test_validation_and_conflict_do_not_change_saved_data(self):
        self.assertEqual(self.create().status_code, 201)
        self.assertEqual(self.create().status_code, 409)
        response = self.client.patch("/api/requests/012345", {"group": "bad"}, content_type="application/json")
        self.assertEqual(response.status_code, 422)
        self.assertIn("message", response.json()["error"])
        self.assertEqual(self.client.get("/api/requests/012345").json()["group"], "P3222")

    def test_bad_filters_and_json_use_error_message_contract(self):
        cases = [
            self.client.get("/api/requests", {"isForeign": "maybe"}),
            self.client.generic("QUERY", "/api/requests", "[]", content_type="application/json"),
        ]
        for response in cases:
            self.assertEqual(response.status_code, 422)
            self.assertIn("message", response.json()["error"])
        response = self.client.post("/api/requests", "{", content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("message", response.json()["error"])
        response = self.client.put("/api/requests", {}, content_type="application/json")
        self.assertEqual(response.status_code, 405)
        self.assertIn("message", response.json()["error"])

    def test_storage_failure_does_not_report_success(self):
        with self.assertLogs("backend.exceptions", level="ERROR"), patch.object(data_manager, "writeIntoJson", side_effect=OSError("storage unavailable")):
            response = self.create()
        self.assertEqual(response.status_code, 500)
        self.assertIn("message", response.json()["error"])

    def test_student_requires_json_types_and_calendar_date_format(self):
        for changes in [{"isForeign": "false"}, {"isuId": 123456}, {"settlementStart": "20260901"}, {"dormitoryNumber": "²"}]:
            with self.subTest(changes=changes):
                self.data_file.write_text("[]", encoding="utf-8")
                response = self.create({**self.student, **changes})
                self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get("/api/requests").json(), [])

    def test_patch_requires_json_object(self):
        self.assertEqual(self.create().status_code, 201)
        response = self.client.patch("/api/requests/012345", "[]", content_type="application/json")
        self.assertEqual(response.status_code, 422)
