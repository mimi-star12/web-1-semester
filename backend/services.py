from .data_manager import *

def get_all_students():
    data = readFromJson()
    return data

def get_by_isu(isu):
    data = readFromJson()

    for student in data:
        if student['isuId'] == isu:
            return student

    return None

def filter_students(filters):
    students = get_all_students()

    result = []

    for student in students:
        ok = True

        if "fullName" in filters:
            if filters["fullName"].lower() not in student["fullName"].lower():
                ok = False

        if "group" in filters:
            if not student["group"].lower().startswith(
                filters["group"].lower()
            ):
                ok = False

        if "isuId" in filters:
            if not student["isuId"].startswith(filters["isuId"]):
                ok = False

        if "dormitoryNumber" in filters:
            if student["dormitoryNumber"] != filters["dormitoryNumber"]:
                ok = False

        if ok:
            result.append(student)

    return result


def isu_exists(isu_id, ignore_isu=None):
    students = get_all_students()

    for student in students:
        if student["isuId"] == isu_id:
            if student["isuId"] != ignore_isu:
                return True

    return False

def create_student(student):
    students = get_all_students()

    students.append(student)

    writeIntoJson(students)

    return student


def update_student(old_isu, new_student):
    students = get_all_students()

    for i in range(len(students)):
        if students[i]["isuId"] == old_isu:
            students[i] = new_student
            writeIntoJson(students)
            return new_student

    return None


def delete_student(isu_id):
    students = get_all_students()

    for i in range(len(students)):
        if students[i]["isuId"] == isu_id:
            students.pop(i)
            writeIntoJson(students)
            return True

    return False