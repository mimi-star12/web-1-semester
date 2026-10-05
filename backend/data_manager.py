import json

def writeIntoJson(data: dict):
    try:
        dataJson = json.dumps(data)
        with open('data.json', 'w', encoding='utf-8') as f:
            f.write(dataJson)
        return True
    except Exception as e:
        return False



def readFromJson():
    try:
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.loads(f.read())
    except Exception as e:
        return False

    return data