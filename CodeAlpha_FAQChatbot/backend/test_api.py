import json
import urllib.request


def post_question(question):
    payload = json.dumps(
        {
            "question": question,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        "http://127.0.0.1:5000/api/chat",
        data=payload,
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(request) as response:
        result = json.loads(response.read().decode("utf-8"))

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    post_question(
        "Does this game work on PlayStation?"
    )
