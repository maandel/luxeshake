import requests

data = {
    "username": "admin@luxeshake.com",
    "password": "adminpassword123"
}
resp = requests.post("http://localhost:8000/api/v1/auth/login", data=data)
token = resp.json()["access_token"]

resp2 = requests.get("http://localhost:8000/api/v1/admin/products", headers={"Authorization": f"Bearer {token}"})
print(resp2.status_code)
if resp2.status_code != 200:
    print(resp2.text)
else:
    print("Products GET successful")
