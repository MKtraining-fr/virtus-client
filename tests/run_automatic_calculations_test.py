#!/usr/bin/env python3
"""
Script pour tester le système de calcul automatique du 1RM et des projections
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
print("🧪 TEST PHASE 3 : Calcul automatique du 1RM et des projections")
print("=" * 80)
print()

# Lire le fichier de tests
with open('/home/ubuntu/virtus/tests/test_automatic_calculations.sql', 'r') as f:
    sql_content = f.read()

# Exécuter tous les tests
print("📊 Exécution des tests avec données réelles...")
print()

result = execute_sql(sql_content)

if result:
    print(result)
    print()
    print("=" * 80)
    print("✅ Tests Phase 3 terminés")
    print("=" * 80)
else:
    print("❌ Échec de l'exécution des tests")
    exit(1)
