const express = require('express');
const reservationController = require('../controllers/reservationController');
const { protect, restrictTo } = require('../controllers/userController'); // Authentification et autorisation
const { verifyToken } = require('../middlewares/authMiddleware'); // Assure-toi du bon chemin

const router = express.Router();

// Vérification du token pour toutes les routes
router.use(verifyToken);

// Route pour créer une réservation (réservée aux utilisateurs authentifiés)
router.post('/', protect, reservationController.addReservation);

// Route pour modifier une réservation spécifique (réservée aux utilisateurs authentifiés)
router.put('/:id', protect, reservationController.updateReservation);

// Route pour annuler une réservation spécifique (réservée aux utilisateurs authentifiés)
router.patch('/:id/cancel', protect, reservationController.cancelReservation);

// Route pour lister toutes les réservations d'un utilisateur spécifique (réservée aux utilisateurs authentifiés)
router.get('/user/:userId', protect, reservationController.getReservationsByUser);

module.exports = router;