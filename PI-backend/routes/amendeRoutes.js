const express = require('express');
const amendeController = require('../controllers/amendeController');
const { protect, restrictTo } = require('../controllers/userController'); // Authentification et autorisation
const { verifyToken } = require('../middlewares/authMiddleware'); // Assure-toi du bon chemin

const router = express.Router();

// Vérification du token pour toutes les routes
router.use(verifyToken);

// Route pour ajouter une amende (réservée aux administrateurs)
router.post('/', protect, restrictTo('administrateur'), amendeController.createAmende);

// Route pour récupérer toutes les amendes
router.get('/', protect, amendeController.getAllAmendes); // Cette route récupère toutes les amendes

// Route pour récupérer les amendes par reservationId
router.get('/reservation/:reservationId', protect, amendeController.getAmendesByReservationId); // Récupérer les amendes par réservation

// Route pour récupérer une amende par son ID
router.get('/:id', protect, amendeController.getAmendeById); // Cette route récupère une amende par son ID

// Route pour mettre à jour une amende spécifique (réservée aux administrateurs)
router.put('/:id', protect, restrictTo('administrateur'), amendeController.updateAmende);

// Route pour supprimer une amende spécifique (réservée aux administrateurs)
router.delete('/:id', protect, restrictTo('administrateur'), amendeController.deleteAmende);

// Route pour assigner une amende à une réservation (réservée aux administrateurs)
router.put('/assigner', protect, restrictTo('administrateur'), amendeController.assignAmendeToReservation);

module.exports = router;