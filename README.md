# 📚 Gestion des Étudiants

Une application web développée avec **Node.js**, **Express.js** et **MySQL** permettant la gestion complète des étudiants : ajout, modification, suppression, affichage et **export en CSV**.

## 🛠️ Stack technique

- **Backend** : Node.js + Express.js
- **Base de données** : MySQL
- **Modules utilisés** :
  - `express`
  - `mysql2`
  - `dotenv`
  - `nodemon`
  - `csv-writer`
  - `body-parser`

## 📦 Fonctionnalités

- ✅ Ajouter un nouvel étudiant
- ✅ Modifier les informations d’un étudiant
- ✅ Supprimer un étudiant
- ✅ Afficher la liste des étudiants
- ✅ **Exporter les données en CSV**

Export CSV
Tu peux exporter la liste complète des étudiants au format CSV avec l'endpoint suivant :

GET /etudiants/export

Résultat :
Un fichier etudiants.csv est généré dans le dossier /exports.

Colonnes du CSV :

id

nom

prenom

email

note_math

note_phys