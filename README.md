# Parking Intelligent

## Introduction

### Contexte et problématique
Dans les grandes villes, en particulier à Dakar, la recherche d’une place de stationnement est une problématique courante qui engendre des pertes de temps et une pollution accrue. Un système intelligent de gestion de parking peut améliorer cette situation en permettant aux conducteurs de connaître en temps réel la disponibilité des places et de réserver à l’avance.

### Exemple de Solution : Le Parking Intelligent à l'Aéroport de Nice
L'aéroport de Nice a mis en place un système de parking intelligent qui repose sur des capteurs pour connaître en temps réel la disponibilité des places. L'information est relayée via une application mobile, permettant aux conducteurs de trouver rapidement une place libre.

### Objectif du projet
Ce projet vise à développer un Smart Parking Assistant, une plateforme interactive qui permet :
- Suivi en temps réel de l’occupation des places.
- Réservation de places via une interface web.
- Statistiques sur l’utilisation du parking.
- Intégration de capteurs à ultrasons pour la détection des véhicules.
- Intégration d’un capteur de flamme et d’une pompe à eau pour la sécurité incendie.

### Public cible
- Administrateurs de parkings (privés).
- Conducteurs souhaitant stationner facilement et rapidement.

## Rôles de l'administrateur et de l'utilisateur

### Rôle de l'Administrateur
L'administrateur peut :
- Ajouter/Supprimer des places.
- Suivre les statistiques d'utilisation.
- Gérer les réservations (modification, annulation).
- Définir le coût du stationnement.
- Gérer les utilisateurs (ajout, modification).

### Rôle de l'Utilisateur
L'utilisateur peut :
- S'inscrire et se connecter.
- Rechercher le parking le plus proche.
- Consulter la disponibilité en temps réel.
- Réserver une place et recevoir un QR code pour validation.
- Modifier ou annuler sa réservation.

## Architecture du projet

### Technologies utilisées
- **Frontend** : Angular 18
- **Backend** : Node.js avec Express.js
- **Base de données** : MongoDB
- **Capteurs IoT** : ESP32, HC-SR04, etc.
- **Communication** : WebSockets

### Schéma de l’architecture
Les capteurs détectent la présence des véhicules et transmettent les données à l'ESP32, qui envoie les données au serveur via WebSockets. Le backend met à jour la base de données et envoie les mises à jour à l'interface Angular.

## Fonctionnalités principales
- **Affichage en temps réel** : Plan interactif avec état des places.
- **Réservation de places** : Formulaire de réservation et génération de QR Code.
- **Statistiques et rapports** : Taux d’occupation, heures de forte affluence.
- **Notifications** : Alertes lorsque le parking est presque plein.

## Implémentation technique

### Backend (Node.js + Express + WebSockets)
- **Routes principales** :
  - `GET /places`: Récupérer l’état des places.
  - `POST /réservations`: Réserver une place.
  - `DELETE /réservations/:id`: Annuler une réservation.

### Frontend (Angular)
- **Vue principale** : Carte interactive, formulaire de réservation.
- **Communication avec le backend** : Service Angular pour appeler l’API.

## Démonstration et Tests
- Simulation avec ESP32 pour tester les capteurs.
- Test des WebSockets pour vérifier la mise à jour en temps réel.

## Conclusion et Perspectives
Ce projet apporte une solution innovante pour la gestion intelligente du stationnement, optimisant ainsi l’expérience des conducteurs et la gestion des parkings privés. Il contribue également à la réduction du trafic urbain et de l'impact environnemental.

## Installation et utilisation
1. Clonez le dépôt : `git clone <url-du-dépôt>`
2. Installez les dépendances :
   - Pour le frontend : `npm install`
   - Pour le backend : `npm install`
3. Lancez le serveur backend : `node server.js`
4. Démarrez l'application frontend : `ng serve`

## Auteurs
- [Fatoumata Hawa Ndiongue]

## License
Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
