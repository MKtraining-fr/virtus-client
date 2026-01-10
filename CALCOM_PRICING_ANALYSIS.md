# Analyse Tarification Cal.com pour Virtus Multi-Coaches

## 📊 Grille tarifaire Cal.com

### Plan Free (Gratuit)
- **Prix** : Gratuit à vie
- **Utilisateurs** : 1 utilisateur uniquement
- **Fonctionnalités** :
  - Calendriers illimités
  - Types d'événements illimités
  - Workflows
  - Intégrations
  - Paiements Stripe
  - Cal Video (visio gratuite)

### Plan Teams
- **Prix** : **15$/mois par utilisateur**
- **Essai** : 14 jours gratuits
- **Fonctionnalités** :
  - Tout du plan Free +
  - 1 équipe
  - Round-robin
  - Événements collectifs
  - Routing forms
  - Insights
  - Remove branding
  - Support same-day
  - 750 crédits par utilisateur

### Plan Organizations
- **Prix** : **37$/mois par utilisateur**
- **Essai** : 14 jours gratuits
- **Fonctionnalités** :
  - Tout du plan Teams +
  - 1 équipe parent + sous-équipes illimitées
  - Subdomain personnalisé (yourcompany.cal.com)
  - SOC2, HIPAA, ISO 27001
  - SAML SSO et SCIM
  - Whitelabeling complet
  - Support prioritaire
  - 1000 crédits par utilisateur

### Plan Enterprise
- **Prix** : Sur devis
- **Fonctionnalités** :
  - Tout du plan Organizations +
  - Base de données dédiée
  - Active directory sync
  - Support dédié 24/7
  - SLA 99.9%

---

## 🤔 Analyse pour Virtus (Plateforme multi-coaches)

### ❌ Problème identifié : **Architecture inadaptée**

Cal.com est conçu pour :
1. **Une entreprise avec plusieurs employés** (modèle Teams/Organizations)
2. **Chaque utilisateur = un employé de l'entreprise**
3. **Facturation par utilisateur**

**Votre cas :** Virtus est une **plateforme** où :
- Chaque coach est **indépendant**
- Chaque coach a ses propres clients
- Les coaches ne font pas partie d'une même organisation

### 💰 Coût pour Virtus avec Cal.com

**Scénario 1 : Plan Teams**
- 10 coaches = 10 utilisateurs × 15$/mois = **150$/mois**
- 50 coaches = 50 utilisateurs × 15$/mois = **750$/mois**
- 100 coaches = 100 utilisateurs × 15$/mois = **1500$/mois**

**Scénario 2 : Plan Organizations**
- 10 coaches = 10 utilisateurs × 37$/mois = **370$/mois**
- 50 coaches = 50 utilisateurs × 37$/mois = **1850$/mois**
- 100 coaches = 100 utilisateurs × 37$/mois = **3700$/mois**

### ⚠️ Problèmes supplémentaires

1. **Modèle économique** : Vous payez pour chaque coach, même s'il n'utilise pas le système
2. **Scalabilité** : Plus vous avez de coaches, plus ça coûte cher
3. **Gestion** : Vous devez créer/supprimer des utilisateurs manuellement
4. **Branding** : Les coaches verront "Cal.com" (sauf plan Organizations)

---

## ✅ Solutions alternatives recommandées

### **Option 1 : Daily.co (Recommandé) 💚**

**Avantages :**
- API de visioconférence pure (pas de calendrier)
- **Tarification par minutes** de visio, pas par utilisateur
- Parfait pour une plateforme multi-tenants
- Intégration simple dans Virtus
- Pas de limite d'utilisateurs

**Tarification Daily.co :**
- **Plan Free** : 10 000 minutes/mois gratuites
- **Plan Starter** : 9$/mois pour 50 000 minutes
- **Plan Growth** : 99$/mois pour 500 000 minutes

**Calcul pour Virtus :**
- 1 RDV = 60 minutes en moyenne
- 10 000 minutes gratuites = **166 RDV/mois gratuits**
- 50 000 minutes = **833 RDV/mois pour 9$**
- 500 000 minutes = **8 333 RDV/mois pour 99$**

**Exemple :** 
- 50 coaches × 20 RDV/mois = 1000 RDV = 60 000 minutes = **9$/mois** 🎉

---

### **Option 2 : Jitsi Meet (Open Source) 💚**

**Avantages :**
- 100% gratuit et open source
- Auto-hébergeable ou utiliser le service public
- Pas de limite d'utilisateurs
- Pas de limite de durée
- Intégration simple (iframe ou SDK)

**Inconvénients :**
- Qualité vidéo variable sur le service public
- Nécessite self-hosting pour meilleure qualité
- Pas de features avancées (enregistrement, transcription)

**Coût :**
- **Service public** : Gratuit
- **Self-hosted** : ~20-50$/mois (serveur)

---

### **Option 3 : Whereby (Embedded) 💚**

**Avantages :**
- Spécialisé dans l'embedding de visio
- Tarification par "rooms", pas par utilisateur
- Excellent pour les plateformes

**Tarification Whereby Embedded :**
- **Starter** : 9.99$/mois pour 3 rooms
- **Pro** : 59.99$/mois pour 10 rooms
- **Business** : Sur devis pour rooms illimitées

**Stratégie :** Créer des rooms dynamiques par RDV

---

### **Option 4 : Zoom API**

**Avantages :**
- Très fiable et connu
- API complète
- Bonne qualité

**Inconvénients :**
- Plus cher que Daily.co
- Nécessite un compte Zoom Pro par coach (14.99$/mois)

---

### **Option 5 : Solution hybride (Recommandé pour MVP) 💚**

**Architecture :**
1. **Calendrier** : Développer le système de planning directement dans Virtus (ce que je fais actuellement)
2. **Visio** : Intégrer Daily.co pour la visioconférence

**Avantages :**
- Contrôle total sur le calendrier
- Coût très faible (9$/mois pour des milliers de RDV)
- Pas de dépendance à Cal.com
- Meilleure expérience utilisateur (tout dans Virtus)
- Scalable à l'infini

**Implémentation :**
```typescript
// Au lieu de Cal.com API
import { DailyCall } from '@daily-co/daily-js';

// Créer une room Daily.co pour chaque RDV
const createMeetingRoom = async (appointmentId) => {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `virtus-${appointmentId}`,
      privacy: 'private',
      properties: {
        start_video_off: true,
        start_audio_off: false
      }
    })
  });
  
  const room = await response.json();
  return room.url; // https://virtus.daily.co/virtus-abc123
};
```

---

## 🎯 Ma recommandation finale

### **Solution recommandée : Calendrier Virtus + Daily.co**

**Pourquoi :**
1. **Économique** : 9$/mois vs 1500$/mois pour 100 coaches
2. **Scalable** : Pas de limite d'utilisateurs
3. **Contrôle total** : Vous maîtrisez l'expérience utilisateur
4. **Branding** : 100% Virtus, pas de mention Daily.co
5. **Qualité** : Daily.co est utilisé par des entreprises comme Notion, Miro, etc.

**Plan d'action :**
1. ✅ Je continue à développer le système de calendrier dans Virtus (Phases 2-12)
2. ✅ J'intègre Daily.co au lieu de Cal.com (Phase 3 modifiée)
3. ✅ Coût total : **9$/mois** pour des milliers de RDV

**Alternative si budget plus élevé :**
- **Whereby Embedded Business** : ~200$/mois pour rooms illimitées
- Meilleur pour le branding (yourcompany.whereby.com)

---

## 📊 Tableau comparatif

| Solution | Coût pour 100 coaches | Scalabilité | Contrôle | Branding |
|----------|----------------------|-------------|----------|----------|
| **Cal.com Teams** | 1500$/mois | ❌ Limité | ❌ Externe | ⚠️ Partiel |
| **Cal.com Orgs** | 3700$/mois | ❌ Limité | ❌ Externe | ✅ Complet |
| **Daily.co** | 9-99$/mois | ✅ Illimité | ✅ Total | ✅ Complet |
| **Jitsi (public)** | 0$/mois | ✅ Illimité | ⚠️ Partiel | ✅ Complet |
| **Jitsi (hosted)** | 20-50$/mois | ✅ Illimité | ✅ Total | ✅ Complet |
| **Whereby** | 200$/mois | ✅ Illimité | ✅ Total | ✅ Complet |

---

## ✅ Décision à prendre

**Voulez-vous que je :**

**Option A** : Continue avec Daily.co (9$/mois, recommandé) 💚
**Option B** : Continue avec Jitsi Meet (gratuit, open source)
**Option C** : Continue avec Cal.com malgré le coût élevé
**Option D** : Explore Whereby Embedded

**Je recommande fortement l'Option A (Daily.co)** pour le meilleur rapport qualité/prix/simplicité.
