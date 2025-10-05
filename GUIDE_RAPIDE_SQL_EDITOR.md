# 🚀 Guide Ultra-Rapide : Créer la Table bilan_templates (1 minute)

## ⚡ Résumé en 3 Étapes

1. **Ouvrir** : https://supabase.com/dashboard/project/dqsbfnsicmzovlrhuoif/sql
2. **Copier-coller** : Le SQL ci-dessous
3. **Cliquer** : "Run" (bouton vert)

C'est tout ! ✅

---

## 📋 SQL à Copier-Coller

```sql
-- Créer la table bilan_templates
CREATE TABLE IF NOT EXISTS bilan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_bilan_templates_coach_id ON bilan_templates(coach_id);

-- Politiques RLS
ALTER TABLE bilan_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Templates système visibles par tous" ON bilan_templates;
CREATE POLICY "Templates système visibles par tous"
  ON bilan_templates FOR SELECT
  USING (coach_id IS NULL OR auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches peuvent créer leurs templates" ON bilan_templates;
CREATE POLICY "Coaches peuvent créer leurs templates"
  ON bilan_templates FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches peuvent modifier leurs templates" ON bilan_templates;
CREATE POLICY "Coaches peuvent modifier leurs templates"
  ON bilan_templates FOR UPDATE
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches peuvent supprimer leurs templates" ON bilan_templates;
CREATE POLICY "Coaches peuvent supprimer leurs templates"
  ON bilan_templates FOR DELETE
  USING (auth.uid() = coach_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bilan_templates_updated_at ON bilan_templates;
CREATE TRIGGER update_bilan_templates_updated_at
  BEFORE UPDATE ON bilan_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer le Bilan Initial système
INSERT INTO bilan_templates (id, name, coach_id, sections)
VALUES (
  'system-default-bilan-initial',
  'Bilan Initial',
  NULL,
  '{
    "informations_generales": {
      "title": "Informations Générales",
      "fields": [
        {"label": "Prénom", "type": "text", "required": true},
        {"label": "Nom", "type": "text", "required": true},
        {"label": "Date de naissance", "type": "date", "required": true},
        {"label": "Sexe", "type": "select", "options": ["Homme", "Femme", "Autre"], "required": true},
        {"label": "Taille (cm)", "type": "number", "required": true},
        {"label": "Poids actuel (kg)", "type": "number", "required": true},
        {"label": "Email", "type": "email", "required": true},
        {"label": "Téléphone", "type": "tel", "required": false}
      ]
    },
    "objectif": {
      "title": "Objectif",
      "fields": [
        {"label": "Quel est votre objectif principal?", "type": "textarea", "required": true},
        {"label": "Poids souhaité (kg)", "type": "number", "required": false},
        {"label": "Délai souhaité", "type": "text", "required": false}
      ]
    },
    "vie_quotidienne": {
      "title": "Vie Quotidienne",
      "fields": [
        {"label": "Profession", "type": "text", "required": false},
        {"label": "Niveau d''activité physique", "type": "select", "options": ["Sédentaire", "Légèrement actif", "Modérément actif", "Très actif", "Extrêmement actif"], "required": true}
      ]
    },
    "alimentation": {
      "title": "Alimentation",
      "fields": [
        {"label": "Allergies alimentaires", "type": "textarea", "required": false},
        {"label": "Aliments que vous n''aimez pas", "type": "textarea", "required": false},
        {"label": "Habitudes alimentaires actuelles", "type": "textarea", "required": false}
      ]
    }
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
```

---

## ✅ Résultat Attendu

Après avoir cliqué sur "Run", vous verrez :
- ✅ "Success" (ou aucun message d'erreur)
- ✅ La table `bilan_templates` est créée
- ✅ Le "Bilan Initial" est importé

---

## 🎉 Après l'Exécution

1. Rafraîchissez votre application : https://virtusofficiel.netlify.app
2. Connectez-vous en tant que coach
3. Allez sur "Nouveau Bilan"
4. **Le "Bilan Initial" devrait apparaître !** 🎊

---

## ❓ En Cas de Problème

Si vous voyez une erreur, envoyez-moi une capture d'écran et je vous aiderai immédiatement.
