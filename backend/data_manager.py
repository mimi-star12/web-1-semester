import json
import tempfile
from pathlib import Path


DATA_FILE = Path(__file__).with_name("data.json")


def writeIntoJson(data):
    # Сначала записываем новый файл целиком, затем заменяем прежний.
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=DATA_FILE.parent, delete=False
        ) as file:
            temporary_path = Path(file.name)
            json.dump(data, file, ensure_ascii=False, indent=2)
        temporary_path.replace(DATA_FILE)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def readFromJson():
    if not DATA_FILE.exists():
        return []
    text = DATA_FILE.read_text(encoding="utf-8")
    if not text.strip():
        return []
    data = json.loads(text)
    if not isinstance(data, list):
        raise ValueError("Файл данных должен содержать массив студентов")
    return data
