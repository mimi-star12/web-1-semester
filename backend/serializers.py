import datetime

from rest_framework import serializers
from django.core.validators import RegexValidator


class StudentSerializer(serializers.Serializer):
    fullName = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r"^[A-Za-zА-Яа-яЁё]+( [A-Za-zА-Яа-яЁё]+)*$",
                message="ФИО должно состоять из букв, разделённых пробелами"
            )
        ]
    )

    group = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r"^[A-Z][0-9]{4}$",
                message="Группа должна состоять из заглавной английской буквы и четырёх цифр"
            )
        ]
    )

    isuId = serializers.CharField(
        validators=[
            RegexValidator(
                regex=r"^[0-9]{6}$",
                message="ИСУ должен состоять ровно из 6 цифр"
            )
        ]
    )

    livesInDormitory = serializers.BooleanField()
    isForeign = serializers.BooleanField()

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

    notes = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        default=""
    )

    def validate(self, data):
        if data["livesInDormitory"]:
            dormitory = data.get("dormitoryNumber", "")
            room = data.get("roomNumber", "")

            if not dormitory.isdigit() or int(dormitory) <= 0:
                raise serializers.ValidationError(
                    "Номер общежития должен быть положительным целым числом"
                )

            if not room.isdigit() or int(room) <= 0:
                raise serializers.ValidationError(
                    "Номер комнаты должен быть положительным целым числом"
                )

            start = data.get("settlementStart", "")
            end = data.get("settlementEnd", "")

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