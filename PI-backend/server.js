// Importation des dépendances
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); // Si vous avez un fichier authRoutes.js
const parkingRoutes = require('./routes/parkingRoutes'); // Importer les routes des parkings
const placeParkingRoutes = require('./routes/placeParkingRoutes');
const tarifRoutes = require('./routes/tarifRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const amendeRoutes = require('./routes/amendeRoutes');




// Configuration de dotenv pour charger les variables d'environnement (si nécessaire)
dotenv.config();

// Créer une instance de l'application Express
const app = express();

// Utiliser CORS pour permettre les requêtes depuis différents domaines
app.use(cors());

// Middleware pour gérer les données JSON dans les requêtes
app.use(express.json());

// Connexion à MongoDB via Mongoose
mongoose.connect('mongodb://localhost:27017/Smart-Parking')
    .then(() => console.log('Connexion à MongoDB réussie'))
    .catch((err) => {
        console.error('Erreur de connexion à MongoDB', err);
        process.exit(1);
    });

// Récupérer la clé secrète pour JWT depuis le fichier .env
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('Erreur : JWT_SECRET n\'est pas défini dans le fichier .env');
    process.exit(1);
}

// Utilisation des routes d'utilisateur et d'authentification
app.use('/api/v1/users', userRoutes); // Routes pour les utilisateurs
app.use('/api/v1/auth', authRoutes); // Si vous avez des routes d'authentification
app.use('/api/v1/parkings', parkingRoutes); // Routes pour les parkings
app.use('/api/v1/place-parking', placeParkingRoutes); //Routes pour les places de parking
app.use('/api/v1/tarifs', tarifRoutes); //Routes pour les places de parking
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/amendes', amendeRoutes); // Utilisation des routes d'amende



// Route de base pour vérifier que le serveur fonctionnePlace 1
app.get('/', (req, res) => {
    res.send('API de gestion des utilisateurs et des parkings');
});

// Gestion des erreurs non gérées
app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `La route ${req.originalUrl} n'existe pas sur ce serveur`,
    });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Une erreur interne est survenue',
    });
});

// Démarrer le serveur sur le port spécifié
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});