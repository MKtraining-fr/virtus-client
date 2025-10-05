import requests

ACCESS_TOKEN = "sbp_496d8c7c41b7280c0b187444bc4daa1a6a0870e0"
PROJECT_ID = "dqsbfnsicmzovlrhuoif"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

# Utiliser l'endpoint correct pour lister les utilisateurs
response = requests.get(
    f"https://api.supabase.com/v1/projects/{PROJECT_ID}/auth/users",
    headers=headers,
    params={"per_page": 100}
)

print(f"Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    users = data.get('users', [])
    print(f"\n✅ Total utilisateurs Auth: {len(users)}\n")
    for user in users:
        print(f"- {user.get('email')} (ID: {user.get('id')})")
        print(f"  Créé le: {user.get('created_at')}")
        print(f"  Confirmé: {user.get('email_confirmed_at') is not None}")
        print()
else:
    print(f"Erreur: {response.text}")
