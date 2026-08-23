import urllib.request
import json

doctor_id = "df880a02-f1b1-4c11-969e-4d78ab0f66eb"
headers = {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc4NzQzMjM0MSwianRpIjoiMzZjYTU5NzQtNWM4MC00OWQzLWE0ODQtYmY4YzIyNmViYThjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6InNvbWVfaWQiLCJuYmYiOjE3ODc0MzIzNDEsImNzcmYiOiI1ZmNmYmRjZS1kNWE1LTQyYjEtYjMzNC04MGVhYjEyN2NmYTEiLCJleHAiOjE3ODc0NjExNDEsInJvbGUiOiJwYXRpZW50In0.g5cOJzq4yW4E8oDGAQWHJh9qrkazWb6uo0lHry0O1P0',
    'Content-Type': 'application/json'
}

hold_req = urllib.request.Request(
    f'https://healthcare-appointment-follow-up-manager-xpk2.onrender.com/api/patient/doctors/{doctor_id}/hold',
    data=b'{"date": "2026-08-26", "start_time": "09:30"}',
    headers=headers
)

try:
    hold_res = urllib.request.urlopen(hold_req)
    hold_data = json.loads(hold_res.read().decode())
    hold_id = hold_data["hold_id"]
    print(f"Held slot. hold_id: {hold_id}")
except Exception as e:
    print("Hold Failed:", e.read().decode())
    exit(1)

book_req = urllib.request.Request(
    f'https://healthcare-appointment-follow-up-manager-xpk2.onrender.com/api/patient/doctors/{doctor_id}/book',
    data=json.dumps({"date": "2026-08-26", "start_time": "09:30", "hold_id": hold_id, "symptoms": "fever"}).encode(),
    headers=headers
)

try:
    book_res = urllib.request.urlopen(book_req)
    print("Book Success:", book_res.read().decode())
except Exception as e:
    print("Book ERROR:", e.read().decode())
