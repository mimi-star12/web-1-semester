from rest_framework.decorators import api_view
from rest_framework.response import Response

from .serializers import StudentSerializer
from . import services


def error(message, status_code):
    return Response(
        {
            "error": {
                "message": message
            }
        },
        status=status_code
    )


def serializer_error(serializer):
    errors = serializer.errors

    first_error = next(iter(errors.values()))

    if isinstance(first_error, list):
        message = first_error[0]
    else:
        message = first_error

    return error(str(message), 422)


@api_view(["GET", "POST", "QUERY"])
def requests_list(request):

    # GET /api/requests
    # GET /api/requests?group=P32
    if request.method == "GET":
        filters = request.query_params.dict()

        if filters:
            students = services.filter_students(filters)
        else:
            students = services.get_all_students()

        return Response(students, status=200)

    # QUERY /api/requests
    if request.method == "QUERY":
        filters = request.data

        students = services.filter_students(filters)

        return Response(students, status=200)

    # POST /api/requests
    if request.method == "POST":
        serializer = StudentSerializer(data=request.data)

        if not serializer.is_valid():
            return serializer_error(serializer)

        student = serializer.validated_data

        if services.isu_exists(student["isuId"]):
            return error(
                "Студент с таким ИСУ уже существует",
                409
            )

        student = services.create_student(student)

        return Response(student, status=201)


@api_view(["GET", "PATCH", "DELETE"])
def request_by_id(request, isu_id):

    student = services.get_student(isu_id)

    if student is None:
        return error(
            "Студент не найден",
            404
        )

    # GET /api/requests/:isuId
    if request.method == "GET":
        return Response(student, status=200)

    # DELETE /api/requests/:isuId
    if request.method == "DELETE":
        services.delete_student(isu_id)

        return Response(status=204)

    # PATCH /api/requests/:isuId
    if request.method == "PATCH":
        updated_student = student.copy()

        updated_student.update(request.data)

        serializer = StudentSerializer(
            data=updated_student
        )

        if not serializer.is_valid():
            return serializer_error(serializer)

        updated_student = serializer.validated_data

        new_isu = updated_student["isuId"]

        if services.isu_exists(
            new_isu,
            ignore_isu=isu_id
        ):
            return error(
                "Студент с таким ИСУ уже существует",
                409
            )

        saved_student = services.update_student(
            isu_id,
            updated_student
        )

        return Response(
            saved_student,
            status=200
        )