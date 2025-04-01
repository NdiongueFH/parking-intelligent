const Parking = require('../models/parking');
const PlaceParking = require('../models/placeParking'); // Importer le modèle PlaceParking
const userController = require('../controllers/userController'); // Importer le contrôleur des utilisateurs


// Récupérer tous les parkings avec les places réservées et libres
exports.getAllParkings = async(req, res) => {
    try {
        const parkings = await Parking.find();

        // Préparer un tableau des parkings avec les places réservées et libres
        const parkingsWithPlacesInfo = await Promise.all(parkings.map(async(parking) => {
            const placesLibres = await PlaceParking.countDocuments({
                parkingId: parking._id,
                statut: 'libre'
            });

            const placesReservees = await PlaceParking.countDocuments({
                parkingId: parking._id,
                statut: 'reservee'
            });

            // Enlever le champ _id ici n'est plus nécessaire
            const parkingData = parking.toObject(); // Gardez l'_id

            // Ajouter les informations des places libres et réservées
            parkingData.placesLibres = placesLibres;
            parkingData.placesReservees = placesReservees;

            return parkingData;
        }));

        res.status(200).json(parkingsWithPlacesInfo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Récupérer un parking par son ID avec le nombre de places libres et réservées
exports.getParkingById = async(req, res) => {
    try {
        const parking = await Parking.findById(req.params.id);
        if (!parking) {
            return res.status(404).json({ message: 'Parking non trouvé' });
        }

        // Comptage des places libres et réservées
        const placesLibres = await PlaceParking.countDocuments({
            parkingId: req.params.id,
            statut: 'libre'
        });

        const placesReservees = await PlaceParking.countDocuments({
            parkingId: req.params.id,
            statut: 'reservee'
        });

        // Supprimer le champ _id (ou parkingId) avant d'envoyer la réponse
        const { _id, ...parkingData } = parking.toObject(); // Enlever _id

        // Ajouter les informations des places libres et réservées
        parkingData.placesLibres = placesLibres;
        parkingData.placesReservees = placesReservees;

        res.status(200).json(parkingData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Récupérer un parking par son nom
exports.getParkingByName = async(req, res) => {
    try {
        const parking = await Parking.findOne({ nom_du_parking: req.params.nom });
        if (!parking) {
            return res.status(404).json({ message: 'Parking non trouvé' });
        }

        // Comptage des places libres et réservées
        const placesLibres = await PlaceParking.countDocuments({
            parkingId: parking._id, // On utilise l'_id du parking trouvé
            statut: 'libre'
        });

        const placesReservees = await PlaceParking.countDocuments({
            parkingId: parking._id,
            statut: 'reservee'
        });

        // Supprimer le champ _id (ou parkingId) avant d'envoyer la réponse
        const { _id, ...parkingData } = parking.toObject(); // Enlever _id

        // Ajouter les informations des places libres et réservées
        parkingData.placesLibres = placesLibres;
        parkingData.placesReservees = placesReservees;

        res.status(200).json(parkingData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// Ajouter un nouveau parking
exports.addParking = async(req, res) => {
    const { nom_du_parking, adresse, latitude, longitude, capaciteTotale } = req.body;

    // Vérification des champs requis
    if (!nom_du_parking || !adresse || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const parking = new Parking({
        nom_du_parking,
        adresse,
        latitude,
        longitude,
        capaciteTotale: capaciteTotale || 0 // Définit à 0 si non spécifié
    });

    try {
        const newParking = await parking.save();

        // Créer des places de parking si la capacité totale est supérieure à 0
        if (capaciteTotale > 0) {
            const places = [];
            // Calculer les numéros de capteurs de manière incrémentale
            let capteurId = await PlaceParking.countDocuments(); // Nombre de places existantes dans la base de données (pour reprendre la numérotation)
            for (let i = 1; i <= capaciteTotale; i++) {
                places.push({
                    parkingId: newParking._id,
                    nomPlace: `P ${i}`,
                    statut: 'libre',
                    typeVehicule: 'voiture', // Tu peux ajuster cela selon tes besoins
                    capteurId: capteurId + i // Incrémentation du capteur pour chaque place
                });
            }
            await PlaceParking.insertMany(places); // Insérer toutes les places en une fois
        }

        res.status(201).json(newParking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Modifier un parking existant
exports.updateParking = async(req, res) => {
    try {
        const parking = await Parking.findById(req.params.id);
        if (!parking) {
            return res.status(404).json({ message: 'Parking non trouvé' });
        }

        // Mettre à jour les champs
        parking.nom_du_parking = req.body.nom_du_parking || parking.nom_du_parking;
        parking.adresse = req.body.adresse || parking.adresse;
        parking.latitude = req.body.latitude || parking.latitude;
        parking.longitude = req.body.longitude || parking.longitude;
        parking.capaciteTotale = req.body.capaciteTotale || parking.capaciteTotale;

        const updatedParking = await parking.save();
        // Supprimer le champ _id (ou parkingId) avant de renvoyer la réponse
        const { _id, ...updatedParkingData } = updatedParking.toObject(); // Enlever _id
        res.status(200).json(updatedParkingData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Supprimer un parking
exports.deleteParking = async(req, res) => {
    try {
        const parking = await Parking.findById(req.params.id);
        if (!parking) {
            return res.status(404).json({ message: 'Parking non trouvé' });
        }

        // Utiliser findByIdAndDelete pour supprimer le parking
        await Parking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Parking supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Middleware pour restreindre l'accès aux rôles spécifiques
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Vous n\'avez pas la permission d\'effectuer cette action'
            });
        }
        next();
    };
};

// Ajouter la protection et la restriction d'accès dans les routes
exports.protectParkingRoutes = (router) => {
    // Ajouter la protection sur toutes les routes de parking
    router.use(userController.protect); // L'utilisateur doit être authentifié

    // Appliquer restrictTo pour les actions réservées à l'administrateur
    router.post('/', userController.restrictTo('administrateur'), exports.addParking); // Ajouter un parking
    router.put('/:id', userController.restrictTo('administrateur'), exports.updateParking); // Modifier un parking
    router.delete('/:id', userController.restrictTo('administrateur'), exports.deleteParking); // Supprimer un parking
};