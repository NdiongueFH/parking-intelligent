const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Assurez-vous que le chemin est correct
const { verifyToken } = require('../middlewares/authMiddleware'); // Assurez-vous du bon chemin

// Route d'inscription (pas besoin de token ici)
router.post('/signup', userController.signup);

// Route de connexion via email/mot de passe (pas besoin de token ici)
router.post('/login', userController.login);

// Route de connexion via carte RFID pour administrateurs (pas besoin de token ici)
router.post('/login-rfid', userController.loginRfid);


// **Vérification du token pour toutes les autres routes**
router.use(verifyToken);

// Route pour la déconnexion (ajout du token dans la blacklist)
router.post('/logout', userController.logout);

// Route protégée pour obtenir les informations de l'utilisateur connecté
router.get('/me', userController.protect, userController.getMe); // Route protégée pour obtenir les informations de l'utilisateur

// Mettre à jour son propre profil (Nom, Prénom, Téléphone, etc.)
router.patch('/me', userController.protect, userController.updateMe);

// Mettre à jour son propre mot de passe
router.patch('/updatePassword', userController.protect, userController.updatePassword);

module.exports = router;