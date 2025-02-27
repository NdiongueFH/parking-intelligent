const express = require('express');
const placeParkingController = require('../controllers/PlaceParkingController');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Assure-toi du bon chemin

const router = express.Router();

// Vérification du token pour toutes les routes
router.use(verifyToken);

// Routes protégées - nécessitent authentification et rôle administrateur
router.post('/',
    userController.protect, // D'abord vérifier l'authentification
    userController.restrictTo('administrateur'), // Ensuite vérifier le rôle
    placeParkingController.addPlaceParking
);

// Appliquer le même principe aux autres routes nécessitant des permissions
router.put('/:id',
    userController.protect,
    userController.restrictTo('administrateur'),
    placeParkingController.updatePlaceParking
);

router.delete('/:id',
    userController.protect,
    userController.restrictTo('administrateur'),
    placeParkingController.deletePlaceParking
);

// Routes publiques ou qui nécessitent seulement authentification
router.get('/', userController.protect, placeParkingController.getAllPlacesParking);
router.get('/:id', userController.protect, placeParkingController.getPlaceParkingById);
router.get('/parking/:parkingId', userController.protect, placeParkingController.getPlacesByParkingId);

module.exports = router;