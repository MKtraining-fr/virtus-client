#!/usr/bin/env python3
"""
Script pour exécuter les tests de Phase 1 et afficher les résultats
"""

import subprocess
import json

def execute_sql(query):
    """Exécute une requête SQL via MCP Supabase"""
    input_data = json.dumps({
        "project_id": "dqsbfnsicmzovlrhuoif",
        "query": query
    })
    
    try:
        result = subprocess.run(
            ['manus-mcp-cli', 'tool', 'call', 'execute_sql', '--server', 'supabase', '--input', input_data],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur SQL: {e.stderr}")
        return None

print("=" * 80)
print("🧪 TESTS PHASE 1 : Validation de la base de données")
print("=" * 80)
print()

# Lire le fichier de tests
with open('/home/ubuntu/virtus/tests/test_phase1_database.sql', 'r') as f:
    sql_content = f.read()

# Exécuter tous les tests
print("📊 Exécution des tests...")
print()

result = execute_sql(sql_content)

if result:
    print(result)
    print()
    print("=" * 80)
    print("✅ Tests Phase 1 terminés")
    print("=" * 80)
else:
    print("❌ Échec de l'exécution des tests")
    exit(1)
