import requests

try:
    resp = requests.get('http://localhost:8000/api/v1/admin/products', headers={'Authorization': 'Bearer ' + open('C:/Users/BLUETAG/.gemini/antigravity-ide/brain/477cc0a6-96f2-4206-8014-d032194808ed/scratch/token.txt', 'r').read().strip() if __import__('os').path.exists('C:/Users/BLUETAG/.gemini/antigravity-ide/brain/477cc0a6-96f2-4206-8014-d032194808ed/scratch/token.txt') else ''})
    print(resp.status_code, resp.text)
except Exception as e:
    print(e)
