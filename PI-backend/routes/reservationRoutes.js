const express = require('express');
const reservationController = require('../controllers/reservationController');
const { protect } = require('../controllers/userController'); // Authentification

const router = express.Router();

// Vérification du token pour toutes les routes
router.use(protect); // Assurez-vous que cela protège toutes les routes

// Route pour créer une réservation
router.post('/', reservationController.addReservation);

// Route pour modifier une réservation spécifique
router.put('/:id', reservationController.updateReservation);

// Route pour annuler une réservation spécifique
router.patch('/:id/cancel', reservationController.cancelReservation);

// Route pour lister toutes les réservations (réservée aux utilisateurs authentifiés)
router.get('/', reservationController.getAllReservations); // Assurez-vous que cette ligne est présente

// Route pour lister toutes les réservations d'un utilisateur spécifique
router.get('/user/:userId', reservationController.getReservationsByUser);

module.exports = router;