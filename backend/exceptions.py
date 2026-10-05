import logging

from rest_framework.exceptions import ParseError
from rest_framework.response import Response
from rest_framework.views import exception_handler


logger = logging.getLogger(__name__)


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        logger.exception("Ошибка API")
        return Response({"error": {"message": "Внутренний сбой сервера"}}, status=500)
    if isinstance(exc, ParseError):
        message = "Некорректный JSON"
    elif response.status_code == 405:
        message = "Метод запроса не разрешён"
    else:
        message = str(response.data.get("detail", "Ошибка запроса"))
    response.data = {"error": {"message": message}}
    return response
