import requests

ACCESS_TOKEN = "sbp_496d8c7c41b7280c0b187444bc4daa1a6a0870e0"
PROJECT_ID = "dqsbfnsicmzovlrhuoif"

# ID de l'utilisateur créé
user_id = "00471451-43df-4858-b16f-f3127498fe93"
email = "contact@mktraining.fr"
first_name = "MK"
last_name = "Training"

print("Création du profil administrateur via SQL...")

sql = f"""
INSERT INTO clients (id, email, first_name, last_name, role, created_at, updated_at)
VALUES ('{user_id}', '{email}', '{first_name}', '{last_name}', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET role = 'admin';
"""

url = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

response = requests.post(url, headers=headers, json={"query": sql})

if response.status_code in [200, 201]:
    print("✅ Profil administrateur créé avec succès!")
    print(f"   📧 Email: {email}")
    print(f"   👤 Nom: {first_name} {last_name}")
    print(f"   🎭 Rôle: admin")
else:
    print(f"❌ Erreur: {response.status_code}")
    print(response.text)
