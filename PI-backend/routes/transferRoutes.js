const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Assurez-vous du bon chemin

// Vérification du token pour toutes les routes
router.use(verifyToken);

// Middleware pour protéger les routes et restreindre l'accès selon les rôles
router.use(userController.protect); // Toutes les routes ci-dessous nécessitent une authentification

// Route pour obtenir la liste des transactions
router.get('/', userController.restrictTo('administrateur'), transferController.getAllTransfers);

module.exports = router;