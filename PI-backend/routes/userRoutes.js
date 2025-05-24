const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Assure-toi du bon chemin

// Route mot de passe oublie
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);


// Vérification du token pour toutes les routes
router.use(verifyToken);

// Middleware pour protéger les routes et restreindre l'accès selon les rôles
router.use(userController.protect); // Toutes les routes ci-dessous nécessitent une authentification

// Obtenir tous les utilisateurs (réservé à l'administrateur)
router.get('/', userController.restrictTo('administrateur'), userController.getAllUsers);

// Obtenir le total des utilisateurs
router.get('/total-users', userController.restrictTo('administrateur'), userController.getTotalUsers);

// Obtenir le total des administrateurs
router.get('/total-admins', userController.restrictTo('administrateur'), userController.getTotalAdmins);

// Obtenir un utilisateur spécifique par son ID
router.get('/:id', userController.getUser); // Retirer la restriction d'administrateur

// Rechercher un utilisateur par téléphone (réservé à l'administrateur)
router.get('/telephone/:telephone', userController.restrictTo('administrateur'), userController.getUserByTelephone);


// Mettre à jour un utilisateur par son ID (réservé à l'administrateur)
router.patch('/:id', userController.restrictTo('administrateur'), userController.updateUser);

// Route pour mettre à jour un utilisateur (tout sauf le mot de passe)
router.patch('/update/:id', userController.restrictTo('administrateur'), userController.updateUser);

// Supprimer un utilisateur (réservé à l'administrateur)
router.delete('/:id', userController.restrictTo('administrateur'), userController.deleteUser);

// Route pour déposer de l'argent
router.post('/deposit', userController.restrictTo('administrateur'), userController.deposit);

// Route pour retirer de l'argent
router.post('/withdraw', userController.restrictTo('administrateur'), userController.withdraw);



module.exports = router;