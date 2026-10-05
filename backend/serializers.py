import datetime
import re

from rest_framework import serializers
from django.core.validators import RegexValidator


class JSONStringField(serializers.CharField):
    def to_internal_value(self, data):
        if not isinstance(data, str):
            raise serializers.ValidationError("Значение должно быть строкой JSON")
        return super().to_internal_value(data)


class JSONBooleanField(serializers.BooleanField):
    def to_internal_value(self, data):
        if type(data) is not bool:
            raise serializers.ValidationError("Значение должно быть true или false в JSON")
        return data


class StudentFilterSerializer(serializers.Serializer):
    fullName = serializers.RegexField(
        r"^[A-Za-zА-Яа-яЁё]+( [A-Za-zА-Яа-яЁё]+)*$", required=False,
        error_messages={"invalid": "Фильтр ФИО должен содержать буквы и пробелы"},
    )
    group = serializers.RegexField(
        r"^[A-Z][0-9]{0,4}$", required=False,
        error_messages={"invalid": "Фильтр группы: заглавная английская буква и до четырёх цифр"},
    )
    isuId = serializers.RegexField(
        r"^[0-9]{1,6}$", required=False,
        error_messages={"invalid": "Фильтр ИСУ должен содержать от одной до шести цифр"},
    )
    dormitoryNumber = serializers.RegexField(
        r"^[1-9][0-9]*$", required=False,
        error_messages={"invalid": "Номер общежития должен быть положительным целым числом"},
    )
    livesInDormitory = serializers.BooleanField(required=False)
    isForeign = serializers.BooleanField(required=False)

    def to_internal_value(self, data):
        if isinstance(data, dict):
            unknown = set(data) - set(self.fields)
            if unknown:
                raise serializers.ValidationError(
                    "Неизвестные фильтры: " + ", ".join(sorted(unknown))
                )
        return super().to_internal_value(data)


class StudentSerializer(serializers.Serializer):
    fullName = JSONStringField(
        validators=[
            RegexValidator(
                regex=r"^[A-Za-zА-Яа-яЁё]+( [A-Za-zА-Яа-яЁё]+)*$",
                message="ФИО должно состоять из букв, разделённых пробелами"
            )
        ]
    )

    group = JSONStringField(
        validators=[
            RegexValidator(
                regex=r"^[A-Z][0-9]{4}$",
                message="Группа должна состоять из заглавной английской буквы и четырёх цифр"
            )
        ]
    )

    isuId = JSONStringField(
        validators=[
            RegexValidator(
                regex=r"^[0-9]{6}$",
                message="ИСУ должен состоять ровно из 6 цифр"
            )
        ]
    )

    livesInDormitory = JSONBooleanField()
    isForeign = JSONBooleanField()

    dormitoryNumber = serializers.CharField(
        required=False,
        allow_blank=True
    )

    roomNumber = serializers.CharField(
        required=False,
        allow_blank=True
    )

    settlementStart = serializers.CharField(
        required=False,
        allow_blank=True
    )

    settlementEnd = serializers.CharField(
        required=False,
        allow_blank=True
    )

    notes = JSONStringField(
        max_length=500,
        required=False,
        allow_blank=True,
        default=""
    )

    def validate(self, data):
        if data["livesInDormitory"]:
            dormitory = data.get("dormitoryNumber", "")
            room = data.get("roomNumber", "")

            if not re.fullmatch(r"[0-9]+", dormitory) or int(dormitory) <= 0:
                raise serializers.ValidationError(
                    "Номер общежития должен быть положительным целым числом"
                )

            if not re.fullmatch(r"[0-9]+", room) or int(room) <= 0:
                raise serializers.ValidationError(
                    "Номер комнаты должен быть положительным целым числом"
                )

            start = data.get("settlementStart", "")
            end = data.get("settlementEnd", "")

            if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", start) or not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", end):
                raise serializers.ValidationError("Дата должна быть в формате YYYY-MM-DD")

            try:
                start_date = datetime.date.fromisoformat(start)
                end_date = datetime.date.fromisoformat(end)
            except ValueError:
                raise serializers.ValidationError(
                    "Дата должна быть в формате YYYY-MM-DD"
                )

            min_date = datetime.date(2020, 1, 1)
            max_date = datetime.date(2035, 12, 31)

            if not min_date <= start_date <= max_date:
                raise serializers.ValidationError(
                    "Дата заселения должна быть от 2020-01-01 до 2035-12-31"
                )

            if not min_date <= end_date <= max_date:
                raise serializers.ValidationError(
                    "Дата выселения должна быть от 2020-01-01 до 2035-12-31"
                )

            if end_date < start_date:
                raise serializers.ValidationError(
                    "Дата выселения не может быть раньше даты заселения"
                )

        else:
            data["dormitoryNumber"] = ""
            data["roomNumber"] = ""
            data["settlementStart"] = ""
            data["settlementEnd"] = ""

        return data
