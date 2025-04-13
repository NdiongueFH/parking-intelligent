const express = require('express');
const parkingController = require('../controllers/ParkingController');
const userController = require('../controllers/userController'); // Importer le userController pour la protection et les rôles
const { verifyToken } = require('../middlewares/authMiddleware'); // Assure-toi du bon chemin
const router = express.Router();

// Vérification du token pour toutes les routes
router.use(verifyToken);

// Appliquer la protection et restriction d'accès aux routes sensibles
// Protéger toutes les routes de parking
router.use(userController.protect); // L'utilisateur doit être authentifié

// Route pour récupérer tous les parkings (accessible à tout utilisateur connecté)
router.get('/', userController.protect, parkingController.getAllParkings);


// Route pour obtenir le total des parkings
router.get('/total', parkingController.restrictTo('administrateur'), parkingController.getTotalParkings);


// Route pour récupérer un parking par ID (accessible à tout utilisateur connecté)
router.get('/:id', userController.protect, parkingController.getParkingById);

// Route pour récupérer un parking par son nom
router.get('/nom/:nom', userController.protect, parkingController.getParkingByName); // Recherche par nom

// Routes pour gérer les parkings (ajout, modification, suppression) réservées à l'administrateur
// Ces routes sont protégées et uniquement accessibles par un administrateur
router.post('/', userController.restrictTo('administrateur'), parkingController.addParking); // Accessible uniquement aux administrateurs
router.put('/:id', userController.restrictTo('administrateur'), parkingController.updateParking); // Accessible uniquement aux administrateurs
router.delete('/:id', userController.restrictTo('administrateur'), parkingController.deleteParking); // Accessible uniquement aux administrateurs

module.exports = router;