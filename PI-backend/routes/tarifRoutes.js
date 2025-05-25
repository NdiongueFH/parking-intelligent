const express = require('express');
const tarifController = require('../controllers/tarifStationnementController');
const { protect, restrictTo } = require('../controllers/userController'); // Importer les middlewares d'authentification et de rôle
const { verifyToken } = require('../middlewares/authMiddleware'); // Assure-toi du bon chemin

const router = express.Router();

// Vérification du token pour toutes les routes
router.use(verifyToken);

// Route pour ajouter un tarif (réservée aux administrateurs)
router.post('/', protect, restrictTo('administrateur'), tarifController.addTarifStationnement);

// Route pour récupérer tous les tarifs pour un parking spécifique (accessible à tout utilisateur authentifié)
router.get('/:parkingId', protect, tarifController.getTarifsByParkingId);

// Route pour récupérer un tarif spécifique (accessible à tout utilisateur authentifié)
router.get('/details/:id', protect, tarifController.getTarifById);

// Route pour mettre à jour un tarif spécifique (réservée aux administrateurs)
router.put('/:id', protect, restrictTo('administrateur'), tarifController.updateTarif);

// Route pour supprimer un tarif spécifique (réservée aux administrateurs)
router.delete('/:id', protect, restrictTo('administrateur'), tarifController.deleteTarif);

module.exports = router;