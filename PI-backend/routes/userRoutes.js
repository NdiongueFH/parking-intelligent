const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Assure-toi du bon chemin

// Vérification du token pour toutes les routes
router.use(verifyToken);

// Middleware pour protéger les routes et restreindre l'accès selon les rôles
router.use(userController.protect); // Toutes les routes ci-dessous nécessitent une authentification

// Obtenir tous les utilisateurs (réservé à l'administrateur)
router.get('/', userController.restrictTo('administrateur'), userController.getAllUsers);

// Obtenir un utilisateur spécifique par son ID
router.get('/:id', userController.restrictTo('administrateur'), userController.getUser);

// Mettre à jour un utilisateur par son ID (réservé à l'administrateur)
router.patch('/:id', userController.restrictTo('administrateur'), userController.updateUser);

// Route pour mettre à jour un utilisateur (tout sauf le mot de passe)
router.patch('/update/:id', userController.restrictTo('administrateur'), userController.updateUser);

// Supprimer un utilisateur (réservé à l'administrateur)
router.delete('/:id', userController.restrictTo('administrateur'), userController.deleteUser);

module.exports = router;