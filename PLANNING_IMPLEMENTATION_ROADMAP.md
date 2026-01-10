# Plan d'Implémentation du Système de Planning/Calendrier - Virtus

## 📋 Vue d'ensemble

Ce document présente le plan complet d'implémentation du système de planning et de gestion des rendez-vous pour la plateforme Virtus, permettant aux coaches et clients de gérer leurs rendez-vous avec visioconférence intégrée.

---

## 🎯 Objectifs principaux

1. **Gestion complète des rendez-vous** pour coaches et clients
2. **Visioconférence intégrée** (Cal Video via Cal.com)
3. **Interface intuitive** pour la prise et la gestion des rendez-vous
4. **Notifications automatiques** pour les rendez-vous à venir
5. **Flexibilité** dans les types et paramètres de rendez-vous

---

## 📊 Récapitulatif des fonctionnalités

### 🎓 Côté Coach

#### Navigation & Interface
- ✅ Nouveau bouton **"Planning"** dans la barre latérale (sous Messagerie)
- ✅ Page dédiée au planning avec vue calendrier complète
- ✅ Widget **"Rendez-vous du jour"** sur le Dashboard
  - Bouton vert si rendez-vous aujourd'hui
  - Bouton gris/désactivé si aucun rendez-vous
  - Vue déroulante avec calendrier (semaine/mois)
  - Hover sur rendez-vous → détails
  - Clic sur rendez-vous → interface complète

#### Gestion des rendez-vous
- ✅ Créer un rendez-vous avec :
  - Client existant OU prospect (non dans la base)
  - Type de rendez-vous (visio, téléphone, présentiel)
  - Durée personnalisée
  - Intitulé et motif
  - Commentaires
- ✅ Modifier/Annuler un rendez-vous
- ✅ Génération automatique de lien visio (Cal Video)

#### Paramétrage
- ✅ Page **"Paramètres du Planning"**
  - Créer des types de rendez-vous personnalisés
  - Définir des durées par défaut
  - Configurer les disponibilités
  - Gérer les paramètres de visioconférence
  - Définir les motifs de rendez-vous (liste déroulante)

### 👤 Côté Client

#### Navigation & Interface
- ✅ Nouveau bouton déroulant **"Planning"** ou **"Mes Rendez-vous"**
  - Position : Entre "Mes Documents" et "Paramètres du compte"
- ✅ Liste des rendez-vous prévus avec le coach
- ✅ Accès au planning du coach pour réserver

#### Réservation de rendez-vous
- ✅ Bouton **"Prendre un rendez-vous"**
- ✅ Accès au planning du coach (créneaux disponibles)
- ✅ Sélection :
  - Créneau horaire
  - Type de rendez-vous (visio, téléphone, etc.)
  - Motif (liste déroulante)
  - Commentaires additionnels
- ✅ Validation et confirmation automatique
- ✅ Réception du lien visio

#### Gestion
- ✅ Voir les détails d'un rendez-vous
- ✅ Annuler un rendez-vous (avec délai configurable)
- ✅ Rejoindre la visio au moment du rendez-vous

---

## 🏗️ Architecture technique

### Base de données (Supabase)

#### Nouvelle table : `appointments`
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES profiles(id), -- NULL si prospect
  prospect_email VARCHAR(255), -- Si client_id est NULL
  prospect_name VARCHAR(255), -- Si client_id est NULL
  appointment_type_id UUID REFERENCES appointment_types(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  meeting_type VARCHAR(50) NOT NULL, -- video, phone, in_person
  meeting_url TEXT, -- Lien Cal Video
  meeting_id VARCHAR(255), -- ID de la réunion Cal Video
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Nouvelle table : `appointment_types`
```sql
CREATE TABLE appointment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES profiles(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_duration INTEGER NOT NULL, -- en minutes
  color VARCHAR(7), -- Code couleur hex pour le calendrier
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Nouvelle table : `appointment_reasons`
```sql
CREATE TABLE appointment_reasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES profiles(id) NOT NULL,
  label VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Nouvelle table : `coach_availability`
```sql
CREATE TABLE coach_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES profiles(id) NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Dimanche, 1=Lundi, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Nouvelle table : `appointment_notifications`
```sql
CREATE TABLE appointment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  notification_type VARCHAR(50) NOT NULL, -- created, updated, cancelled, reminder
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Intégration Cal.com

#### Configuration
- Utilisation de **Cal.com API v2**
- Authentification via OAuth 2.0
- Création de **managed users** pour chaque coach
- Utilisation de **Cal Video** pour la visioconférence

#### Flux de création de rendez-vous
1. Coach/Client crée un rendez-vous dans Virtus
2. Appel API Cal.com pour créer l'événement
3. Récupération du lien Cal Video
4. Stockage dans la table `appointments`
5. Envoi des notifications

---

## 📅 Planning d'implémentation (12 phases)

### **Phase 1 : Préparation & Configuration** (Durée : 1-2h)
**Objectif :** Mettre en place les fondations techniques

**Tâches :**
- [ ] Créer un compte Cal.com (version cloud ou self-hosted)
- [ ] Configurer OAuth 2.0 pour Cal.com
- [ ] Obtenir les credentials API (Client ID, Secret)
- [ ] Stocker les credentials dans les variables d'environnement Supabase
- [ ] Tester la connexion API Cal.com

**Livrables :**
- Compte Cal.com configuré
- Credentials stockés de manière sécurisée
- Documentation de configuration

---

### **Phase 2 : Création des tables de base de données** (Durée : 1h)
**Objectif :** Créer toutes les tables nécessaires avec RLS

**Tâches :**
- [ ] Créer la migration pour `appointment_types`
- [ ] Créer la migration pour `appointment_reasons`
- [ ] Créer la migration pour `appointments`
- [ ] Créer la migration pour `coach_availability`
- [ ] Créer la migration pour `appointment_notifications`
- [ ] Configurer les politiques RLS pour chaque table
- [ ] Créer les index pour optimiser les requêtes
- [ ] Créer les triggers pour `updated_at`
- [ ] Appliquer les migrations via MCP Supabase

**Livrables :**
- 5 nouvelles tables créées
- Politiques RLS configurées
- Migrations versionnées

---

### **Phase 3 : Service d'intégration Cal.com** (Durée : 2-3h)
**Objectif :** Créer le service TypeScript pour interagir avec Cal.com

**Tâches :**
- [ ] Créer `src/services/calcomService.ts`
- [ ] Implémenter l'authentification OAuth
- [ ] Fonction `createManagedUser(coachId)` pour créer un utilisateur Cal.com
- [ ] Fonction `createBooking()` pour créer un rendez-vous
- [ ] Fonction `updateBooking()` pour modifier un rendez-vous
- [ ] Fonction `cancelBooking()` pour annuler un rendez-vous
- [ ] Fonction `getAvailableSlots()` pour récupérer les créneaux disponibles
- [ ] Gestion des erreurs et retry logic
- [ ] Tests unitaires

**Livrables :**
- Service Cal.com complet et testé
- Documentation des fonctions
- Gestion d'erreurs robuste

---

### **Phase 4 : Service de gestion des rendez-vous** (Durée : 2-3h)
**Objectif :** Créer le service Supabase pour les rendez-vous

**Tâches :**
- [ ] Créer `src/services/appointmentService.ts`
- [ ] Fonction `createAppointment()` - Créer rendez-vous + appel Cal.com
- [ ] Fonction `getCoachAppointments()` - Récupérer rendez-vous du coach
- [ ] Fonction `getClientAppointments()` - Récupérer rendez-vous du client
- [ ] Fonction `getAppointmentById()` - Détails d'un rendez-vous
- [ ] Fonction `updateAppointment()` - Modifier rendez-vous
- [ ] Fonction `cancelAppointment()` - Annuler rendez-vous
- [ ] Fonction `getAppointmentsForDate()` - Rendez-vous d'une date
- [ ] Fonction `getUpcomingAppointments()` - Rendez-vous à venir
- [ ] Types TypeScript pour tous les modèles

**Livrables :**
- Service complet de gestion des rendez-vous
- Intégration avec Cal.com
- Types TypeScript définis

---

### **Phase 5 : Service de gestion des types et motifs** (Durée : 1-2h)
**Objectif :** Gérer les types de rendez-vous et motifs personnalisés

**Tâches :**
- [ ] Créer `src/services/appointmentConfigService.ts`
- [ ] Fonction `createAppointmentType()` - Créer type
- [ ] Fonction `getAppointmentTypes()` - Récupérer types
- [ ] Fonction `updateAppointmentType()` - Modifier type
- [ ] Fonction `deleteAppointmentType()` - Supprimer type
- [ ] Fonction `createAppointmentReason()` - Créer motif
- [ ] Fonction `getAppointmentReasons()` - Récupérer motifs
- [ ] Fonction `updateAppointmentReason()` - Modifier motif
- [ ] Fonction `deleteAppointmentReason()` - Supprimer motif
- [ ] Créer des types/motifs par défaut lors de l'inscription coach

**Livrables :**
- Service de configuration complet
- Types/motifs par défaut créés

---

### **Phase 6 : Service de disponibilités** (Durée : 1-2h)
**Objectif :** Gérer les disponibilités du coach

**Tâches :**
- [ ] Créer `src/services/availabilityService.ts`
- [ ] Fonction `setCoachAvailability()` - Définir disponibilités
- [ ] Fonction `getCoachAvailability()` - Récupérer disponibilités
- [ ] Fonction `updateAvailability()` - Modifier disponibilités
- [ ] Fonction `deleteAvailability()` - Supprimer disponibilités
- [ ] Fonction `getAvailableSlots()` - Calculer créneaux disponibles
- [ ] Synchronisation avec Cal.com
- [ ] Gestion des exceptions (jours fériés, congés)

**Livrables :**
- Service de disponibilités fonctionnel
- Calcul intelligent des créneaux disponibles

---

### **Phase 7 : Composants UI - Calendrier** (Durée : 3-4h)
**Objectif :** Créer les composants de calendrier réutilisables

**Tâches :**
- [ ] Installer la bibliothèque de calendrier (ex: `react-big-calendar` ou `@fullcalendar/react`)
- [ ] Créer `src/components/calendar/Calendar.tsx` - Composant principal
- [ ] Créer `src/components/calendar/CalendarEvent.tsx` - Événement
- [ ] Créer `src/components/calendar/CalendarToolbar.tsx` - Barre d'outils
- [ ] Implémenter la vue jour/semaine/mois
- [ ] Gestion du drag & drop pour déplacer rendez-vous
- [ ] Hover pour afficher détails rapides
- [ ] Clic pour ouvrir modal de détails
- [ ] Responsive design (mobile, tablette, desktop)
- [ ] Thème dark mode

**Livrables :**
- Composants de calendrier complets
- Interactions fluides
- Design responsive

---

### **Phase 8 : Page Planning Coach** (Durée : 3-4h)
**Objectif :** Créer la page principale de planning du coach

**Tâches :**
- [ ] Créer `src/pages/coach/Planning.tsx`
- [ ] Intégrer le composant Calendar
- [ ] Bouton **"Nouveau rendez-vous"**
- [ ] Modal de création de rendez-vous :
  - Recherche client existant OU saisie prospect
  - Sélection type de rendez-vous
  - Sélection date/heure
  - Sélection durée
  - Type de réunion (visio/téléphone/présentiel)
  - Motif (liste déroulante)
  - Intitulé
  - Commentaires
- [ ] Affichage des rendez-vous sur le calendrier
- [ ] Filtres (par client, par type, par statut)
- [ ] Bouton vers paramètres du planning
- [ ] Gestion des erreurs et loading states

**Livrables :**
- Page Planning coach complète
- Modal de création fonctionnel
- Intégration avec services

---

### **Phase 9 : Page Paramètres du Planning Coach** (Durée : 2-3h)
**Objectif :** Permettre au coach de configurer son planning

**Tâches :**
- [ ] Créer `src/pages/coach/PlanningSettings.tsx`
- [ ] Section **"Types de rendez-vous"** :
  - Liste des types existants
  - Créer nouveau type (nom, durée, couleur, description)
  - Modifier type existant
  - Supprimer type (avec confirmation)
- [ ] Section **"Motifs de rendez-vous"** :
  - Liste des motifs
  - Créer nouveau motif
  - Réorganiser l'ordre (drag & drop)
  - Supprimer motif
- [ ] Section **"Disponibilités"** :
  - Définir horaires par jour de la semaine
  - Ajouter/supprimer plages horaires
  - Gérer les exceptions
- [ ] Section **"Paramètres de visioconférence"** :
  - Activer/désactiver Cal Video
  - Paramètres de notification
- [ ] Sauvegarde automatique
- [ ] Messages de confirmation

**Livrables :**
- Page de paramètres complète
- Configuration flexible
- UX intuitive

---

### **Phase 10 : Widget Dashboard Coach** (Durée : 2h)
**Objectif :** Afficher les rendez-vous du jour sur le dashboard

**Tâches :**
- [ ] Créer `src/components/coach/AppointmentsTodayWidget.tsx`
- [ ] Bouton avec indicateur visuel :
  - Vert si rendez-vous aujourd'hui
  - Gris si aucun rendez-vous
  - Badge avec nombre de rendez-vous
- [ ] Vue déroulante au clic :
  - Mini calendrier (vue semaine OU mois)
  - Liste des rendez-vous du jour
  - Hover sur rendez-vous → tooltip avec détails
  - Clic sur rendez-vous → modal de détails
- [ ] Bouton **"Voir tout le planning"** → redirection vers page Planning
- [ ] Intégrer dans `src/pages/coach/Dashboard.tsx`
- [ ] Position : Sous la liste des clients

**Livrables :**
- Widget fonctionnel sur le dashboard
- Navigation fluide vers planning complet

---

### **Phase 11 : Interface Client - Planning** (Durée : 3-4h)
**Objectif :** Permettre au client de gérer ses rendez-vous

**Tâches :**
- [ ] Créer `src/components/client/ClientAppointments.tsx`
- [ ] Nouveau bouton déroulant dans le profil :
  - Position : Entre "Mes Documents" et "Paramètres du compte"
  - Label : "Planning" ou "Mes Rendez-vous"
- [ ] Vue déroulée :
  - Liste des rendez-vous à venir
  - Rendez-vous passés (historique)
  - Statut de chaque rendez-vous
- [ ] Bouton **"Prendre un rendez-vous"** :
  - Affiche le calendrier du coach (créneaux disponibles uniquement)
  - Sélection créneau
  - Sélection type de rendez-vous
  - Sélection motif (liste déroulante)
  - Commentaires
  - Validation
- [ ] Détails d'un rendez-vous :
  - Date, heure, durée
  - Type et motif
  - Lien visio (si applicable)
  - Bouton **"Rejoindre la visio"** (actif 15 min avant)
  - Bouton **"Annuler"** (avec délai configurable)
- [ ] Intégrer dans `src/pages/client/ClientProfile.tsx`

**Livrables :**
- Interface client complète
- Réservation de rendez-vous fonctionnelle
- Accès aux visios

---

### **Phase 12 : Notifications & Finitions** (Durée : 2-3h)
**Objectif :** Système de notifications et polish final

**Tâches :**
- [ ] Créer `src/services/appointmentNotificationService.ts`
- [ ] Notifications en temps réel (Supabase Realtime) :
  - Nouveau rendez-vous créé
  - Rendez-vous modifié
  - Rendez-vous annulé
  - Rappel 24h avant
  - Rappel 1h avant
  - Rappel 15 min avant
- [ ] Intégration avec le système de notifications existant
- [ ] Emails de confirmation (via Supabase Edge Functions)
- [ ] Badge de notification sur l'icône Planning
- [ ] Tests end-to-end complets
- [ ] Optimisation des performances
- [ ] Documentation utilisateur
- [ ] Vidéo de démonstration

**Livrables :**
- Système de notifications complet
- Application testée et optimisée
- Documentation complète

---

## 🎨 Design & UX

### Palette de couleurs pour le calendrier
- **Rendez-vous confirmé** : Vert (#10B981)
- **Rendez-vous en attente** : Orange (#F59E0B)
- **Rendez-vous annulé** : Rouge (#EF4444)
- **Rendez-vous terminé** : Gris (#6B7280)
- **Créneau disponible** : Bleu clair (#3B82F6)

### Icônes (Lucide React)
- `Calendar` : Planning général
- `CalendarDays` : Rendez-vous du jour
- `Video` : Visioconférence
- `Phone` : Appel téléphonique
- `MapPin` : Rendez-vous présentiel
- `Clock` : Durée
- `User` : Client
- `Users` : Prospect
- `Settings` : Paramètres du planning
- `Bell` : Notifications

---

## 📊 Estimation totale

### Temps de développement
- **Phase 1** : 1-2h
- **Phase 2** : 1h
- **Phase 3** : 2-3h
- **Phase 4** : 2-3h
- **Phase 5** : 1-2h
- **Phase 6** : 1-2h
- **Phase 7** : 3-4h
- **Phase 8** : 3-4h
- **Phase 9** : 2-3h
- **Phase 10** : 2h
- **Phase 11** : 3-4h
- **Phase 12** : 2-3h

**Total estimé : 23-33 heures de développement**

### Répartition recommandée
- **Semaine 1** : Phases 1-4 (Backend & Services)
- **Semaine 2** : Phases 5-7 (Configuration & UI Components)
- **Semaine 3** : Phases 8-10 (Interface Coach)
- **Semaine 4** : Phases 11-12 (Interface Client & Finitions)

---

## 🔒 Sécurité & Conformité

### Politiques RLS
Toutes les tables auront des politiques RLS strictes :
- Coach peut voir/modifier ses propres rendez-vous
- Client peut voir ses rendez-vous avec son coach
- Prospect peut uniquement créer un rendez-vous (via lien public)

### Données sensibles
- Liens de visioconférence chiffrés
- Emails des prospects non exposés publiquement
- Logs d'audit pour toutes les modifications

### RGPD
- Consentement pour l'enregistrement des visios
- Droit à l'oubli (suppression des données prospect)
- Export des données personnelles

---

## 🚀 Améliorations futures (Post-MVP)

### Phase 2.0
- [ ] Synchronisation avec Google Calendar / Outlook
- [ ] Paiement en ligne lors de la réservation
- [ ] Salle d'attente virtuelle
- [ ] Enregistrement automatique des visios
- [ ] Transcription automatique des rendez-vous
- [ ] Rappels SMS (via Twilio)
- [ ] Statistiques avancées (taux de présence, durée moyenne, etc.)
- [ ] Rendez-vous récurrents
- [ ] Liste d'attente automatique
- [ ] Intégration avec le système de facturation

---

## 📚 Ressources & Documentation

### APIs & Bibliothèques
- **Cal.com API** : https://cal.com/docs/api-reference/v2/introduction
- **React Big Calendar** : https://jquense.github.io/react-big-calendar/
- **FullCalendar** : https://fullcalendar.io/docs/react
- **Supabase Realtime** : https://supabase.com/docs/guides/realtime

### Design Inspiration
- **Calendly** : https://calendly.com
- **Cal.com** : https://cal.com
- **Google Calendar** : https://calendar.google.com

---

## ✅ Checklist de démarrage

Avant de commencer l'implémentation, vérifier que :
- [ ] Cal.com est accessible et testé
- [ ] Les credentials API sont obtenus
- [ ] Le budget temps est validé (23-33h)
- [ ] Les maquettes/wireframes sont validés (optionnel)
- [ ] Les priorités sont définies (MVP vs Nice-to-have)
- [ ] L'équipe est briefée sur l'architecture

---

## 🎯 Critères de succès

### MVP (Minimum Viable Product)
✅ Un coach peut créer un rendez-vous avec un client  
✅ Un client peut réserver un rendez-vous avec son coach  
✅ Les rendez-vous apparaissent sur les calendriers respectifs  
✅ Les liens de visioconférence sont générés automatiquement  
✅ Les notifications de base fonctionnent  

### Version complète
✅ Tous les critères MVP  
✅ Gestion des prospects (non-clients)  
✅ Configuration complète des types et motifs  
✅ Widget dashboard fonctionnel  
✅ Système de notifications avancé  
✅ Interface responsive et intuitive  
✅ Documentation complète  

---

**Auteur :** Manus AI  
**Date de création :** 2026-01-10  
**Version :** 1.0  
**Statut :** Planification - Prêt pour implémentation
