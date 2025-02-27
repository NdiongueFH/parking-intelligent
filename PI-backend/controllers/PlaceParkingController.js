const PlaceParking = require('../models/placeParking');
const Parking = require('../models/parking'); // Assurez-vous d'importer le modèle Parking

// Ajouter une place de parking
exports.addPlaceParking = async(req, res) => {
    try {
        const { parkingId, nomPlace, statut, typeVehicule } = req.body;

        // Validation des champs
        if (!parkingId || !nomPlace || !typeVehicule) {
            return res.status(400).json({ message: 'Tous les champs sont requis' });
        }

        const newPlaceParking = new PlaceParking({
            parkingId,
            nomPlace,
            statut: statut || 'libre', // Par défaut, une place est libre
            typeVehicule
        });

        // Sauvegarde de la place de parking
        const savedPlaceParking = await newPlaceParking.save();

        // Mise à jour de la capacité totale du parking
        const parking = await Parking.findById(parkingId);
        if (parking) {
            parking.capaciteTotale += 1; // Incrémenter la capacité du parking
            await parking.save(); // Sauvegarder la mise à jour
        }

        res.status(201).json({
            message: 'Place de parking ajoutée avec succès',
            placeParking: savedPlaceParking
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Récupérer toutes les places de parking
exports.getAllPlacesParking = async(req, res) => {
    try {
        const placesParking = await PlaceParking.find();

        res.status(200).json({
            status: 'success',
            results: placesParking.length,
            data: { placesParking }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Récupérer une place de parking par son ID
exports.getPlaceParkingById = async(req, res) => {
    try {
        const placeParking = await PlaceParking.findById(req.params.id);

        if (!placeParking) {
            return res.status(404).json({ message: 'Place de parking non trouvée' });
        }

        res.status(200).json(placeParking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Récupérer les places de parking par parkingId
exports.getPlacesByParkingId = async(req, res) => {
    try {
        const placesParking = await PlaceParking.find({ parkingId: req.params.parkingId });

        if (placesParking.length === 0) {
            return res.status(404).json({ message: 'Aucune place de parking trouvée pour ce parking' });
        }

        res.status(200).json(placesParking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Modifier une place de parking
exports.updatePlaceParking = async(req, res) => {
    try {
        const { statut, typeVehicule } = req.body;

        // Mettre à jour la place de parking
        const updatedPlaceParking = await PlaceParking.findByIdAndUpdate(
            req.params.id, { statut, typeVehicule }, { new: true, runValidators: true }
        );

        if (!updatedPlaceParking) {
            return res.status(404).json({ message: 'Place de parking non trouvée' });
        }

        res.status(200).json(updatedPlaceParking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Dans PlaceParkingController.js
exports.updatePlaceStatus = async(req, res) => {
    try {
        const { statut } = req.body;

        if (!['libre', 'occupee', 'reservee', 'hors service'].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const updatedPlace = await PlaceParking.findByIdAndUpdate(
            req.params.id, { statut }, { new: true }
        );

        if (!updatedPlace) {
            return res.status(404).json({ message: 'Place de parking non trouvée' });
        }

        res.status(200).json(updatedPlace);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// Supprimer une place de parking
exports.deletePlaceParking = async(req, res) => {
    try {
        const placeParking = await PlaceParking.findById(req.params.id);

        if (!placeParking) {
            return res.status(404).json({ message: 'Place de parking non trouvée' });
        }

        const parkingId = placeParking.parkingId;

        // Suppression de la place de parking
        await PlaceParking.findByIdAndDelete(req.params.id);

        // Mise à jour de la capacité totale du parking
        const parking = await Parking.findById(parkingId);
        if (parking) {
            parking.capaciteTotale -= 1; // Décrémenter la capacité du parking
            await parking.save(); // Sauvegarder la mise à jour
        }

        res.status(200).json({ message: 'Place de parking supprimée avec succès' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};